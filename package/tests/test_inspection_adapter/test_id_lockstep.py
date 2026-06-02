"""Cross-endpoint ID lockstep (Phase 6.3): adapter graph IDs == run-status hook IDs.

Two layers:

1. Hermetic — construct a synthetic ``KedroNode`` and assert ``hash_node(node)`` equals
   ``node_ids.task_node_id(node.name, node.inputs, node.outputs)``. No project load.
2. End-to-end against ``demo-project`` — hit ``/api/main`` through the inspection adapter, then
   for every task node in the response, reconstruct the matching live ``KedroNode`` and assert the
   hook would emit the same ID. This is the gate the plan calls for: graph ID == run-status ID.
"""

from pathlib import Path
from typing import Iterator

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from kedro.framework.project import pipelines as live_pipelines
from kedro.framework.startup import bootstrap_project
from kedro.pipeline import node as kedro_node

from kedro_viz.api.data_provider import (
    set_inspection_adapter_provider,
)
from kedro_viz.api.inspection_adapter_provider import InspectionAdapterProvider
from kedro_viz.api.rest.router import router as rest_router
from kedro_viz.integrations.kedro import node_ids
from kedro_viz.integrations.kedro.hooks_utils import hash_node
from kedro_viz.integrations.kedro.inspection import snapshot_source

REPO_ROOT = Path(__file__).resolve().parents[3]
DEMO_PROJECT = REPO_ROOT / "demo-project"

pytestmark = pytest.mark.skipif(
    not snapshot_source.is_inspection_available(),
    reason="kedro inspection API unavailable (requires kedro>=1.4.0)",
)


# -- Layer 1: hermetic ---------------------------------------------------------------------- #


def test_hash_node_for_kedro_node_matches_task_node_id() -> None:
    node = kedro_node(
        func=lambda a, b: a, inputs=["a", "b"], outputs="c", name="my_node"
    )
    assert hash_node(node) == node_ids.task_node_id(
        node.name, list(node.inputs), list(node.outputs)
    )


def test_hash_node_for_dataset_string_matches_dataset_node_id() -> None:
    assert hash_node("companies") == node_ids.dataset_node_id("companies")


def test_hash_node_excludes_tags_for_kedro_node() -> None:
    """Re-tagging a Kedro node must not change the emitted run-status ID."""
    tagged = kedro_node(
        lambda a: a, inputs="a", outputs="b", name="n", tags=["one", "two"]
    )
    untagged = kedro_node(lambda a: a, inputs="a", outputs="b", name="n")
    assert hash_node(tagged) == hash_node(untagged)


# -- Layer 2: end-to-end against demo-project -------------------------------------------------- #


@pytest.fixture(scope="module")
def live_default_nodes(_restore_kedro_project_state) -> dict:
    """Map ``node.name -> live KedroNode`` for the demo project's default pipeline."""
    bootstrap_project(DEMO_PROJECT)
    default_pipeline = live_pipelines["__default__"]
    return {n.name: n for n in default_pipeline.nodes}


@pytest.fixture(scope="module")
def adapter_provider(_restore_kedro_project_state) -> InspectionAdapterProvider:
    return InspectionAdapterProvider(DEMO_PROJECT)


@pytest.fixture
def adapter_client(
    adapter_provider: InspectionAdapterProvider, monkeypatch: pytest.MonkeyPatch
) -> Iterator[TestClient]:
    set_inspection_adapter_provider(adapter_provider)
    app = FastAPI()
    app.include_router(rest_router)
    yield TestClient(app)
    set_inspection_adapter_provider(None)


def test_every_task_id_on_main_matches_run_status_hook(
    adapter_client: TestClient, live_default_nodes: dict
) -> None:
    """The gate from the plan: every adapter graph ID equals the hook's emitted ID."""
    response = adapter_client.get("/api/main")
    assert response.status_code == 200
    body = response.json()

    task_nodes = [n for n in body["nodes"] if n["type"] == "task"]
    assert task_nodes, "expected at least one task node in /api/main"

    mismatches = []
    for adapter_task in task_nodes:
        full_name = adapter_task["full_name"]
        live_node = live_default_nodes.get(full_name)
        if live_node is None:
            mismatches.append(f"{full_name}: not found in live pipeline")
            continue
        hook_id = hash_node(live_node)
        if hook_id != adapter_task["id"]:
            mismatches.append(
                f"{full_name}: adapter id {adapter_task['id']!r} != hook id {hook_id!r}"
            )
    assert not mismatches, "Adapter graph and run-status hook disagree:\n" + "\n".join(
        mismatches
    )
