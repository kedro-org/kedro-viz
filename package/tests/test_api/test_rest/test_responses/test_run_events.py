from __future__ import annotations

import json
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any

import pytest

from kedro_viz.api.rest.responses import run_events
from kedro_viz.utils import _hash_input_output


def _make_event(kind: run_events.EventType, **extra: Any) -> dict[str, Any]:
    data: dict[str, Any] = {"event": kind}
    data.update(extra)
    return data


class TestDatasetInfo:
    def test_dataset_info_creation(self) -> None:
        datasets: dict[str, run_events.DatasetInfo] = {}
        run_events._create_dataset_info(
            datasets,
            dataset_id="sale_dataset",
            dataset_name="",
            size=None,
            status=run_events.RunEventStatus.SUCCESS,
        )
        assert (
            datasets["sale_dataset"].name == "" and datasets["sale_dataset"].size == 0
        )

    def test_dataset_info_update(self) -> None:
        datasets: dict[str, run_events.DatasetInfo] = {}
        run_events._create_dataset_info(
            datasets,
            dataset_id="sale_dataset",
            dataset_name="",
            size=None,
            status=run_events.RunEventStatus.SUCCESS,
        )
        run_events._update_dataset_info(
            datasets,
            dataset_id="sale_dataset",
            dataset_name="sales",
            size=111,
            status=run_events.RunEventStatus.SUCCESS,
        )
        assert (
            datasets["sale_dataset"].name == "sales"
            and datasets["sale_dataset"].size == 111
        )


class TestPipelineTiming:
    def test_pipeline_timing_success(self) -> None:
        now = datetime.now()
        start, end = now.isoformat(), (now + timedelta(seconds=5)).isoformat()
        info = run_events.PipelineInfo()
        run_events._update_pipeline_info_from_events(
            [
                _make_event(run_events.EventType.BEFORE_PIPELINE_RUN, timestamp=start),
                _make_event(run_events.EventType.AFTER_PIPELINE_RUN, timestamp=end),
            ],
            info,
        )
        assert info.start_time == start
        assert info.end_time == end
        assert info.status is run_events.RunEventStatus.SUCCESS

    def test_pipeline_timing_failure(self) -> None:
        now = datetime.now()
        start, end = now.isoformat(), (now + timedelta(seconds=5)).isoformat()
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
        assert failed.status is run_events.RunEventStatus.FAILED
        assert failed.error is not None and failed.error.message == "kaput"

    def test_pipeline_error_sets_only_end_time(self) -> None:
        ts = datetime.now().isoformat()
        info = run_events.PipelineInfo()
        run_events._update_pipeline_info_from_events(
            [
                _make_event(
                    run_events.EventType.ON_PIPELINE_ERROR, timestamp=ts, error="x"
                )
            ],
            info,
        )
        assert info.start_time is None and info.end_time == ts


class TestNodeHelpers:
    def test_node_completion(self) -> None:
        """A subsequent node-error overwrites status and attaches error info."""

        nodes: dict[str, run_events.NodeInfo] = {}

        run_events._process_node_completion_event(
            {
                "event": run_events.EventType.AFTER_NODE_RUN,
                "node_id": "load_customers_node",
                "status": "success",
                "duration": 1.5,
            },
            nodes,
        )
        assert nodes["load_customers_node"].status is run_events.RunEventStatus.SUCCESS
        assert nodes["load_customers_node"].duration == 1.5

    def test_node_error_updates_existing_node_status_and_error(self) -> None:
        nodes: dict[str, run_events.NodeInfo] = {
            "load_customers_node": run_events.NodeInfo()
        }

        run_events._process_node_error_event(
            {
                "event": run_events.EventType.ON_NODE_ERROR,
                "node_id": "load_customers_node",
                "error": "DatasetLoadError: Failed to read customers.csv",
                "traceback": "Traceback (most recent call last): ...",
            },
            nodes,
        )
        assert nodes["load_customers_node"].status is run_events.RunEventStatus.FAILED
        err = nodes["load_customers_node"].error
        assert (
            err is not None
            and err.message == "DatasetLoadError: Failed to read customers.csv"
        )

    def test_process_node_error_creates_entry_when_missing(self) -> None:
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
        err = nodes["transform_sales_node"].error
        assert (
            err is not None
            and err.message == "TransformationError: Failed to apply discount"
        )


class TestDatasetHelpers:
    def test_dataset_save_event_overwrites_size(self):
        """AFTER_DATASET_SAVED overwrites the size."""
        datasets: dict[str, run_events.DatasetInfo] = {}

        # Simulate initial load with zero size
        run_events._process_dataset_event(
            {
                "event": run_events.EventType.AFTER_DATASET_LOADED,
                "node_id": "load_customers_node",
                "dataset": "customers.csv",
                "size": 0,
            },
            datasets,
        )
        assert datasets["load_customers_node"].size == 0

        # Now simulate save
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

    def test_dataset_error_sets_status_node_and_pipeline(self):
        """ON_PIPELINE_ERROR sets dataset + node + pipeline to FAILED."""
        datasets: dict[str, run_events.DatasetInfo] = {}
        nodes: dict[str, run_events.NodeInfo] = {
            "load_customers_node": run_events.NodeInfo()
        }
        pipeline = run_events.PipelineInfo()

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
        assert datasets[hashed].status is run_events.RunEventStatus.FAILED
        assert nodes["load_customers_node"].status is run_events.RunEventStatus.FAILED
        assert pipeline.status is run_events.RunEventStatus.FAILED

    def test_dataset_error_second_occurrence_replaces_error_message(self):
        """Second error on same dataset replaces the error message."""
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


class TestPipelineFinalisation:
    def test_pipeline_finalisation_populates_run_id_and_duration(self) -> None:
        pipeline = run_events.PipelineInfo()
        nodes = {
            "first_node": run_events.NodeInfo(duration=2),
            "second_node": run_events.NodeInfo(duration=3),
        }
        run_events._finalize_pipeline_info(pipeline, nodes)
        assert pipeline.run_id != "default-run-id" and pipeline.duration == 5


class TestTransformEventsToStructuredFormat:
    # transform_events_to_structured_format
    def test_event_transformation_end_to_end(self) -> None:
        now = datetime.now()
        events = [
            _make_event(
                run_events.EventType.BEFORE_PIPELINE_RUN, timestamp=now.isoformat()
            ),
            {
                "event": run_events.EventType.AFTER_NODE_RUN,
                "node_id": "load_customers_node",
                "status": "success",
                "duration": 1,
            },
            _make_event(
                run_events.EventType.AFTER_DATASET_LOADED,
                node_id="load_customers_node",
                dataset="customers.csv",
                size=1,
                status="success",
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
        assert response.pipeline.status is run_events.RunEventStatus.FAILED
        assert response.nodes["load_customers_node"].duration == 1


class TestGetRunStatusResponse:
    # get_run_status_response – all code paths
    def test_missing_file(self, monkeypatch: pytest.MonkeyPatch, tmp_path: Path):
        path_attr = "kedro_viz.api.rest.responses.run_events.PIPELINE_EVENT_FULL_PATH"
        monkeypatch.setattr(run_events, "_find_kedro_project", lambda *_: Path.cwd())
        monkeypatch.setattr(path_attr, tmp_path / "missing.json", raising=False)

        response = run_events.get_run_status_response()
        assert response.nodes == {}

    def test_malformed_json(self, monkeypatch: pytest.MonkeyPatch, tmp_path: Path):
        path_attr = "kedro_viz.api.rest.responses.run_events.PIPELINE_EVENT_FULL_PATH"
        monkeypatch.setattr(run_events, "_find_kedro_project", lambda *_: Path.cwd())

        bad = tmp_path / "bad.json"
        bad.write_text("{ nope")
        monkeypatch.setattr(path_attr, bad, raising=False)

        response = run_events.get_run_status_response()
        assert response.nodes == {}

    def test_oserror_on_open(self, monkeypatch: pytest.MonkeyPatch, tmp_path: Path):
        path_attr = "kedro_viz.api.rest.responses.run_events.PIPELINE_EVENT_FULL_PATH"
        monkeypatch.setattr(run_events, "_find_kedro_project", lambda *_: Path.cwd())

        good = tmp_path / "good.json"
        good.write_text("[]")
        monkeypatch.setattr(path_attr, good, raising=False)

        orig_open = Path.open
        monkeypatch.setattr(
            Path, "open", lambda *a, **k: (_ for _ in ()).throw(OSError), raising=True
        )

        response = run_events.get_run_status_response()
        assert response.nodes == {}

        monkeypatch.setattr(Path, "open", orig_open, raising=True)  # restore

    def test_transformer_exception(
        self, monkeypatch: pytest.MonkeyPatch, tmp_path: Path
    ):
        path_attr = "kedro_viz.api.rest.responses.run_events.PIPELINE_EVENT_FULL_PATH"
        monkeypatch.setattr(run_events, "_find_kedro_project", lambda *_: Path.cwd())

        good = tmp_path / "good.json"
        good.write_text("[]")
        monkeypatch.setattr(path_attr, good, raising=False)

        orig_transform = run_events.transform_events_to_structured_format
        monkeypatch.setattr(
            run_events,
            "transform_events_to_structured_format",
            lambda *_: (_ for _ in ()).throw(ValueError),
        )

        response = run_events.get_run_status_response()
        assert response.nodes == {}

        monkeypatch.setattr(
            run_events, "transform_events_to_structured_format", orig_transform
        )

    def test_happy_path(self, monkeypatch: pytest.MonkeyPatch, tmp_path: Path):
        path_attr = "kedro_viz.api.rest.responses.run_events.PIPELINE_EVENT_FULL_PATH"
        monkeypatch.setattr(run_events, "_find_kedro_project", lambda *_: Path.cwd())

        events = [
            {
                "event": run_events.EventType.AFTER_NODE_RUN,
                "node_id": "nX",
                "duration": 1,
                "status": "success",
            },
            {
                "event": run_events.EventType.AFTER_PIPELINE_RUN,
                "timestamp": datetime.now().isoformat(),
            },
        ]
        good = tmp_path / "good.json"
        good.write_text(json.dumps(events))
        monkeypatch.setattr(path_attr, good, raising=False)

        response = run_events.get_run_status_response()
        assert response.nodes["nX"].duration == 1

    def test_no_kedro_project(self, monkeypatch):
        """When `_find_kedro_project` returns None, the function exits early."""
        monkeypatch.setattr(run_events, "_find_kedro_project", lambda *_: None)
        result = run_events.get_run_status_response()
        assert result == run_events.RunStatusAPIResponse()
