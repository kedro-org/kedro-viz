"""Tests for project-owned run-status file access."""

import json
from pathlib import Path

from kedro_viz.api.rest.responses.run_events import EventType
from kedro_viz.constants import PIPELINE_EVENT_FULL_PATH
from kedro_viz.integrations.kedro.inspection import RunStatusService


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
