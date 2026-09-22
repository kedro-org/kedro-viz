"""Tests for project-owned run-status file access."""

import json
from datetime import datetime
from pathlib import Path

import pytest

from kedro_viz.api.rest.responses import run_events
from kedro_viz.api.rest.responses.run_events import EventType
from kedro_viz.constants import PIPELINE_EVENT_FULL_PATH
from kedro_viz.integrations.kedro.inspection import run_status_service
from kedro_viz.integrations.kedro.inspection.run_status_service import RunStatusService


def _write_node_event(project_path: Path, node_id: str) -> None:
    event_path = project_path / PIPELINE_EVENT_FULL_PATH
    event_path.parent.mkdir(parents=True, exist_ok=True)
    event_path.write_text(
        json.dumps(
            [
                {
                    "event": EventType.AFTER_NODE_RUN,
                    "node_id": node_id,
                    "duration": 1,
                    "status": "success",
                }
            ]
        ),
        encoding="utf8",
    )


def test_service_resolves_project_root_before_working_directory_changes(
    tmp_path: Path, monkeypatch
) -> None:
    monkeypatch.chdir(tmp_path)
    project_path = Path("project")
    _write_node_event(project_path, "project-node")
    service = RunStatusService(project_path)

    other_directory = tmp_path / "other"
    other_directory.mkdir()
    _write_node_event(other_directory, "cwd-node")
    monkeypatch.chdir(other_directory)

    response = service.get_run_status_response()

    assert set(response.nodes) == {"project-node"}


def test_services_are_bound_to_independent_project_roots(tmp_path: Path) -> None:
    first_project = tmp_path / "first"
    second_project = tmp_path / "second"
    _write_node_event(first_project, "first-node")
    _write_node_event(second_project, "second-node")

    first = RunStatusService(first_project).get_run_status_response()
    second = RunStatusService(second_project).get_run_status_response()

    assert set(first.nodes) == {"first-node"}
    assert set(second.nodes) == {"second-node"}


def test_missing_project_event_file_returns_empty_status(tmp_path: Path) -> None:
    response = RunStatusService(tmp_path).get_run_status_response()

    assert response.nodes == {}
    assert response.datasets == {}


def test_service_reads_updated_events_on_each_request(tmp_path: Path) -> None:
    service = RunStatusService(tmp_path)
    assert service.get_run_status_response().nodes == {}

    _write_node_event(tmp_path, "first-run")
    assert set(service.get_run_status_response().nodes) == {"first-run"}

    _write_node_event(tmp_path, "second-run")
    assert set(service.get_run_status_response().nodes) == {"second-run"}


class TestReadRunStatusResponse:
    def test_missing_file(self, tmp_path: Path):
        response = run_status_service.read_run_status_response(
            tmp_path / "missing.json"
        )
        assert response.nodes == {}

    def test_malformed_json(self, tmp_path: Path):
        bad = tmp_path / "bad.json"
        bad.write_text("{ nope")

        response = run_status_service.read_run_status_response(bad)
        assert response.nodes == {}

    def test_oserror_on_open(self, monkeypatch: pytest.MonkeyPatch, tmp_path: Path):
        good = tmp_path / "good.json"
        good.write_text("[]")

        orig_open = Path.open
        monkeypatch.setattr(
            Path, "open", lambda *a, **k: (_ for _ in ()).throw(OSError), raising=True
        )

        response = run_status_service.read_run_status_response(good)
        assert response.nodes == {}

        monkeypatch.setattr(Path, "open", orig_open, raising=True)  # restore

    def test_transformer_exception(
        self, monkeypatch: pytest.MonkeyPatch, tmp_path: Path
    ):
        good = tmp_path / "good.json"
        good.write_text("[]")

        orig_transform = run_status_service.transform_events_to_structured_format
        monkeypatch.setattr(
            run_status_service,
            "transform_events_to_structured_format",
            lambda *_: (_ for _ in ()).throw(ValueError),
        )

        response = run_status_service.read_run_status_response(good)
        assert response.nodes == {}

        monkeypatch.setattr(
            run_status_service, "transform_events_to_structured_format", orig_transform
        )

    def test_happy_path(self, tmp_path: Path):
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

        response = run_status_service.read_run_status_response(good)
        assert response.nodes["nX"].duration == 1
