from __future__ import annotations

import json
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any

import pytest

from kedro_viz.api.rest.responses import run_events as rv
from kedro_viz.utils import _hash_input_output


# --------------------------------------------------------------------------- #
# Helper to make building events more readable
# --------------------------------------------------------------------------- #
def _event(kind: rv.EventType, **extra: Any) -> dict[str, Any]:
    data: dict[str, Any] = {"event": kind}
    data.update(extra)
    return data


# --------------------------------------------------------------------------- #
# _create_or_update_dataset_info
# --------------------------------------------------------------------------- #
def test_dataset_info_creation_and_update() -> None:
    """Blank names are later filled; size is overwritten only when appropriate."""
    datasets: dict[str, rv.DatasetInfo] = {}

    # first call: empty name & no size
    rv._create_or_update_dataset_info(
        datasets,
        dataset_id="ds",
        dataset_name="",
        size_bytes=None,
        status=rv.PipelineStatus.SUCCESSFUL,  # enum not str
    )
    assert datasets["ds"].name == "" and datasets["ds"].size_bytes == 0

    # second call supplies a name *and* size; size is updated because the
    # previous size was zero (implementation allows that without overwrite flag)
    rv._create_or_update_dataset_info(
        datasets,
        dataset_id="ds",
        dataset_name="sales",
        size_bytes=111,
        status=rv.PipelineStatus.SUCCESSFUL,
    )
    assert datasets["ds"].name == "sales" and datasets["ds"].size_bytes == 111


# --------------------------------------------------------------------------- #
# _extract_pipeline_timing_and_status
# --------------------------------------------------------------------------- #
def test_pipeline_timing_success_and_failure() -> None:
    """Successful run populates start/end; error run sets FAILED and error info."""
    now = datetime.now()
    start, end = now.isoformat(), (now + timedelta(seconds=5)).isoformat()

    ok = rv.PipelineInfo()
    rv._extract_pipeline_timing_and_status(
        [
            _event(rv.EventType.BEFORE_PIPELINE_RUN, timestamp=start),
            _event(rv.EventType.AFTER_PIPELINE_RUN, timestamp=end),
        ],
        ok,
    )
    assert (
        ok.start_time == start
        and ok.end_time == end
        and ok.status is rv.PipelineStatus.SUCCESSFUL
    )

    failed = rv.PipelineInfo()
    rv._extract_pipeline_timing_and_status(
        [
            _event(rv.EventType.BEFORE_PIPELINE_RUN, timestamp=start),
            _event(
                rv.EventType.ON_PIPELINE_ERROR,
                timestamp=end,
                error="kaput",
                traceback="trace",
            ),
        ],
        failed,
    )
    assert failed.status is rv.PipelineStatus.FAILED
    assert failed.error is not None and failed.error.message == "kaput"


# --------------------------------------------------------------------------- #
# node helpers
# --------------------------------------------------------------------------- #
def test_node_completion_and_error_updates() -> None:
    """A subsequent node-error overwrites status and attaches error info."""
    nodes: dict[str, rv.NodeInfo] = {}

    rv._process_node_completion_event(
        {
            "event": rv.EventType.AFTER_NODE_RUN,
            "node_id": "n1",
            "status": "successful",
            "duration_sec": 1.5,
        },
        nodes,
    )
    assert (
        nodes["n1"].status is rv.NodeStatus.SUCCESSFUL
        and nodes["n1"].duration_sec == 1.5
    )

    rv._process_node_error_event(
        {
            "event": rv.EventType.ON_NODE_ERROR,
            "node_id": "n1",
            "error": "boom",
            "traceback": "tb",
        },
        nodes,
    )
    info = nodes["n1"]
    assert info.status is rv.NodeStatus.FAILED
    assert info.error is not None and info.error.message == "boom"


# --------------------------------------------------------------------------- #
# dataset helpers
# --------------------------------------------------------------------------- #
def test_dataset_load_save_and_error_paths() -> None:
    """
    * load → creates entry with fallback size 0
    * save → overwrites size
    * error → marks dataset missing & sets node/pipeline status when node exists
    """
    datasets: dict[str, rv.DatasetInfo] = {}
    nodes: dict[str, rv.NodeInfo] = {"n_bad": rv.NodeInfo()}  # node pre-exists
    pipeline = rv.PipelineInfo()

    # after_dataset_loaded (bad size string → 0)
    rv._process_dataset_event(
        {
            "event": rv.EventType.AFTER_DATASET_LOADED,
            "node_id": "ds",
            "dataset": "data",
            "size_bytes": "oops",
        },
        datasets,
    )
    assert datasets["ds"].size_bytes == 0

    # after_dataset_saved (size overwritten)
    rv._process_dataset_event(
        {
            "event": rv.EventType.AFTER_DATASET_SAVED,
            "node_id": "ds",
            "dataset": "data",
            "size_bytes": 128,
        },
        datasets,
    )
    assert datasets["ds"].size_bytes == 128

    # dataset error
    rv._process_dataset_error_event(
        {
            "event": rv.EventType.ON_PIPELINE_ERROR,
            "dataset": "data",
            "node_id": "n_bad",
            "node": "n_bad",
            "operation": "load",
            "error": "missing",
            "traceback": "tb",
        },
        datasets,
        nodes,
        pipeline,
    )
    hashed = _hash_input_output("data")
    assert datasets[hashed].status is rv.DatasetStatus.MISSING
    assert nodes["n_bad"].status is rv.NodeStatus.FAILED
    assert pipeline.status is rv.PipelineStatus.FAILED


def test_dataset_error_second_occurrence_updates_existing_entry() -> None:
    """Second error for the same dataset replaces its error message."""
    datasets: dict[str, rv.DatasetInfo] = {}
    nodes: dict[str, rv.NodeInfo] = {}
    pipeline = rv.PipelineInfo()

    first_event = {
        "event": rv.EventType.ON_PIPELINE_ERROR,
        "dataset": "ds",
        "node_id": "nA",
        "node": "nA",
        "operation": "load",
        "error": "first",
        "traceback": "tb",
    }
    rv._process_dataset_error_event(first_event, datasets, nodes, pipeline)

    rv._process_dataset_error_event(
        {**first_event, "error": "second"}, datasets, nodes, pipeline
    )

    hashed = _hash_input_output("ds")
    err = datasets[hashed].error
    assert err is not None and err.message == "second"


# --------------------------------------------------------------------------- #
# _finalize_pipeline_info
# --------------------------------------------------------------------------- #
def test_pipeline_finalisation_populates_run_id_and_duration() -> None:
    pipeline = rv.PipelineInfo()
    nodes = {"a": rv.NodeInfo(duration_sec=2), "b": rv.NodeInfo(duration_sec=3)}
    rv._finalize_pipeline_info(pipeline, nodes)
    assert pipeline.run_id != "default-run-id" and pipeline.duration_sec == 5


# --------------------------------------------------------------------------- #
# transform_events_to_structured_format
# --------------------------------------------------------------------------- #
def test_event_transformation_end_to_end() -> None:
    now = datetime.now()
    events = [
        _event(rv.EventType.BEFORE_PIPELINE_RUN, timestamp=now.isoformat()),
        {
            "event": rv.EventType.AFTER_NODE_RUN,
            "node_id": "n1",
            "status": "Successful",
            "duration_sec": 1,
        },
        _event(
            rv.EventType.AFTER_DATASET_LOADED,
            node_id="ds",
            dataset="d",
            size_bytes=1,
            status="Available",
        ),
        _event(rv.EventType.ON_NODE_ERROR, node_id="n_bad", error="x", traceback="t"),
        _event(
            rv.EventType.ON_PIPELINE_ERROR,
            timestamp=(now + timedelta(seconds=3)).isoformat(),
            dataset="d",
            node="n_bad",
            node_id="n_bad",
            error="boom",
            traceback="t",
            operation="load",
        ),
    ]
    response = rv.transform_events_to_structured_format(events)
    assert response.pipeline.status is rv.PipelineStatus.FAILED
    assert response.nodes["n1"].duration_sec == 1


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
    monkeypatch.setattr(rv, "_find_kedro_project", lambda *_: Path.cwd())

    # 1. file missing
    monkeypatch.setattr(path_attr, tmp_path / "missing.json", raising=False)
    assert rv.get_run_status_response().nodes == {}

    # 2. malformed JSON
    bad = tmp_path / "bad.json"
    bad.write_text("{ nope")
    monkeypatch.setattr(path_attr, bad, raising=False)
    assert rv.get_run_status_response().nodes == {}

    # 3. OS error during open()
    good = tmp_path / "good.json"
    good.write_text("[]")
    monkeypatch.setattr(path_attr, good, raising=False)
    orig_open = Path.open
    monkeypatch.setattr(
        Path, "open", lambda *a, **k: (_ for _ in ()).throw(OSError), raising=True
    )
    assert rv.get_run_status_response().nodes == {}
    monkeypatch.setattr(Path, "open", orig_open, raising=True)  # restore

    # 4. transformer raises
    good.write_text("[]")
    orig_transform = rv.transform_events_to_structured_format
    monkeypatch.setattr(
        rv,
        "transform_events_to_structured_format",
        lambda *_: (_ for _ in ()).throw(ValueError),
    )
    assert rv.get_run_status_response().nodes == {}
    monkeypatch.setattr(rv, "transform_events_to_structured_format", orig_transform)

    # 5. happy path
    events = [
        {
            "event": rv.EventType.AFTER_NODE_RUN,
            "node_id": "nX",
            "duration_sec": 1,
            "status": "Successful",
        },
        {
            "event": rv.EventType.AFTER_PIPELINE_RUN,
            "timestamp": datetime.now().isoformat(),
        },
    ]
    good.write_text(json.dumps(events))
    monkeypatch.setattr(path_attr, good, raising=False)
    assert rv.get_run_status_response().nodes["nX"].duration_sec == 1


# --------------------------------------------------------------------------- #
# Pipeline error only – where only end_time is populated
# --------------------------------------------------------------------------- #
def test_pipeline_error_sets_only_end_time() -> None:
    ts = datetime.now().isoformat()
    info = rv.PipelineInfo()
    rv._extract_pipeline_timing_and_status(
        [_event(rv.EventType.ON_PIPELINE_ERROR, timestamp=ts, error="x")], info
    )
    assert info.start_time is None and info.end_time == ts


# --------------------------------------------------------------------------- #
# get_run_status_response – when no Kedro project is found
# --------------------------------------------------------------------------- #
def test_get_run_status_response_no_kedro_project(monkeypatch):
    """When ``_find_kedro_project`` returns ``None`` the function exits early."""
    monkeypatch.setattr(rv, "_find_kedro_project", lambda *_: None)
    result = rv.get_run_status_response()
    # Early return → empty response object
    assert result == rv.RunStatusAPIResponse()
