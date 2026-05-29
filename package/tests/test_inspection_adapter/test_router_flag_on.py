"""End-to-end route tests under the experimental adapter flag (Phase 6.2b).

Builds a minimal FastAPI app around ``rest_router``, installs an :class:`InspectionAdapterProvider`
built from the demo project, sets ``KEDRO_VIZ_INSPECTION_ADAPTER=1``, and asserts that the graph
routes (``/api/main`` and ``/api/pipelines/{id}``) come out of the adapter — structurally matching
the captured baseline, honouring ``--pipeline``, and preserving the 404 branch.

The two adapter providers (full + ``--pipeline`` scoped) are module-scoped because constructing
each one loads the snapshot once; the install / TestClient is function-scoped so each test sees
exactly the provider it asked for.
"""

import json
from pathlib import Path
from typing import Iterator

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from kedro_viz.api.data_provider import (
    INSPECTION_ADAPTER_ENV_VAR,
    set_inspection_adapter_provider,
)
from kedro_viz.api.inspection_adapter_provider import InspectionAdapterProvider
from kedro_viz.api.rest.router import router as rest_router
from kedro_viz.integrations.kedro.inspection import snapshot_source

REPO_ROOT = Path(__file__).resolve().parents[3]
DEMO_PROJECT = REPO_ROOT / "demo-project"
BASELINE_DIR = Path(__file__).parent / "baseline"

pytestmark = pytest.mark.skipif(
    not snapshot_source.is_inspection_available(),
    reason="kedro inspection API unavailable (requires kedro>=1.4.0)",
)


def _baseline(pipeline_id: str) -> dict:
    name = "main" if pipeline_id == "__default__" else pipeline_id
    path = BASELINE_DIR / ("main.json" if name == "main" else f"pipelines/{name}.json")
    return json.loads(path.read_text(encoding="utf-8"))


def _names(nodes: list[dict], node_type: str) -> set[str]:
    key = "full_name" if node_type == "task" else "name"
    return {n[key] for n in nodes if n["type"] == node_type}


@pytest.fixture(scope="module")
def adapter_provider(_restore_kedro_project_state) -> InspectionAdapterProvider:
    return InspectionAdapterProvider(DEMO_PROJECT)


@pytest.fixture(scope="module")
def adapter_provider_scoped(_restore_kedro_project_state) -> InspectionAdapterProvider:
    return InspectionAdapterProvider(DEMO_PROJECT, pipeline_name="modelling_stage")


def _build_client_with(
    provider: InspectionAdapterProvider, monkeypatch: pytest.MonkeyPatch
) -> TestClient:
    monkeypatch.setenv(INSPECTION_ADAPTER_ENV_VAR, "1")
    set_inspection_adapter_provider(provider)
    app = FastAPI()
    app.include_router(rest_router)
    return TestClient(app)


@pytest.fixture
def adapter_client(
    adapter_provider: InspectionAdapterProvider, monkeypatch: pytest.MonkeyPatch
) -> Iterator[TestClient]:
    yield _build_client_with(adapter_provider, monkeypatch)
    set_inspection_adapter_provider(None)


@pytest.fixture
def adapter_client_scoped(
    adapter_provider_scoped: InspectionAdapterProvider,
    monkeypatch: pytest.MonkeyPatch,
) -> Iterator[TestClient]:
    yield _build_client_with(adapter_provider_scoped, monkeypatch)
    set_inspection_adapter_provider(None)


# -- /api/main and /api/pipelines/{id} via the adapter --------------------------------------- #


def test_main_route_returns_default_graph_structurally(
    adapter_client: TestClient,
) -> None:
    response = adapter_client.get("/api/main")
    assert response.status_code == 200
    body = response.json()
    baseline = _baseline("__default__")
    assert body["selected_pipeline"] == "__default__"
    assert _names(body["nodes"], "task") == _names(baseline["nodes"], "task")
    assert _names(body["nodes"], "data") == _names(baseline["nodes"], "data")


def test_pipeline_route_returns_named_pipeline_structurally(
    adapter_client: TestClient,
) -> None:
    response = adapter_client.get("/api/pipelines/modelling_stage")
    assert response.status_code == 200
    body = response.json()
    baseline = _baseline("modelling_stage")
    assert body["selected_pipeline"] == "modelling_stage"
    assert _names(body["nodes"], "task") == _names(baseline["nodes"], "task")


def test_invalid_pipeline_route_returns_404(adapter_client: TestClient) -> None:
    response = adapter_client.get("/api/pipelines/does_not_exist")
    assert response.status_code == 404


# -- --pipeline scoping (D11 acceptance) ----------------------------------------------------- #


def test_pipeline_scope_main_route_returns_scoped_pipeline(
    adapter_client_scoped: TestClient,
) -> None:
    response = adapter_client_scoped.get("/api/main")
    assert response.status_code == 200
    body = response.json()
    assert body["selected_pipeline"] == "modelling_stage"
    assert [p["id"] for p in body["pipelines"]] == ["modelling_stage"]


def test_pipeline_scope_hides_other_pipelines_from_routes(
    adapter_client_scoped: TestClient,
) -> None:
    response = adapter_client_scoped.get("/api/pipelines/__default__")
    assert response.status_code == 404
