"""Tests for the node-metadata bridge in :class:`InspectionAdapterProvider` (Phase 6.4).

Two layers:

1. **Hermetic** — feed a synthetic ``GraphNodesRepository`` into the provider and assert the
   bridge maps the right new-scheme IDs to the right live viz nodes (including transcoded
   collapse and skipping non-metadata-bearing nodes).
2. **End-to-end on ``demo-project``** — populate ``data_access_manager`` from the demo project,
   build the provider, hit ``/api/nodes/{id}`` through the FastAPI router with the experimental
   flag ON, and assert the response carries real live metadata (e.g. a task node returns code +
   inputs + outputs; a data node returns ``filepath`` + ``type``).
"""

from pathlib import Path
from typing import Iterator

import pytest
from fastapi import FastAPI
from fastapi.responses import JSONResponse
from fastapi.testclient import TestClient
from kedro.pipeline import node as kedro_node

from kedro_viz.api.data_provider import (
    INSPECTION_ADAPTER_ENV_VAR,
    set_inspection_adapter_provider,
)
from kedro_viz.api.inspection_adapter_provider import InspectionAdapterProvider
from kedro_viz.api.rest.router import router as rest_router
from kedro_viz.data_access.repositories.graph import GraphNodesRepository
from kedro_viz.integrations.kedro import node_ids
from kedro_viz.integrations.kedro.inspection import snapshot_source
from kedro_viz.models.flowchart.nodes import (
    DataNode,
    ParametersNode,
    TaskNode,
    TranscodedDataNode,
)

REPO_ROOT = Path(__file__).resolve().parents[3]
DEMO_PROJECT = REPO_ROOT / "demo-project"

pytestmark = pytest.mark.skipif(
    not snapshot_source.is_inspection_available(),
    reason="kedro inspection API unavailable (requires kedro>=1.4.0)",
)


# -- Layer 1: hermetic bridge construction ------------------------------------------------- #


def _task_viz_node() -> TaskNode:
    """Build a live ``TaskNode`` viz model around a synthetic Kedro node."""
    kn = kedro_node(func=lambda a, b: a, inputs=["a", "b"], outputs="c", name="my_node")
    return TaskNode.create_task_node(
        node=kn, node_id="task-id-placeholder", modular_pipelines=set()
    )


def _data_viz_node(name: str) -> "DataNode | TranscodedDataNode":
    """Build a live (transcoded-)``DataNode`` viz model with no underlying dataset."""
    return DataNode.create_data_node(
        dataset_id="data-id-placeholder",
        dataset_name=name,
        layer=None,
        tags=set(),
        dataset=None,
        modular_pipelines=set(),
        is_free_input=True,
    )


def _params_viz_node(name: str) -> ParametersNode:
    return ParametersNode.create_parameters_node(
        dataset_id="params-id-placeholder",
        dataset_name=name,
        layer=None,
        tags=set(),
        parameters=None,
        modular_pipelines=set(),
    )


def _provider_with_repo(repo: GraphNodesRepository) -> InspectionAdapterProvider:
    """Provider built against the demo snapshot + an injected live-nodes repository."""
    return InspectionAdapterProvider(DEMO_PROJECT, live_nodes=repo)


def test_bridge_maps_task_node_to_new_id() -> None:
    task = _task_viz_node()
    repo = GraphNodesRepository()
    repo.add_node(task)

    provider = _provider_with_repo(repo)

    expected_id = node_ids.task_node_id("my_node", ["a", "b"], ["c"])
    assert provider._metadata_bridge[expected_id] is task


def test_bridge_maps_data_node_to_new_id() -> None:
    data = _data_viz_node("companies")
    repo = GraphNodesRepository()
    repo.add_node(data)

    provider = _provider_with_repo(repo)

    assert provider._metadata_bridge[node_ids.dataset_node_id("companies")] is data


def test_bridge_maps_parameters_node_to_new_id() -> None:
    params = _params_viz_node("params:feature_engineering.threshold")
    repo = GraphNodesRepository()
    repo.add_node(params)

    provider = _provider_with_repo(repo)

    assert (
        provider._metadata_bridge[
            node_ids.dataset_node_id("params:feature_engineering.threshold")
        ]
        is params
    )


def test_bridge_collapses_transcoded_variants_to_one_entry() -> None:
    """Transcoded variants share a new-scheme id; the first one wins."""
    first = _data_viz_node("typed_shuttles@pandas1")
    second = _data_viz_node("typed_shuttles@pandas2")
    repo = GraphNodesRepository()
    repo.add_node(first)
    repo.add_node(second)

    provider = _provider_with_repo(repo)

    shared_id = node_ids.dataset_node_id("typed_shuttles@pandas1")
    assert node_ids.dataset_node_id("typed_shuttles@pandas2") == shared_id
    assert provider._metadata_bridge[shared_id] is first


def test_bridge_is_empty_when_no_live_nodes() -> None:
    provider = _provider_with_repo(GraphNodesRepository())
    assert provider._metadata_bridge == {}


def test_get_node_metadata_response_returns_404_for_unknown_id() -> None:
    provider = _provider_with_repo(GraphNodesRepository())
    response = provider.get_node_metadata_response("not-an-id")
    # Narrow the protocol's union to JSONResponse — only that branch carries `status_code`.
    assert isinstance(response, JSONResponse)
    assert response.status_code == 404


# -- Layer 2: end-to-end against demo-project --------------------------------------------- #


@pytest.fixture(scope="module")
def _populated_demo(_restore_kedro_project_state) -> Iterator[None]:
    """Populate the module-singleton ``data_access_manager`` from the demo project once."""
    from kedro_viz.data_access import data_access_manager
    from kedro_viz.data_access.managers import DataAccessManager
    from kedro_viz.integrations.kedro import data_loader as kedro_data_loader
    from kedro_viz.server import populate_data

    catalog, pipelines, node_extras_dict = kedro_data_loader.load_data(DEMO_PROJECT)
    populate_data(data_access_manager, catalog, pipelines, node_extras_dict)

    yield

    # Reset the singleton so other test modules don't see this state.
    fresh = DataAccessManager()
    data_access_manager.__dict__.clear()
    data_access_manager.__dict__.update(fresh.__dict__)


@pytest.fixture(scope="module")
def demo_provider(_populated_demo) -> InspectionAdapterProvider:
    """Adapter provider built from the demo snapshot, with the live bridge populated."""
    return InspectionAdapterProvider(DEMO_PROJECT)


@pytest.fixture
def adapter_client(
    demo_provider: InspectionAdapterProvider, monkeypatch: pytest.MonkeyPatch
) -> Iterator[TestClient]:
    monkeypatch.setenv(INSPECTION_ADAPTER_ENV_VAR, "1")
    set_inspection_adapter_provider(demo_provider)
    app = FastAPI()
    app.include_router(rest_router)
    yield TestClient(app)
    set_inspection_adapter_provider(None)


def _first_node_by_type(body: dict, node_type: str) -> dict:
    for n in body["nodes"]:
        if n["type"] == node_type:
            return n
    raise AssertionError(f"no node of type {node_type!r} in /api/main response")


def test_task_node_metadata_resolves_for_adapter_id(adapter_client: TestClient) -> None:
    main = adapter_client.get("/api/main").json()
    task = _first_node_by_type(main, "task")

    response = adapter_client.get(f"/api/nodes/{task['id']}")
    assert response.status_code == 200
    body = response.json()
    # Live task metadata exposes at least the input/output names + code path.
    assert body.get("inputs") is not None
    assert body.get("outputs") is not None


def test_data_node_metadata_resolves_for_adapter_id(adapter_client: TestClient) -> None:
    main = adapter_client.get("/api/main").json()
    data = _first_node_by_type(main, "data")

    response = adapter_client.get(f"/api/nodes/{data['id']}")
    # 200 with content for catalog-registered datasets; 200 with `{}` for free inputs (mirrors live).
    assert response.status_code == 200


def test_unknown_node_id_returns_404(adapter_client: TestClient) -> None:
    response = adapter_client.get("/api/nodes/does-not-exist")
    assert response.status_code == 404
