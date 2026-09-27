"""Tests that graph routes use the context bound when the API app is created.

Everything here goes over HTTP via ``TestClient``. A spy service records what the routes ask
for, so these fail if ``/api/main`` or ``/api/pipelines/{id}`` bypasses the explicit context.
"""

from __future__ import annotations

import socket
import threading
import urllib.request
from collections.abc import Iterator
from pathlib import Path

import pytest
import uvicorn
from fastapi.testclient import TestClient

from kedro_viz.api import apps
from kedro_viz.api.rest.responses.pipelines import GraphAPIResponse
from kedro_viz.integrations.kedro.inspection import VizProjectContext
from kedro_viz.integrations.kedro.inspection.services.graph_service import (
    GraphService,
    PipelineNotFoundError,
)
from kedro_viz.integrations.kedro.inspection.services.run_status_service import (
    RunStatusService,
)
from kedro_viz.integrations.kedro.live.deferred_loader import deferred_data_loader

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


@pytest.fixture
def spy_service() -> _SpyGraphService:
    return _SpyGraphService()


@pytest.fixture
def clean_deferred_loader() -> Iterator[None]:
    """Reset the shared deferred loader before and after each test."""
    deferred_data_loader.reset()
    yield
    deferred_data_loader.reset()


@pytest.fixture
def client(spy_service: _SpyGraphService) -> TestClient:
    context = VizProjectContext(
        graph=spy_service,
        run_status=RunStatusService(Path.cwd()),
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
                run_status=RunStatusService(Path.cwd()),
            ),
            Path.cwd(),
        )
    )
    second_client = TestClient(
        apps.create_api_app_from_project(
            VizProjectContext(
                graph=second_service,
                run_status=RunStatusService(Path.cwd()),
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


def test_main_route_preloads_the_live_data(
    client: TestClient, clean_deferred_loader: None
) -> None:
    """Serving the graph starts the live load, so the first node click is quick."""
    calls: list[str] = []
    deferred_data_loader.configure(lambda: calls.append("loaded"))

    response = client.get("/api/main")

    assert response.status_code == 200
    assert calls == ["loaded"]


def test_main_route_serves_the_graph_when_the_preload_fails(
    client: TestClient, clean_deferred_loader: None
) -> None:
    """A failed live load doesn't break the graph. Node details still return 503."""
    attempts: list[str] = []

    def failing_load() -> None:
        attempts.append("attempt")
        raise RuntimeError("broken")

    deferred_data_loader.configure(failing_load)

    assert client.get("/api/main").status_code == 200
    assert attempts == ["attempt"]
    assert client.get("/api/nodes/any-node").status_code == 503
    assert attempts == ["attempt"], "the failed load must not be retried"


def test_pipeline_route_does_not_preload(
    client: TestClient, clean_deferred_loader: None
) -> None:
    """Only /api/main starts the preload. The frontend always requests it first."""
    calls: list[str] = []
    deferred_data_loader.configure(lambda: calls.append("loaded"))

    assert client.get("/api/pipelines/data_ingestion").status_code == 200

    assert calls == []


def test_main_route_does_not_preload_with_autoreload(
    spy_service: _SpyGraphService, clean_deferred_loader: None
) -> None:
    """With autoreload, a running preload would slow every restart, so it's skipped."""
    calls: list[str] = []
    deferred_data_loader.configure(lambda: calls.append("loaded"))
    context = VizProjectContext(
        graph=spy_service, run_status=RunStatusService(Path.cwd())
    )
    client = TestClient(
        apps.create_api_app_from_project(context, Path.cwd(), autoreload=True)
    )

    assert client.get("/api/main").status_code == 200

    assert calls == []


class _LiveServer:
    """Run the app on a real uvicorn server, on a free local port.

    ``TestClient`` runs background tasks before it returns, so it can't show when the
    response arrives or how shutdown behaves.
    """

    def __init__(self, spy_service: _SpyGraphService) -> None:
        app = apps.create_api_app_from_project(
            VizProjectContext(
                graph=spy_service, run_status=RunStatusService(Path.cwd())
            ),
            Path.cwd(),
        )
        self.sock = socket.socket()
        self.sock.bind(("127.0.0.1", 0))
        self.port = self.sock.getsockname()[1]
        self.server = uvicorn.Server(uvicorn.Config(app, log_level="warning"))
        self.thread = threading.Thread(
            target=self.server.run, kwargs={"sockets": [self.sock]}, daemon=True
        )

    def __enter__(self) -> _LiveServer:
        self.thread.start()
        for _ in range(500):
            if self.server.started:
                return self
            threading.Event().wait(0.01)
        raise RuntimeError("uvicorn did not start")

    def __exit__(self, *exc_info: object) -> None:
        self.server.should_exit = True
        self.thread.join(timeout=10)
        self.sock.close()

    def get(self, path: str) -> bytes:
        with urllib.request.urlopen(
            f"http://127.0.0.1:{self.port}{path}", timeout=10
        ) as response:
            return response.read()


def test_graph_response_arrives_before_the_preload_finishes(
    spy_service: _SpyGraphService, clean_deferred_loader: None
) -> None:
    """The /api/main response arrives while the preload is still running."""
    started = threading.Event()
    release = threading.Event()

    def blocking_load() -> None:
        started.set()
        release.wait(timeout=10)

    deferred_data_loader.configure(blocking_load)
    try:
        with _LiveServer(spy_service) as server:
            body = server.get("/api/main")
            assert b'"selected_pipeline":"__default__"' in body
            assert started.wait(timeout=5), (
                "the preload should start after the response"
            )
            assert not release.is_set()
            release.set()
    finally:
        release.set()


def test_shutdown_waits_for_a_running_preload_and_its_cleanup(
    spy_service: _SpyGraphService, clean_deferred_loader: None
) -> None:
    """Shutdown waits for a running preload, so the load can clean up."""
    started = threading.Event()
    release = threading.Event()
    cleaned_up = threading.Event()

    def blocking_load() -> None:
        started.set()
        try:
            release.wait(timeout=10)
        finally:
            cleaned_up.set()

    deferred_data_loader.configure(blocking_load)
    server = _LiveServer(spy_service)
    try:
        with server:
            server.get("/api/main")
            assert started.wait(timeout=5)
            server.server.should_exit = True
            server.thread.join(timeout=0.5)
            assert server.thread.is_alive(), "shutdown should wait for the preload"
            release.set()
        assert not server.thread.is_alive()
        assert cleaned_up.is_set()
    finally:
        release.set()
