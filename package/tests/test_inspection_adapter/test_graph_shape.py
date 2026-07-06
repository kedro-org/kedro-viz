"""Deep graph-shape coverage for the inspection graph builder (ported from the retired live
``test_pipelines`` route tests).

The live ``/api/main`` tests asserted the full graph in detail. The adapter uses a new node-ID
scheme, so rather than pin exact ids these tests assert the same *shape* properties on the demo
project's main graph: edges are referentially consistent with nodes, and each node type carries its
expected fields. The modular-pipeline tree and the layers list are later phases and are asserted
there, not here.

Runs against the bundled demo project (requires ``kedro>=1.4.0``).
"""

from pathlib import Path
from typing import Any

import pytest

from kedro_viz.integrations.kedro.inspection.graph_builder import GraphBuilder
from kedro_viz.integrations.kedro.inspection.snapshot_source import _InspectionSession

DEMO = Path(__file__).resolve().parents[3] / "demo-project"


@pytest.fixture(scope="module")
def builder(_restore_kedro_project_state) -> GraphBuilder:
    # Depend on the autouse state-restore fixture so it is set up *before* this bootstraps.
    return GraphBuilder(_InspectionSession(DEMO).snapshot())


def _main(builder: GraphBuilder, pipeline_id: str | None = None) -> dict[str, Any]:
    """The main graph (or a named pipeline) straight from the snapshot builder."""
    return builder.build(pipeline_id).model_dump()


def test_default_graph_is_non_empty(builder: GraphBuilder) -> None:
    main = _main(builder)
    assert main["selected_pipeline"] == "__default__"
    assert main["nodes"], "the demo default pipeline should have nodes"
    assert main["edges"], "the demo default pipeline should have edges"
    assert any(p["id"] == "__default__" for p in main["pipelines"])


def test_edges_are_referentially_consistent_with_nodes(builder: GraphBuilder) -> None:
    """Every edge endpoint refers to a node present in the graph."""
    main = _main(builder)
    node_ids = {n["id"] for n in main["nodes"]}
    for edge in main["edges"]:
        assert edge["source"] in node_ids, edge
        assert edge["target"] in node_ids, edge


def test_node_types_carry_their_expected_fields(builder: GraphBuilder) -> None:
    main = _main(builder)
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


def test_named_pipeline_graph_is_consistent(builder: GraphBuilder) -> None:
    """A named pipeline returns a self-consistent scoped graph."""
    named = [p for p in builder.pipeline_ids() if p != "__default__"]
    assert named, "the demo should expose at least one named pipeline"

    main = _main(builder, named[0])
    assert main["selected_pipeline"] == named[0]
    node_ids = {n["id"] for n in main["nodes"]}
    for edge in main["edges"]:
        assert edge["source"] in node_ids
        assert edge["target"] in node_ids
