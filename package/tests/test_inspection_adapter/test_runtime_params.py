"""``--params`` support in the inspection adapter.

The adapter is the only graph engine: parameter *values* are resolved from Kedro's config loader
(with ``--params`` deep-merged), so the graph and node metadata reflect the overrides. These tests
build the adapter with an **empty bridge** (``live_nodes=GraphNodesRepository()``) so the values can
only come from the config-loader overlay — which also exercises the lite-mode path.
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


def test_override_is_reflected_in_task_parameters() -> None:
    """With ``--params``, the overridden value lands on the task that consumes it."""
    adapter = _adapter_task_params(OVERRIDE)
    assert any(
        p.get("split_options", {}).get("test_size") == 0.99 for p in adapter.values()
    ), "the overridden split_options.test_size=0.99 should appear on a task"


def test_override_changes_value_from_overlay_only() -> None:
    """With an empty bridge, the override still lands (resolved from the config-loader overlay)."""
    base = _adapter_task_params(None)
    overridden = _adapter_task_params(OVERRIDE)
    assert base != overridden
    assert any(
        p.get("split_options", {}).get("test_size") == 0.99 for p in overridden.values()
    )


# -- /api/nodes/{id} parameter-metadata shape ---------------------------------------------- #
#
# ``params:x`` (single) → ``{"parameters": {x: value}}`` keyed by name; the dotted form keeps the
# dotted name as the key. Values come from the config-loader overlay (empty bridge).

# Refs the demo is known to expose: a single param node and a dotted one.
SINGLE_REF = "params:split_options"
DOTTED_REF = "params:ingestion.typing.reviews.columns_as_floats"


def _adapter_param_metadata(runtime_params: dict[str, Any] | None, ref: str) -> dict:
    from kedro_viz.api.inspection_adapter_provider import InspectionAdapterProvider
    from kedro_viz.data_access.repositories import GraphNodesRepository

    provider = InspectionAdapterProvider(
        DEMO, runtime_params=runtime_params, live_nodes=GraphNodesRepository()
    )
    resp = provider.get_node_metadata_response(node_ids._create_dataset_node_id(ref))
    return json.loads(resp.body)  # type: ignore[union-attr]


def test_single_param_node_is_keyed_by_name() -> None:
    """A single ``params:x`` node wraps its value under the param name (live shape), not bare."""
    adapter = _adapter_param_metadata(OVERRIDE, SINGLE_REF)
    # keyed by "split_options", and the override is inside it
    assert set(adapter["parameters"]) == {"split_options"}
    assert adapter["parameters"]["split_options"]["test_size"] == 0.99


def test_dotted_param_node_is_keyed_by_dotted_name() -> None:
    """A dotted ``params:a.b.c`` node keeps the dotted name as the key."""
    adapter = _adapter_param_metadata(None, DOTTED_REF)
    key = DOTTED_REF[len("params:") :]
    assert key in adapter["parameters"]


# -- --params does not change graph topology (kedro >= 1.4) -------------------------------- #
#
# On kedro >= 1.4 there is no supported way for --params to reach register_pipelines:
# get_current_session() (the old hook for this) was removed, and the snapshot builds the graph from
# the param-blind global ``pipelines``. So --params changes parameter *values*, not the node/edge
# set. This pins that invariant: structure is identical with/without --params.


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
