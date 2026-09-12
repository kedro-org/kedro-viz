"""Tests that graph routes use the context bound when the API app is created.

Everything here goes over HTTP via ``TestClient``. A spy service records what the routes ask
for, so these fail if ``/api/main`` or ``/api/pipelines/{id}`` bypasses the explicit context.
"""

from __future__ import annotations

from pathlib import Path
from typing import cast

import pytest
from fastapi.testclient import TestClient

from kedro_viz.api import apps
from kedro_viz.api.rest.responses.pipelines import GraphAPIResponse
from kedro_viz.integrations.kedro.inspection import VizProjectContext
from kedro_viz.integrations.kedro.inspection.graph_service import (
    GraphService,
    PipelineNotFoundError,
)
from kedro_viz.integrations.kedro.inspection.node_metadata_service import (
    NodeMetadataService,
)
from kedro_viz.integrations.kedro.inspection.run_status_service import RunStatusService
from kedro_viz.models.flowchart.nodes import GraphNode

DEMO_PROJECT = Path(__file__).resolve().parents[3] / "demo-project"


class _SpyGraphService(GraphService):
    """Record the pipeline IDs requested by routes."""

    def __init__(self) -> None:
        self.requested: list[str | None] = []

    def get_pipeline_response(self, pipeline_id: str | None = None) -> GraphAPIResponse:
        self.requested.append(pipeline_id)
        if pipeline_id == "unknown":
            raise PipelineNotFoundError("Invalid pipeline ID: 'unknown'")
        return GraphAPIResponse(
            nodes=[],
            edges=[],
            layers=[],
            tags=[],
            pipelines=[],
            modular_pipelines={},
            selected_pipeline=pipeline_id or "__default__",
        )


class _UnusedNodeMetadataService:
    def get_node_metadata_response(self, node_id):
        raise AssertionError(f"Unexpected node metadata request: {node_id}")


class _UnusedRunStatusService:
    def get_run_status_response(self):
        raise AssertionError("Unexpected run-status request")


@pytest.fixture
def spy_service() -> _SpyGraphService:
    return _SpyGraphService()


@pytest.fixture
def client(spy_service: _SpyGraphService) -> TestClient:
    context = VizProjectContext(
        graph=spy_service,
        nodes=cast(NodeMetadataService, _UnusedNodeMetadataService()),
        run_status=cast(RunStatusService, _UnusedRunStatusService()),
    )
    return TestClient(apps.create_api_app_from_project(context, Path.cwd()))


def test_main_route_asks_the_service_for_the_default_pipeline(
    client: TestClient, spy_service: _SpyGraphService
) -> None:
    """``/api/main`` delegates with no ID, leaving default selection to the service."""
    response = client.get("/api/main")
    assert response.status_code == 200
    assert spy_service.requested == [None]


def test_pipeline_route_passes_the_requested_id_through(
    client: TestClient, spy_service: _SpyGraphService
) -> None:
    """The pipeline ID in the URL reaches the bound service unchanged."""
    response = client.get("/api/pipelines/data_ingestion")
    assert response.status_code == 200
    assert spy_service.requested == ["data_ingestion"]
    assert response.json()["selected_pipeline"] == "data_ingestion"


def test_unknown_pipeline_is_translated_to_http_404(
    client: TestClient, spy_service: _SpyGraphService
) -> None:
    """The HTTP layer translates the service's domain error into the established response."""
    response = client.get("/api/pipelines/unknown")
    assert response.status_code == 404
    assert response.json() == {"message": "Invalid pipeline ID"}
    assert spy_service.requested == ["unknown"]


def test_each_app_uses_the_context_bound_when_it_was_created() -> None:
    """Two apps in one process do not share or overwrite graph state."""
    first_service = _SpyGraphService()
    second_service = _SpyGraphService()
    first_client = TestClient(
        apps.create_api_app_from_project(
            VizProjectContext(
                graph=first_service,
                nodes=cast(NodeMetadataService, _UnusedNodeMetadataService()),
                run_status=cast(RunStatusService, _UnusedRunStatusService()),
            ),
            Path.cwd(),
        )
    )
    second_client = TestClient(
        apps.create_api_app_from_project(
            VizProjectContext(
                graph=second_service,
                nodes=cast(NodeMetadataService, _UnusedNodeMetadataService()),
                run_status=cast(RunStatusService, _UnusedRunStatusService()),
            ),
            Path.cwd(),
        )
    )

    assert first_client.get("/api/pipelines/first").status_code == 200
    assert second_client.get("/api/pipelines/second").status_code == 200
    assert first_client.get("/api/main").status_code == 200

    assert first_service.requested == ["first", None]
    assert second_service.requested == ["second"]


def test_routes_serve_the_real_inspection_service(
    _restore_kedro_project_state,
) -> None:
    """End to end: a real project context returns the demo project's graph over HTTP.

    Live-only enrichment is covered separately; this proves that the app-bound inspection
    service is the implementation serving both graph routes.
    """
    context = VizProjectContext.from_project(DEMO_PROJECT)
    client = TestClient(apps.create_api_app_from_project(context, DEMO_PROJECT))

    main = client.get("/api/main")
    scoped = client.get("/api/pipelines/data_ingestion")
    missing = client.get("/api/pipelines/no_such_pipeline")

    assert main.status_code == 200
    assert main.json()["selected_pipeline"] == "__default__"
    assert main.json()["nodes"], "the demo project should render nodes"
    assert scoped.status_code == 200
    assert scoped.json()["selected_pipeline"] == "data_ingestion"
    assert missing.status_code == 404


@pytest.mark.parametrize(
    "pipeline_name,modular_status", [(None, 200), ("reporting_stage", 404)]
)
def test_node_route_uses_modular_ids_from_the_filtered_snapshot(
    _restore_kedro_project_state, pipeline_name, modular_status
) -> None:
    """Known modular IDs work before graph requests; filtered-out IDs stay unknown."""
    context = VizProjectContext.from_project(
        DEMO_PROJECT,
        pipeline_name=pipeline_name,
        live_nodes_by_id={
            "ingestion": GraphNode.create_modular_pipeline_node("ingestion")
        },
    )
    assert context.nodes._live_nodes_by_id == {}
    client = TestClient(apps.create_api_app_from_project(context, DEMO_PROJECT))

    before = client.get("/api/nodes/ingestion")
    main = client.get("/api/main")
    after = client.get("/api/nodes/ingestion")

    assert main.status_code == 200
    for response in [before, after]:
        assert response.status_code == modular_status
        assert response.json() == (
            {} if modular_status == 200 else {"message": "Invalid node ID"}
        )
    for graph_node in main.json()["nodes"]:
        response = client.get(f"/api/nodes/{graph_node['id']}")
        assert response.status_code == 200, graph_node["id"]
        if graph_node["type"] == "modularPipeline":
            assert response.json() == {}
