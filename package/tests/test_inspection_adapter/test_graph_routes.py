"""Tests that graph routes use the context bound when the API app is created.

Everything here goes over HTTP via ``TestClient``. A spy service records what the routes ask
for, so these fail if ``/api/main`` or ``/api/pipelines/{id}`` bypasses the explicit context.
"""

from __future__ import annotations

from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from kedro_viz.api import apps
from kedro_viz.api.rest.responses.pipelines import GraphAPIResponse
from kedro_viz.integrations.kedro.inspection import (
    InspectionGraphService,
    VizProjectContext,
)
from kedro_viz.integrations.kedro.inspection.graph_service import (
    PipelineNotFoundError,
)

DEMO_PROJECT = Path(__file__).resolve().parents[3] / "demo-project"


class _SpyGraphService(InspectionGraphService):
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


@pytest.fixture
def spy_service() -> _SpyGraphService:
    return _SpyGraphService()


@pytest.fixture
def client(spy_service: _SpyGraphService) -> TestClient:
    context = VizProjectContext(graph=spy_service)
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
            VizProjectContext(graph=first_service), Path.cwd()
        )
    )
    second_client = TestClient(
        apps.create_api_app_from_project(
            VizProjectContext(graph=second_service), Path.cwd()
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
