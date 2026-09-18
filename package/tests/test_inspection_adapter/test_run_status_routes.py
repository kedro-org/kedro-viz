"""HTTP coverage for project-bound run status alongside legacy metadata routes."""

import json

from fastapi.testclient import TestClient

from kedro_viz.api import apps
from kedro_viz.api.rest.responses.run_events import RunStatusAPIResponse
from kedro_viz.constants import PIPELINE_EVENT_FULL_PATH
from kedro_viz.integrations.kedro.inspection import VizProjectContext
from kedro_viz.integrations.kedro.inspection.run_status_service import RunStatusService


def test_run_status_apps_read_their_own_project_files(
    tmp_path, monkeypatch, repository_project_context, mocker
):
    """Separate apps read their own event files, not the process working directory."""
    clients = []
    for name in ("first", "second"):
        project = tmp_path / name
        event_file = project / PIPELINE_EVENT_FULL_PATH
        event_file.parent.mkdir(parents=True)
        event_file.write_text(
            json.dumps([{"event": "after_node_run", "node_id": name, "duration": 1}]),
            encoding="utf8",
        )
        context = VizProjectContext(
            graph=repository_project_context.graph,
            run_status=RunStatusService(project),
        )
        clients.append(TestClient(apps.create_api_app_from_project(context, project)))

    monkeypatch.chdir(tmp_path)
    legacy = mocker.patch(
        "kedro_viz.api.rest.responses.run_events.get_run_status_response",
        side_effect=AssertionError("HTTP must not use the legacy cwd lookup"),
    )
    for client, name in zip(clients, ("first", "second"), strict=True):
        with client:
            response = client.get("/api/run-status")
            assert response.status_code == 200
            assert set(response.json()["nodes"]) == {name}
            assert response.json()["nodes"][name]["duration"] == 1
    legacy.assert_not_called()


def test_run_status_route_delegates_to_context_service(
    tmp_path, repository_project_context, mocker
):
    context = VizProjectContext(
        graph=repository_project_context.graph,
        run_status=RunStatusService(tmp_path),
    )
    expected = RunStatusAPIResponse()
    read = mocker.patch.object(
        context.run_status, "get_run_status_response", return_value=expected
    )
    app = apps.create_api_app_from_project(context, tmp_path)
    with TestClient(app) as client:
        response = client.get("/api/run-status")

    assert response.status_code == 200
    assert response.json() == expected.model_dump(mode="json")
    read.assert_called_once_with()

    paths = []
    for route in app.routes:
        path = getattr(route, "path", None)
        if path is not None:
            paths.append(path)
        included_router = getattr(route, "original_router", None)
        if included_router is not None:
            paths.extend(child.path for child in included_router.routes)
    assert paths.count("/api/run-status") == 1
    assert paths.count("/api/nodes/{node_id}") == 1
    description = app.openapi()["paths"]["/api/run-status"]["get"]["description"]
    assert "Kedro pipeline run status" in description
