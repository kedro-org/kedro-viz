"""Deep graph-shape coverage for the inspection adapter (ported from the retired live
``test_pipelines`` route tests).

The live ``/api/main`` tests asserted the full graph in detail — exact edges, the modular-pipeline
tree, layers and per-node fields. The adapter uses a new node-ID scheme, so rather than pin exact
ids these tests assert the same *shape* properties on the demo project: edges are referentially
consistent with nodes, the modular-pipeline tree is rooted at ``__root__`` and references real
nodes, layers come back as a list, and each node type carries its expected fields.
"""

from pathlib import Path
from typing import Any

import pytest

from kedro_viz.api.rest.responses.pipelines import GraphAPIResponse
from kedro_viz.integrations.kedro.inspection import snapshot_source

DEMO = Path(__file__).resolve().parents[3] / "demo-project"


def _main(pipeline_id: str | None = None) -> dict[str, Any]:
    """``/api/main`` (or a named pipeline) from the adapter, with an empty bridge so the shape comes
    purely from the snapshot graph."""
    from kedro_viz.api.inspection_adapter_provider import InspectionAdapterProvider
    from kedro_viz.data_access.repositories import GraphNodesRepository

    provider = InspectionAdapterProvider(DEMO, live_nodes=GraphNodesRepository())
    result = provider.get_pipeline_response(pipeline_id)
    assert isinstance(result, GraphAPIResponse)
    return result.model_dump()


def test_default_graph_is_non_empty() -> None:
    main = _main()
    assert main["selected_pipeline"] == "__default__"
    assert main["nodes"], "the demo default pipeline should have nodes"
    assert main["edges"], "the demo default pipeline should have edges"
    assert any(p["id"] == "__default__" for p in main["pipelines"])


def test_edges_are_referentially_consistent_with_nodes() -> None:
    """Every edge endpoint refers to a node present in the graph."""
    main = _main()
    node_ids = {n["id"] for n in main["nodes"]}
    for edge in main["edges"]:
        assert edge["source"] in node_ids, edge
        assert edge["target"] in node_ids, edge


def test_modular_pipeline_tree_is_rooted_and_references_real_entities() -> None:
    main = _main()
    tree = main["modular_pipelines"]
    assert "__root__" in tree
    node_ids = {n["id"] for n in main["nodes"]}
    for mp_id, mp_node in tree.items():
        # Each tree entry is itself addressable (the root, a node, or a modular-pipeline node).
        assert mp_id == "__root__" or mp_id in node_ids or mp_id in tree
        for child in mp_node["children"]:
            assert child["id"] in node_ids or child["id"] in tree, child


def test_layers_is_a_list_of_strings() -> None:
    main = _main()
    assert isinstance(main["layers"], list)
    assert all(isinstance(layer, str) for layer in main["layers"])


def test_node_types_carry_their_expected_fields() -> None:
    main = _main()
    by_type: dict[str, list[dict]] = {}
    for node in main["nodes"]:
        by_type.setdefault(node["type"], []).append(node)

    # The demo exercises every node type.
    assert by_type.get("task"), "expected task nodes"
    assert by_type.get("data"), "expected data nodes"
    assert by_type.get("parameters"), "expected parameter nodes"

    for task in by_type["task"]:
        assert "full_name" in task
        assert isinstance(task["parameters"], dict)

    # Data nodes carry a dataset_type; at least one resolves to a concrete class path.
    assert all("dataset_type" in d for d in by_type["data"])
    assert any(d["dataset_type"] for d in by_type["data"])


def test_named_pipeline_graph_is_consistent() -> None:
    """A named pipeline returns a self-consistent scoped graph."""
    from kedro_viz.api.inspection_adapter_provider import InspectionAdapterProvider
    from kedro_viz.data_access.repositories import GraphNodesRepository

    provider = InspectionAdapterProvider(DEMO, live_nodes=GraphNodesRepository())
    named = [p for p in provider.get_pipeline_ids() if p != "__default__"]
    assert named, "the demo should expose at least one named pipeline"

    result = provider.get_pipeline_response(named[0])
    assert isinstance(result, GraphAPIResponse)
    main = result.model_dump()
    assert main["selected_pipeline"] == named[0]
    node_ids = {n["id"] for n in main["nodes"]}
    for edge in main["edges"]:
        assert edge["source"] in node_ids
        assert edge["target"] in node_ids
