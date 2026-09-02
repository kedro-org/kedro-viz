"""Hermetic tests for modular-pipeline graph rendering."""

from typing import TYPE_CHECKING, cast

from kedro_viz.api.rest.responses.pipelines import (
    DataNodeAPIResponse,
    GraphEdgeAPIResponse,
    TaskNodeAPIResponse,
)
from kedro_viz.constants import ROOT_MODULAR_PIPELINE_ID
from kedro_viz.integrations.kedro.inspection.modular_pipelines import (
    ModularPipelineView,
)
from kedro_viz.integrations.kedro.inspection.modular_pipelines.view import (
    _add_modular_pipeline_boundary_edges,
    _remove_cyclic_modular_pipeline_boundary_edges,
)
from kedro_viz.integrations.kedro.node_ids import _create_dataset_node_id

if TYPE_CHECKING:
    from kedro.inspection.models import NodeSnapshot


def test_modular_edges_connect_boundary_datasets(_node, _tree_builder) -> None:
    tree = _tree_builder([_node("ns.task", ["x"], ["y"], namespace="ns")]).build()
    edges: dict[tuple[str, str], GraphEdgeAPIResponse] = {}
    _add_modular_pipeline_boundary_edges(edges, tree)
    assert (_create_dataset_node_id("x"), "ns") in edges
    assert ("ns", _create_dataset_node_id("y")) in edges


def test_root_has_no_modular_edges(_node, _tree_builder) -> None:
    tree = _tree_builder([_node("task", ["x"], ["y"])]).build()
    edges: dict[tuple[str, str], GraphEdgeAPIResponse] = {}
    _add_modular_pipeline_boundary_edges(edges, tree)
    assert edges == {}


def test_cyclic_modular_edge_is_removed(_node, _tree_builder) -> None:
    """``a`` feeds ``ns`` but is also produced downstream of it, so the inbound edge is dropped."""
    nodes = [
        _node("ns.inner", ["a"], ["b"], namespace="ns"),
        _node("outer", ["b"], ["a"]),
    ]
    tree = _tree_builder(nodes).build()
    a_id, b_id = _create_dataset_node_id("a"), _create_dataset_node_id("b")
    edges: dict[tuple[str, str], GraphEdgeAPIResponse] = {
        (b_id, "outer_task"): GraphEdgeAPIResponse(source=b_id, target="outer_task"),
        ("outer_task", a_id): GraphEdgeAPIResponse(source="outer_task", target=a_id),
    }
    _add_modular_pipeline_boundary_edges(edges, tree)
    assert (a_id, "ns") in edges

    _remove_cyclic_modular_pipeline_boundary_edges(edges, tree)
    assert (a_id, "ns") not in edges
    assert ("ns", b_id) in edges


def test_acyclic_modular_edges_are_kept(_node, _tree_builder) -> None:
    tree = _tree_builder([_node("ns.task", ["x"], ["y"], namespace="ns")]).build()
    edges: dict[tuple[str, str], GraphEdgeAPIResponse] = {}
    _add_modular_pipeline_boundary_edges(edges, tree)
    before = set(edges)
    _remove_cyclic_modular_pipeline_boundary_edges(edges, tree)
    assert set(edges) == before


def test_view_extends_graph_and_returns_tree(_node) -> None:
    node = _node("ns.task", ["x"], ["y"], namespace="ns")
    nodes = [node]
    graph_nodes: list[TaskNodeAPIResponse | DataNodeAPIResponse] = []
    edges: dict[tuple[str, str], GraphEdgeAPIResponse] = {}

    tree = ModularPipelineView(cast("list[NodeSnapshot]", nodes)).extend_graph(
        graph_nodes, edges, selected_pipeline_id="pipeline"
    )

    assert [(graph_node.id, graph_node.pipelines) for graph_node in graph_nodes] == [
        ("ns", ["pipeline"])
    ]
    assert set(edges) == {
        (_create_dataset_node_id("x"), "ns"),
        ("ns", _create_dataset_node_id("y")),
    }
    assert set(tree) == {ROOT_MODULAR_PIPELINE_ID, "ns"}
    assert tree["ns"].inputs == [_create_dataset_node_id("x")]


def test_modular_edges_are_emitted_in_a_stable_order(_node, _tree_builder) -> None:
    nodes = [_node("ns.task", ["b_in", "a_in"], ["b_out", "a_out"], namespace="ns")]
    tree = _tree_builder(nodes).build()
    edges: dict[tuple[str, str], GraphEdgeAPIResponse] = {}
    _add_modular_pipeline_boundary_edges(edges, tree)

    expected = [(input_id, "ns") for input_id in sorted(tree["ns"].inputs)]
    expected.extend(("ns", output_id) for output_id in sorted(tree["ns"].outputs))
    assert list(edges) == expected
