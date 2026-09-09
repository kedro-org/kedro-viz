"""Tests for context-bound node-metadata and run-status routes."""

from pathlib import Path
from typing import cast

from fastapi.testclient import TestClient

from kedro_viz.api import apps
from kedro_viz.api.rest.responses.nodes import TaskNodeMetadataAPIResponse
from kedro_viz.api.rest.responses.pipelines import GraphAPIResponse
from kedro_viz.api.rest.responses.run_events import (
    PipelineInfo,
    RunStatusAPIResponse,
)
from kedro_viz.integrations.kedro.inspection import VizProjectContext
from kedro_viz.integrations.kedro.inspection.errors import (
    NodeMetadataNotAvailableError,
    NodeNotFoundError,
)
from kedro_viz.integrations.kedro.inspection.graph_service import GraphService
from kedro_viz.integrations.kedro.inspection.node_metadata_service import (
    NodeMetadataService,
)
from kedro_viz.integrations.kedro.inspection.run_status_service import RunStatusService


class _GraphService:
    def get_pipeline_response(self, pipeline_id: str | None = None) -> GraphAPIResponse:
        return GraphAPIResponse(
            nodes=[],
            edges=[],
            layers=[],
            tags=[],
            pipelines=[],
            modular_pipelines={},
            selected_pipeline=pipeline_id or "__default__",
        )


class _NodeMetadataService:
    def __init__(self, label: str = "input") -> None:
        self.label = label
        self.requested: list[str] = []

    def get_node_metadata_response(
        self, node_id: str, *, include_previews: bool = True
    ) -> TaskNodeMetadataAPIResponse:
        self.requested.append(node_id)
        if node_id == "modular.pipeline":
            raise NodeMetadataNotAvailableError(node_id)
        if node_id == "unknown":
            raise NodeNotFoundError(node_id)
        return TaskNodeMetadataAPIResponse(inputs=[self.label], outputs=[])


class _RunStatusService:
    def __init__(self, run_id: str = "run") -> None:
        self.run_id = run_id
        self.calls = 0
        self.error: Exception | None = None

    def get_run_status_response(self) -> RunStatusAPIResponse:
        self.calls += 1
        if self.error is not None:
            raise self.error
        return RunStatusAPIResponse(pipeline=PipelineInfo(run_id=self.run_id))


def _app(
    nodes: _NodeMetadataService,
    run_status: _RunStatusService,
):
    return apps.create_api_app_from_project(
        VizProjectContext(
            graph=cast(GraphService, _GraphService()),
            nodes=cast(NodeMetadataService, nodes),
            run_status=cast(RunStatusService, run_status),
        ),
        Path.cwd(),
    )


def test_node_route_delegates_and_excludes_none_fields() -> None:
    metadata = _NodeMetadataService()
    client = TestClient(_app(metadata, _RunStatusService()))

    response = client.get("/api/nodes/task-id")

    assert response.status_code == 200
    assert response.json() == {"inputs": ["input"], "outputs": []}
    assert metadata.requested == ["task-id"]


def test_modular_node_returns_empty_metadata_while_unknown_id_remains_404() -> None:
    metadata = _NodeMetadataService()
    client = TestClient(_app(metadata, _RunStatusService()))

    before = client.get("/api/nodes/modular.pipeline")
    main = client.get("/api/main")
    after = client.get("/api/nodes/modular.pipeline")
    unknown = client.get("/api/nodes/unknown")

    assert main.status_code == 200
    for response in [before, after]:
        assert response.status_code == 200
        assert response.json() == {}
    assert unknown.status_code == 404
    assert unknown.json() == {"message": "Invalid node ID"}


def test_run_status_route_delegates_to_the_bound_service() -> None:
    run_status = _RunStatusService(run_id="bound-run")
    client = TestClient(_app(_NodeMetadataService(), run_status))

    response = client.get("/api/run-status")

    assert response.status_code == 200
    assert response.json()["pipeline"]["run_id"] == "bound-run"
    assert run_status.calls == 1


def test_run_status_route_preserves_unexpected_error_response(caplog) -> None:
    run_status = _RunStatusService()
    run_status.error = RuntimeError("failed")
    client = TestClient(_app(_NodeMetadataService(), run_status))

    response = client.get("/api/run-status")

    assert response.status_code == 500
    assert response.json() == {"message": "Failed to get run status data"}
    assert "An exception occurred while getting run status: failed" in caplog.text


def test_apps_keep_metadata_and_run_status_contexts_independent() -> None:
    first_metadata = _NodeMetadataService("first")
    second_metadata = _NodeMetadataService("second")
    first_run_status = _RunStatusService("first-run")
    second_run_status = _RunStatusService("second-run")
    first = TestClient(_app(first_metadata, first_run_status))
    second = TestClient(_app(second_metadata, second_run_status))

    assert first.get("/api/nodes/task").json()["inputs"] == ["first"]
    assert second.get("/api/run-status").json()["pipeline"]["run_id"] == "second-run"
    assert second.get("/api/nodes/task").json()["inputs"] == ["second"]
    assert first.get("/api/run-status").json()["pipeline"]["run_id"] == "first-run"

    assert first_metadata.requested == ["task"]
    assert second_metadata.requested == ["task"]
    assert first_run_status.calls == 1
    assert second_run_status.calls == 1


def test_migrated_project_routes_are_registered_once() -> None:
    app = _app(_NodeMetadataService(), _RunStatusService())
    paths = []
    for route in app.routes:
        path = getattr(route, "path", None)
        if path is not None:
            paths.append(path)
        included_router = getattr(route, "original_router", None)
        if included_router is not None:
            paths.extend(child.path for child in included_router.routes)

    assert paths.count("/api/nodes/{node_id}") == 1
    assert paths.count("/api/run-status") == 1


def test_run_status_route_keeps_its_openapi_description() -> None:
    app = _app(_NodeMetadataService(), _RunStatusService())

    description = app.openapi()["paths"]["/api/run-status"]["get"]["description"]

    assert "latest Kedro pipeline run" in description
    assert '"run_id": "unique-id"' in description
