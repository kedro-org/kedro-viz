"""Tests that the graph routes actually read through the installed provider.

Everything here goes over HTTP via ``TestClient``. A spy provider records what the routes ask
for, so these fail if ``/api/main`` or ``/api/pipelines/{id}`` bypasses the installed provider.
"""

from __future__ import annotations

from collections.abc import Iterator
from pathlib import Path
from unittest import mock

import pytest
from fastapi.responses import JSONResponse
from fastapi.testclient import TestClient

from kedro_viz.api import apps
from kedro_viz.api.data_provider import set_graph_data_provider
from kedro_viz.api.inspection_adapter_provider import InspectionAdapterProvider
from kedro_viz.api.rest.responses.pipelines import GraphAPIResponse
from kedro_viz.data_access.repositories.graph import GraphNodesRepository

DEMO_PROJECT = Path(__file__).resolve().parents[3] / "demo-project"


class _SpyProvider:
    """Records the pipeline IDs the routes ask for."""

    def __init__(self) -> None:
        self.requested: list[str | None] = []

    def get_pipeline_response(self, pipeline_id=None):
        self.requested.append(pipeline_id)
        if pipeline_id == "unknown":
            return JSONResponse(
                status_code=404, content={"message": "Invalid pipeline ID"}
            )
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
def spy() -> Iterator[_SpyProvider]:
    """Install a spy for the graph routes."""
    provider = _SpyProvider()
    set_graph_data_provider(provider)
    yield provider
    set_graph_data_provider(None)


@pytest.fixture
def client() -> TestClient:
    return TestClient(apps.create_api_app_from_project(mock.MagicMock()))


def test_main_route_asks_the_provider_for_the_default_pipeline(client, spy) -> None:
    """``/api/main`` must delegate with no pipeline ID, letting the provider pick the default."""
    response = client.get("/api/main")
    assert response.status_code == 200
    assert spy.requested == [None]


def test_pipeline_route_passes_the_requested_id_through(client, spy) -> None:
    """The ID in the URL must reach the provider unchanged."""
    response = client.get("/api/pipelines/data_ingestion")
    assert response.status_code == 200
    assert spy.requested == ["data_ingestion"]
    assert response.json()["selected_pipeline"] == "data_ingestion"


def test_unknown_pipeline_id_is_a_404_over_http(client, spy) -> None:
    """The provider's 404 reaches the client as an HTTP 404, not a 200 with an error body."""
    response = client.get("/api/pipelines/unknown")
    assert response.status_code == 404
    assert spy.requested == ["unknown"]


def test_routes_serve_the_real_adapter_response(
    client, _restore_kedro_project_state
) -> None:
    """End to end: the real adapter, over HTTP, returns the demo project's graph.

    An empty node repository is injected, so the result cannot depend on whatever another test
    left in the process-wide one.
    """
    set_graph_data_provider(
        InspectionAdapterProvider(
            DEMO_PROJECT, live_node_repository=GraphNodesRepository()
        )
    )
    try:
        main = client.get("/api/main")
        scoped = client.get("/api/pipelines/data_ingestion")
        missing = client.get("/api/pipelines/no_such_pipeline")
    finally:
        set_graph_data_provider(None)

    assert main.status_code == 200
    assert main.json()["selected_pipeline"] == "__default__"
    assert main.json()["nodes"], "the demo project should render nodes"
    assert scoped.json()["selected_pipeline"] == "data_ingestion"
    assert missing.status_code == 404
