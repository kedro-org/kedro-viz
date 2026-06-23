"""Phase 1 — ``--params`` parity.

The live backend is the source of truth: the adapter is correct when it produces the same task
parameters for the same ``--params``. The live backend is still present, so we run both engines and
diff them (aligned by ``full_name`` — the two engines use different node-ID schemes).

The adapter is built with an **empty bridge** (``live_nodes=GraphNodesRepository()``) so its
parameter values can only come from the config-loader overlay, not the live nodes — which also
proves the lite-mode path.
"""

import json
from pathlib import Path
from typing import Any

import pytest

from kedro_viz.api.rest.responses.pipelines import GraphAPIResponse
from kedro_viz.integrations.kedro import node_ids
from kedro_viz.integrations.kedro.inspection import snapshot_source

DEMO = Path(__file__).resolve().parents[3] / "demo-project"

# The demo's ``split_data`` node consumes ``params:split_options``; override one value.
OVERRIDE: dict[str, Any] = {"split_options": {"test_size": 0.99}}

pytestmark = pytest.mark.skipif(
    not snapshot_source.is_inspection_available(),
    reason="kedro inspection API unavailable (requires kedro>=1.4.0)",
)


def _live_task_params(runtime_params: dict[str, Any] | None) -> dict[str, dict]:
    """Task ``parameters`` from the live backend (the trusted answer), keyed by ``full_name``."""
    from kedro_viz.api.rest.responses.pipelines import get_pipeline_response
    from kedro_viz.data_access import data_access_manager
    from kedro_viz.data_access.managers import DataAccessManager
    from kedro_viz.integrations.kedro import data_loader
    from kedro_viz.server import populate_data

    catalog, pipelines, extras = data_loader.load_data(
        DEMO, extra_params=runtime_params
    )
    populate_data(data_access_manager, catalog, pipelines, extras)
    try:
        result = get_pipeline_response()
        assert isinstance(result, GraphAPIResponse)
        main = result.model_dump()
        return {
            n["full_name"]: n["parameters"]
            for n in main["nodes"]
            if n["type"] == "task"
        }
    finally:
        # Reset the module-singleton so the live load doesn't leak into other tests.
        fresh = DataAccessManager()
        data_access_manager.__dict__.clear()
        data_access_manager.__dict__.update(fresh.__dict__)


def _adapter_task_params(runtime_params: dict[str, Any] | None) -> dict[str, dict]:
    """Task ``parameters`` from the adapter (empty bridge → values from the overlay only)."""
    from kedro_viz.api.inspection_adapter_provider import InspectionAdapterProvider
    from kedro_viz.data_access.repositories import GraphNodesRepository

    provider = InspectionAdapterProvider(
        DEMO, runtime_params=runtime_params, live_nodes=GraphNodesRepository()
    )
    result = provider.get_pipeline_response()
    assert isinstance(result, GraphAPIResponse)
    main = result.model_dump()
    return {
        n["full_name"]: n["parameters"] for n in main["nodes"] if n["type"] == "task"
    }


def test_task_parameters_match_live_no_params() -> None:
    """With no ``--params``, the adapter's task parameters match the live backend exactly."""
    assert _adapter_task_params(None) == _live_task_params(None)


def test_task_parameters_match_live_with_override() -> None:
    """With ``--params``, the adapter matches live and the override is reflected."""
    adapter = _adapter_task_params(OVERRIDE)
    assert adapter == _live_task_params(OVERRIDE)
    assert any(
        p.get("split_options", {}).get("test_size") == 0.99 for p in adapter.values()
    ), "the overridden split_options.test_size=0.99 should appear on a task"


def test_override_changes_value_from_overlay_only() -> None:
    """Layer-3 isolation: with an empty bridge, the override still lands (from the overlay)."""
    base = _adapter_task_params(None)
    overridden = _adapter_task_params(OVERRIDE)
    assert base != overridden
    assert any(
        p.get("split_options", {}).get("test_size") == 0.99 for p in overridden.values()
    )


# -- /api/nodes/{id} parameter-metadata parity (the shape live uses) ----------------------- #
#
# ``params:x`` (single) → ``{"parameters": {x: value}}`` keyed by name; the dotted form keeps the
# dotted name as the key. These prove the adapter's parameter-node payload matches the live
# ``ParametersNodeMetadata`` exactly, with values from the config-loader overlay (empty bridge).

# Refs the demo is known to expose: a single param node and a dotted one.
SINGLE_REF = "params:split_options"
DOTTED_REF = "params:ingestion.typing.reviews.columns_as_floats"


def _adapter_param_metadata(runtime_params: dict[str, Any] | None, ref: str) -> dict:
    from kedro_viz.api.inspection_adapter_provider import InspectionAdapterProvider
    from kedro_viz.data_access.repositories import GraphNodesRepository

    provider = InspectionAdapterProvider(
        DEMO, runtime_params=runtime_params, live_nodes=GraphNodesRepository()
    )
    resp = provider.get_node_metadata_response(node_ids.dataset_node_id(ref))
    return json.loads(resp.body)  # type: ignore[union-attr]


def _live_param_metadata(runtime_params: dict[str, Any] | None, ref: str) -> dict:
    from kedro_viz.api.rest.responses.nodes import get_node_metadata_response
    from kedro_viz.data_access import data_access_manager
    from kedro_viz.data_access.managers import DataAccessManager
    from kedro_viz.integrations.kedro import data_loader
    from kedro_viz.models.flowchart.nodes import ParametersNode
    from kedro_viz.server import populate_data

    catalog, pipelines, extras = data_loader.load_data(
        DEMO, extra_params=runtime_params
    )
    populate_data(data_access_manager, catalog, pipelines, extras)
    try:
        node = next(
            n
            for n in data_access_manager.nodes.as_list()
            if isinstance(n, ParametersNode) and n.name == ref
        )
        return get_node_metadata_response(node.id).model_dump()
    finally:
        fresh = DataAccessManager()
        data_access_manager.__dict__.clear()
        data_access_manager.__dict__.update(fresh.__dict__)


@pytest.mark.parametrize("ref", [SINGLE_REF, DOTTED_REF])
def test_param_node_metadata_matches_live(ref: str) -> None:
    """Adapter ``/api/nodes/{id}`` parameter payload == live, with --params applied."""
    adapter = _adapter_param_metadata(OVERRIDE, ref)
    live = _live_param_metadata(OVERRIDE, ref)
    assert adapter["parameters"] == live["parameters"]


def test_single_param_node_is_keyed_by_name() -> None:
    """A single ``params:x`` node wraps its value under the param name (live shape), not bare."""
    adapter = _adapter_param_metadata(OVERRIDE, SINGLE_REF)
    # keyed by "split_options", and the override is inside it
    assert set(adapter["parameters"]) == {"split_options"}
    assert adapter["parameters"]["split_options"]["test_size"] == 0.99


# -- Gate 2: --params does not change graph topology --------------------------------------- #
#
# Pipelines are registered (register_pipelines) *before* --params is applied, for both the live
# backend and the snapshot. So --params can only change parameter *values*, never the node/edge
# set. This pins that invariant: the adapter's structure is identical with and without --params.


def _adapter_structure(
    runtime_params: dict[str, Any] | None,
) -> tuple[frozenset[str], frozenset[tuple[str, str]]]:
    from kedro_viz.api.inspection_adapter_provider import InspectionAdapterProvider
    from kedro_viz.data_access.repositories import GraphNodesRepository

    provider = InspectionAdapterProvider(
        DEMO, runtime_params=runtime_params, live_nodes=GraphNodesRepository()
    )
    result = provider.get_pipeline_response()
    assert isinstance(result, GraphAPIResponse)
    main = result.model_dump()
    node_ids_set = frozenset(n["id"] for n in main["nodes"])
    edges = frozenset((e["source"], e["target"]) for e in main["edges"])
    return node_ids_set, edges


def test_params_do_not_change_graph_topology() -> None:
    """The node/edge set is identical with and without --params (only values differ)."""
    assert _adapter_structure(None) == _adapter_structure(OVERRIDE)
