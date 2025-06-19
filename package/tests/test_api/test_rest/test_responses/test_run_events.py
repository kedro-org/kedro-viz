from __future__ import annotations

import json
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any

import pytest

from kedro_viz.api.rest.responses import run_events
from kedro_viz.utils import _hash_input_output


# --------------------------------------------------------------------------- #
# Helper to make building events more readable
# --------------------------------------------------------------------------- #
def _make_event(kind: run_events.EventType, **extra: Any) -> dict[str, Any]:
    data: dict[str, Any] = {"event": kind}
    data.update(extra)
    return data


# --------------------------------------------------------------------------- #
# _create_or_update_dataset_info
# --------------------------------------------------------------------------- #
def test_dataset_info_creation_and_update() -> None:
    """Blank names are later filled; size is overwritten only when appropriate."""
    datasets: dict[str, run_events.DatasetInfo] = {}

    # first call: create entry with default AVAILABLE status
    run_events._create_dataset_info(
        datasets,
        dataset_id="sale_dataset",
        dataset_name="",
        size=None,
        status=run_events.DatasetStatus.AVAILABLE,
    )
    assert datasets["sale_dataset"].name == "" and datasets["sale_dataset"].size == 0

    # second call: update existing entry with new name and size
    run_events._update_dataset_info(
        datasets,
        dataset_id="sale_dataset",
        dataset_name="sales",
        size=111,
        status=run_events.DatasetStatus.AVAILABLE,
    )
    assert (
        datasets["sale_dataset"].name == "sales"
        and datasets["sale_dataset"].size == 111
    )


# --------------------------------------------------------------------------- #
# _update_pipeline_info_from_events
# --------------------------------------------------------------------------- #
def test_pipeline_timing_success_and_failure() -> None:
    """Successful run populates start/end; error run sets FAILED and error info."""
    now = datetime.now()
    start, end = now.isoformat(), (now + timedelta(seconds=5)).isoformat()

    ok = run_events.PipelineInfo()
    run_events._update_pipeline_info_from_events(
        [
            _make_event(run_events.EventType.BEFORE_PIPELINE_RUN, timestamp=start),
            _make_event(run_events.EventType.AFTER_PIPELINE_RUN, timestamp=end),
        ],
        ok,
    )
    assert (
        ok.start_time == start
        and ok.end_time == end
        and ok.status is run_events.PipelineStatus.SUCCESSFUL
    )

    failed = run_events.PipelineInfo()
    run_events._update_pipeline_info_from_events(
        [
            _make_event(run_events.EventType.BEFORE_PIPELINE_RUN, timestamp=start),
            _make_event(
                run_events.EventType.ON_PIPELINE_ERROR,
                timestamp=end,
                error="kaput",
                traceback="trace",
            ),
        ],
        failed,
    )
    assert failed.status is run_events.PipelineStatus.FAILED
    assert failed.error is not None and failed.error.message == "kaput"


# --------------------------------------------------------------------------- #
# node helpers
# --------------------------------------------------------------------------- #
def test_node_completion_and_error_updates() -> None:
    """A subsequent node-error overwrites status and attaches error info."""
    nodes: dict[str, run_events.NodeInfo] = {}

    run_events._process_node_completion_event(
        {
            "event": run_events.EventType.AFTER_NODE_RUN,
            "node_id": "load_customers_node",
            "status": "successful",
            "duration": 1.5,
        },
        nodes,
    )
    assert (
        nodes["load_customers_node"].status is run_events.NodeStatus.SUCCESSFUL
        and nodes["load_customers_node"].duration == 1.5
    )

    # Attach realistic error info for failure
    run_events._process_node_error_event(
        {
            "event": run_events.EventType.ON_NODE_ERROR,
            "node_id": "load_customers_node",
            "error": "DatasetLoadError: Failed to read customers.csv",
            "traceback": "Traceback (most recent call last): ...",
        },
        nodes,
    )
    info = nodes["load_customers_node"]
    assert info.status is run_events.NodeStatus.FAILED
    assert (
        info.error is not None
        and info.error.message == "DatasetLoadError: Failed to read customers.csv"
    )


def test_process_node_error_creates_entry_when_missing() -> None:
    """Ensure an ON_NODE_ERROR event creates a new NodeInfo if the node didn't pre-exist."""
    nodes: dict[str, run_events.NodeInfo] = {}
    run_events._process_node_error_event(
        {
            "event": run_events.EventType.ON_NODE_ERROR,
            "node_id": "transform_sales_node",
            "error": "TransformationError: Failed to apply discount",
            "traceback": "Traceback (most recent call last): ...",
        },
        nodes,
    )
    # A new entry should be created for transform_sales_node
    assert "transform_sales_node" in nodes
    new_info = nodes["transform_sales_node"]
    assert new_info.status is run_events.NodeStatus.FAILED
    assert (
        new_info.error is not None
        and new_info.error.message == "TransformationError: Failed to apply discount"
    )


# --------------------------------------------------------------------------- #
# dataset helpers
# --------------------------------------------------------------------------- #
def test_dataset_load_save_and_error_paths() -> None:
    """
    * load → creates entry with fallback size 0
    * save → overwrites size
    * error → marks dataset missing & sets node/pipeline status when node exists
    """
    datasets: dict[str, run_events.DatasetInfo] = {}
    # Pre-existing node for load operation
    nodes: dict[str, run_events.NodeInfo] = {
        "load_customers_node": run_events.NodeInfo()
    }
    pipeline = run_events.PipelineInfo()

    # after_dataset_loaded (bad size string → 0)
    run_events._process_dataset_event(
        {
            "event": run_events.EventType.AFTER_DATASET_LOADED,
            "node_id": "load_customers_node",
            "dataset": "customers.csv",
            "size": "oops",
        },
        datasets,
    )
    assert datasets["load_customers_node"].size == 0

    # after_dataset_saved (size overwritten)
    run_events._process_dataset_event(
        {
            "event": run_events.EventType.AFTER_DATASET_SAVED,
            "node_id": "load_customers_node",
            "dataset": "customers.csv",
            "size": 128,
        },
        datasets,
    )
    assert datasets["load_customers_node"].size == 128

    # dataset error
    run_events._process_dataset_error_event(
        {
            "event": run_events.EventType.ON_PIPELINE_ERROR,
            "dataset": "customers.csv",
            "node_id": "load_customers_node",
            "node": "load_customers_node",
            "operation": "load",
            "error": "DatasetLoadError: Failed to read customers.csv",
            "traceback": "Traceback (most recent call last): ...",
        },
        datasets,
        nodes,
        pipeline,
    )
    hashed = _hash_input_output("customers.csv")
    assert datasets[hashed].status is run_events.DatasetStatus.MISSING
    assert nodes["load_customers_node"].status is run_events.NodeStatus.FAILED
    assert pipeline.status is run_events.PipelineStatus.FAILED


def test_dataset_error_second_occurrence_updates_existing_entry() -> None:
    """Second error for the same dataset replaces its error message."""
    datasets: dict[str, run_events.DatasetInfo] = {}
    nodes: dict[str, run_events.NodeInfo] = {}
    pipeline = run_events.PipelineInfo()

    first_event = {
        "event": run_events.EventType.ON_PIPELINE_ERROR,
        "dataset": "customers.csv",
        "node_id": "load_customers_node",
        "node": "load_customers_node",
        "operation": "load",
        "error": "DatasetLoadError: Failed to read customers.csv",
        "traceback": "Traceback (most recent call last): ...",
    }
    run_events._process_dataset_error_event(first_event, datasets, nodes, pipeline)

    run_events._process_dataset_error_event(
        {**first_event, "error": "second"}, datasets, nodes, pipeline
    )

    hashed = _hash_input_output("customers.csv")
    err = datasets[hashed].error
    assert err is not None and err.message == "second"


# --------------------------------------------------------------------------- #
# _finalize_pipeline_info
# --------------------------------------------------------------------------- #
def test_pipeline_finalisation_populates_run_id_and_duration() -> None:
    pipeline = run_events.PipelineInfo()
    nodes = {
        "first_node": run_events.NodeInfo(duration=2),
        "second_node": run_events.NodeInfo(duration=3),
    }
    run_events._finalize_pipeline_info(pipeline, nodes)
    assert pipeline.run_id != "default-run-id" and pipeline.duration == 5


# --------------------------------------------------------------------------- #
# transform_events_to_structured_format
# --------------------------------------------------------------------------- #
def test_event_transformation_end_to_end() -> None:
    now = datetime.now()
    events = [
        _make_event(
            run_events.EventType.BEFORE_PIPELINE_RUN, timestamp=now.isoformat()
        ),
        {
            "event": run_events.EventType.AFTER_NODE_RUN,
            "node_id": "load_customers_node",
            "status": "successful",
            "duration": 1,
        },
        _make_event(
            run_events.EventType.AFTER_DATASET_LOADED,
            node_id="load_customers_node",
            dataset="customers.csv",
            size=1,
            status="available",
        ),
        _make_event(
            run_events.EventType.ON_NODE_ERROR,
            node_id="load_customers_node",
            error="DatasetLoadError: Failed to read customers.csv",
            traceback="Traceback (most recent call last): ...",
        ),
        _make_event(
            run_events.EventType.ON_PIPELINE_ERROR,
            timestamp=(now + timedelta(seconds=3)).isoformat(),
            dataset="customers.csv",
            node="load_customers_node",
            node_id="load_customers_node",
            error="boom",
            traceback="trace_info",
            operation="load",
        ),
    ]
    response = run_events.transform_events_to_structured_format(events)
    assert response.pipeline.status is run_events.PipelineStatus.FAILED
    assert response.nodes["load_customers_node"].duration == 1


# --------------------------------------------------------------------------- #
# get_run_status_response – all code paths
# --------------------------------------------------------------------------- #
def test_get_run_status_response_code_paths(
    monkeypatch: pytest.MonkeyPatch, tmp_path: Path
) -> None:
    """
    Drives `get_run_status_response` through:

    * missing events file
    * invalid JSON
    * OS error while opening
    * unexpected exception inside transformer
    * happy path
    """
    path_attr = "kedro_viz.api.rest.responses.run_events.PIPELINE_EVENT_FULL_PATH"
    monkeypatch.setattr(run_events, "_find_kedro_project", lambda *_: Path.cwd())

    # 1. file missing
    monkeypatch.setattr(path_attr, tmp_path / "missing.json", raising=False)
    assert run_events.get_run_status_response().nodes == {}

    # 2. malformed JSON
    bad = tmp_path / "bad.json"
    bad.write_text("{ nope")
    monkeypatch.setattr(path_attr, bad, raising=False)
    assert run_events.get_run_status_response().nodes == {}

    # 3. OS error during open()
    good = tmp_path / "good.json"
    good.write_text("[]")
    monkeypatch.setattr(path_attr, good, raising=False)
    orig_open = Path.open
    monkeypatch.setattr(
        Path, "open", lambda *a, **k: (_ for _ in ()).throw(OSError), raising=True
    )
    assert run_events.get_run_status_response().nodes == {}
    monkeypatch.setattr(Path, "open", orig_open, raising=True)  # restore

    # 4. transformer raises
    good.write_text("[]")
    orig_transform = run_events.transform_events_to_structured_format
    monkeypatch.setattr(
        run_events,
        "transform_events_to_structured_format",
        lambda *_: (_ for _ in ()).throw(ValueError),
    )
    assert run_events.get_run_status_response().nodes == {}
    monkeypatch.setattr(
        run_events, "transform_events_to_structured_format", orig_transform
    )

    # 5. happy path
    events = [
        {
            "event": run_events.EventType.AFTER_NODE_RUN,
            "node_id": "nX",
            "duration": 1,
            "status": "successful",
        },
        {
            "event": run_events.EventType.AFTER_PIPELINE_RUN,
            "timestamp": datetime.now().isoformat(),
        },
    ]
    good.write_text(json.dumps(events))
    monkeypatch.setattr(path_attr, good, raising=False)
    assert run_events.get_run_status_response().nodes["nX"].duration == 1


# --------------------------------------------------------------------------- #
# Pipeline error only – where only end_time is populated
# --------------------------------------------------------------------------- #
def test_pipeline_error_sets_only_end_time() -> None:
    ts = datetime.now().isoformat()
    info = run_events.PipelineInfo()
    run_events._update_pipeline_info_from_events(
        [_make_event(run_events.EventType.ON_PIPELINE_ERROR, timestamp=ts, error="x")],
        info,
    )
    assert info.start_time is None and info.end_time == ts


# --------------------------------------------------------------------------- #
# get_run_status_response – when no Kedro project is found
# --------------------------------------------------------------------------- #
def test_get_run_status_response_no_kedro_project(monkeypatch):
    """When ``_find_kedro_project`` returns ``None`` the function exits early."""
    monkeypatch.setattr(run_events, "_find_kedro_project", lambda *_: None)
    result = run_events.get_run_status_response()
    # Early return → empty response object
    assert result == run_events.RunStatusAPIResponse()
