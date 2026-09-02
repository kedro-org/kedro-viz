"""Tests for the lite-mode snapshot-backed metadata path (Phase 6.6).

Lite mode is "no live project loaded": ``data_access_manager`` stays empty, the bridge is
empty, and ``/api/nodes/{id}`` is served from the inspection snapshot alone. The payload shape
matches the live ``*APIResponse`` schemas but live-only fields (source code, previews, stats) are
absent. Parameter values are present — they come from the config loader, not the live project.

Two layers:

1. **Hermetic** — build the provider against the demo project with no live nodes injected
   (``live_nodes=GraphNodesRepository()``); inspect ``_snapshot_lookup`` and assert the right
   payloads for task / data / parameter ids.
2. **End-to-end via FastAPI ``TestClient``** — flag ON, adapter installed, bridge empty, hit
   ``/api/main`` and then ``/api/nodes/{id}`` for each task / data / parameter id; assert each
   response carries the thin payload (and modular pipeline ids still 404).
"""

from pathlib import Path
from typing import Iterator

import pytest
from fastapi import FastAPI
from fastapi.responses import JSONResponse
from fastapi.testclient import TestClient

from kedro_viz.api.data_provider import (
    set_inspection_adapter_provider,
)
from kedro_viz.api.inspection_adapter_provider import InspectionAdapterProvider
from kedro_viz.api.rest.router import router as rest_router
from kedro_viz.data_access.repositories.graph import GraphNodesRepository
from kedro_viz.integrations.kedro import node_ids
from kedro_viz.integrations.kedro.inspection import snapshot_source

REPO_ROOT = Path(__file__).resolve().parents[3]
DEMO_PROJECT = REPO_ROOT / "demo-project"


@pytest.fixture(scope="module")
def lite_provider(_restore_kedro_project_state) -> InspectionAdapterProvider:
    """Adapter built with an empty live-nodes repo — simulates lite mode."""
    return InspectionAdapterProvider(DEMO_PROJECT, live_nodes=GraphNodesRepository())


# -- Layer 1: hermetic snapshot-lookup --------------------------------------------------- #


def test_bridge_is_empty_in_lite_mode(
    lite_provider: InspectionAdapterProvider,
) -> None:
    assert lite_provider._metadata_bridge == {}


def test_snapshot_lookup_populates_task_metadata(
    lite_provider: InspectionAdapterProvider,
) -> None:
    """Every snapshot task carries inputs + outputs in its lite payload."""
    snapshot = lite_provider._snapshot
    sample_node = snapshot.pipelines[0].nodes[0]
    task_id = node_ids._create_task_node_id_from_node_snapshot(sample_node)
    payload = lite_provider._snapshot_lookup[task_id]
    assert payload["inputs"] == list(sample_node.inputs)
    assert payload["outputs"] == list(sample_node.outputs)
    # Live-only keys must not leak into the lite payload.
    assert "code" not in payload
    assert "parameters" not in payload


def test_snapshot_lookup_populates_data_metadata(
    lite_provider: InspectionAdapterProvider,
) -> None:
    """A catalog-registered dataset exposes its type + filepath from the snapshot."""
    payload = lite_provider._snapshot_lookup[
        node_ids._create_dataset_node_id("companies")
    ]
    assert payload["type"] == "pandas.CSVDataset"
    assert payload["filepath"]  # demo project ships a real filepath
    assert "preview" not in payload
    assert "stats" not in payload


def test_snapshot_lookup_synthesizes_memory_dataset_type(
    lite_provider: InspectionAdapterProvider,
) -> None:
    """An io-ref with no catalog entry resolves to the live path's MemoryDataset string."""
    from kedro_viz.utils import _strip_transcoding, is_dataset_param

    snapshot = lite_provider._snapshot
    memory_ref = next(
        ref
        for pipeline in snapshot.pipelines
        for node in pipeline.nodes
        for ref in [*node.inputs, *node.outputs]
        if not is_dataset_param(ref)
        and _strip_transcoding(ref) not in snapshot.datasets
    )
    payload = lite_provider._snapshot_lookup[
        node_ids._create_dataset_node_id(memory_ref)
    ]
    assert payload == {"type": "io.memory_dataset.MemoryDataset"}


def test_snapshot_lookup_treats_parameter_refs_separately(
    lite_provider: InspectionAdapterProvider,
) -> None:
    """A ``params:...`` reference resolves to a parameter payload (not a data payload), and in
    lite mode it now carries the real resolved value (read from the config loader, not the live
    project)."""
    # The demo's nodes consume parameters; find one we know is referenced.
    snapshot = lite_provider._snapshot
    param_refs = {
        ref
        for pipeline in snapshot.pipelines
        for node in pipeline.nodes
        for ref in node.inputs
        if ref.startswith("params:")
    }
    assert param_refs, "demo project should reference parameters"
    sample_ref = next(iter(param_refs))
    payload = lite_provider._snapshot_lookup[
        node_ids._create_dataset_node_id(sample_ref)
    ]
    # A parameter payload (has "parameters"), carrying the real resolved value.
    assert set(payload) == {"parameters"}
    assert payload["parameters"] == lite_provider._param_value(sample_ref)


def test_get_node_ids_uses_snapshot_lookup_when_bridge_is_empty(
    lite_provider: InspectionAdapterProvider,
) -> None:
    """Lite mode export still has a node id list to walk."""
    assert lite_provider.get_node_ids()
    assert set(lite_provider.get_node_ids()) == set(lite_provider._snapshot_lookup)


def test_lite_metadata_response_carries_no_live_only_fields(
    lite_provider: InspectionAdapterProvider,
) -> None:
    """The JSONResponse body must not include live-only keys (frontend depends on this)."""
    import json

    snapshot = lite_provider._snapshot
    sample_node = snapshot.pipelines[0].nodes[0]
    task_id = node_ids._create_task_node_id_from_node_snapshot(sample_node)
    response = lite_provider.get_node_metadata_response(task_id)
    # Lite-mode responses are always JSONResponse — narrow for mypy + read the raw body.
    assert isinstance(response, JSONResponse)
    body = json.loads(response.body)
    # Source now comes from the snapshot location, so lite mode carries it too. Live-only
    # fields (previews, stats) must still be absent.
    assert set(body) == {"inputs", "outputs", "code", "filepath"}
    assert "preview" not in body
    assert "stats" not in body


# -- Layer 2: end-to-end through the router --------------------------------------------- #


@pytest.fixture
def lite_client(
    lite_provider: InspectionAdapterProvider, monkeypatch: pytest.MonkeyPatch
) -> Iterator[TestClient]:
    set_inspection_adapter_provider(lite_provider)
    app = FastAPI()
    app.include_router(rest_router)
    yield TestClient(app)
    set_inspection_adapter_provider(None)


def test_lite_mode_serves_graph_and_node_metadata(lite_client: TestClient) -> None:
    """`/api/main` returns nodes; each task / data / parameters id resolves under /api/nodes."""
    main = lite_client.get("/api/main").json()
    addressable = [
        n for n in main["nodes"] if n["type"] in {"task", "data", "parameters"}
    ]
    assert addressable, "expected at least one metadata-bearing node"
    misses = []
    for node in addressable:
        response = lite_client.get(f"/api/nodes/{node['id']}")
        if response.status_code != 200:
            misses.append((node["type"], node.get("name"), response.status_code))
    assert not misses, f"lite-mode /api/nodes/{{id}} regressions: {misses[:5]}"


def test_lite_mode_returns_404_for_unknown_id(lite_client: TestClient) -> None:
    response = lite_client.get("/api/nodes/does-not-exist")
    assert response.status_code == 404
