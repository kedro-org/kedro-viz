"""Hermetic tests for modular-pipeline membership, tree and edges."""

from types import SimpleNamespace
from typing import TYPE_CHECKING, cast

from kedro_viz.api.rest.responses.pipelines import GraphEdgeAPIResponse
from kedro_viz.constants import ROOT_MODULAR_PIPELINE_ID
from kedro_viz.integrations.kedro.inspection.modular_pipelines import (
    ModularMembership,
    ModularTreeBuilder,
    _ancestor_namespaces,
    add_modular_edges,
    remove_cyclic_modular_edges,
)
from kedro_viz.integrations.kedro.node_ids import _create_dataset_node_id

if TYPE_CHECKING:
    from kedro.inspection.models import NodeSnapshot


def _membership(nodes: list[SimpleNamespace]) -> ModularMembership:
    """Build ``ModularMembership`` from duck-typed snapshot stand-ins."""
    return ModularMembership(cast("list[NodeSnapshot]", nodes))


def _tree_builder(nodes: list[SimpleNamespace]) -> ModularTreeBuilder:
    """Build ``ModularTreeBuilder`` from duck-typed snapshot stand-ins."""
    return ModularTreeBuilder(cast("list[NodeSnapshot]", nodes))


def _node(
    name: str,
    inputs: list[str],
    outputs: list[str],
    *,
    namespace: str | None = None,
    tags: set[str] | None = None,
) -> SimpleNamespace:
    local_name = name.removeprefix(f"{namespace}.") if namespace else name
    return SimpleNamespace(
        name=name,
        func_name=local_name,
        inputs=inputs,
        outputs=outputs,
        namespace=namespace,
        tags=tags or set(),
    )


def test_ancestor_namespaces_expands_every_level() -> None:
    assert _ancestor_namespaces("a.b.c") == ["a", "a.b", "a.b.c"]
    assert _ancestor_namespaces("solo") == ["solo"]


def test_task_belongs_only_to_its_own_namespace() -> None:
    """A nested task reports its deepest namespace, not its ancestors."""
    node = _node("a.b.task", ["x"], ["y"], namespace="a.b")
    membership = _membership([node])
    assert membership.for_task(cast("NodeSnapshot", node)) == ["a.b"]


def test_task_without_namespace_has_no_modular_pipelines() -> None:
    node = _node("task", ["x"], ["y"])
    assert _membership([node]).for_task(cast("NodeSnapshot", node)) is None


def test_dataset_belongs_to_every_owning_modular_pipeline() -> None:
    """A boundary dataset is owned by the nested pipeline and each of its ancestors."""
    node = _node("a.b.task", ["x"], ["y"], namespace="a.b")
    membership = _membership([node])
    assert membership.for_dataset("x") == ["a", "a.b"]
    assert membership.for_dataset("y") == ["a", "a.b"]


def test_parameters_never_belong_to_a_modular_pipeline() -> None:
    node = _node("ns.task", ["params:opts"], ["y"], namespace="ns")
    assert _membership([node]).for_dataset("params:opts") is None


def test_unowned_dataset_has_no_modular_pipelines() -> None:
    node = _node("task", ["x"], ["y"])
    assert _membership([node]).for_dataset("x") is None


def test_tree_ids_include_every_ancestor_namespace() -> None:
    builder = _tree_builder([_node("a.b.task", ["x"], ["y"], namespace="a.b")])
    assert builder.ids == ["a", "a.b"]


def test_tree_exposes_free_inputs_and_outputs() -> None:
    """``x`` is consumed but not produced inside ``ns``; ``y`` is produced but not consumed."""
    tree = _tree_builder([_node("ns.task", ["x"], ["y"], namespace="ns")]).build()
    assert tree["ns"].inputs == {_create_dataset_node_id("x")}
    assert tree["ns"].outputs == {_create_dataset_node_id("y")}


def test_internal_dataset_is_not_a_boundary() -> None:
    """A dataset produced and consumed inside the pipeline is neither an input nor an output."""
    tree = _tree_builder(
        [
            _node("ns.first", ["x"], ["mid"], namespace="ns"),
            _node("ns.second", ["mid"], ["y"], namespace="ns"),
        ]
    ).build()
    mid_id = _create_dataset_node_id("mid")
    assert mid_id not in tree["ns"].inputs
    assert mid_id not in tree["ns"].outputs


def test_nested_pipeline_is_a_child_of_its_parent() -> None:
    tree = _tree_builder([_node("a.b.task", ["x"], ["y"], namespace="a.b")]).build()
    assert ("a.b", "modularPipeline") in tree["a"].children
    assert ("a", "modularPipeline") in tree[ROOT_MODULAR_PIPELINE_ID].children


def test_root_holds_nodes_without_a_namespace() -> None:
    tree = _tree_builder([_node("task", ["x"], ["y"])]).build()
    root_children = tree[ROOT_MODULAR_PIPELINE_ID].children
    assert {node_type for _, node_type in root_children} == {"task", "data"}


def test_tree_without_namespaces_has_only_root() -> None:
    tree = _tree_builder([_node("task", ["x"], ["y"])]).build()
    assert set(tree) == {ROOT_MODULAR_PIPELINE_ID}


def test_modular_node_tags_union_the_whole_subtree() -> None:
    builder = _tree_builder(
        [
            _node("a.one", ["x"], ["y"], namespace="a", tags={"outer"}),
            _node("a.b.two", ["y"], ["z"], namespace="a.b", tags={"inner"}),
        ]
    )
    tags = builder.modular_node_tags()
    assert tags["a"] == ["inner", "outer"]
    assert tags["a.b"] == ["inner"]


def test_modular_edges_connect_boundary_datasets() -> None:
    tree = _tree_builder([_node("ns.task", ["x"], ["y"], namespace="ns")]).build()
    edges: dict[tuple[str, str], GraphEdgeAPIResponse] = {}
    add_modular_edges(edges, tree)
    assert (_create_dataset_node_id("x"), "ns") in edges
    assert ("ns", _create_dataset_node_id("y")) in edges


def test_root_has_no_modular_edges() -> None:
    tree = _tree_builder([_node("task", ["x"], ["y"])]).build()
    edges: dict[tuple[str, str], GraphEdgeAPIResponse] = {}
    add_modular_edges(edges, tree)
    assert edges == {}


def test_cyclic_modular_edge_is_removed() -> None:
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
    add_modular_edges(edges, tree)
    assert (a_id, "ns") in edges

    remove_cyclic_modular_edges(edges, tree)
    assert (a_id, "ns") not in edges
    assert ("ns", b_id) in edges


def test_acyclic_modular_edges_are_kept() -> None:
    tree = _tree_builder([_node("ns.task", ["x"], ["y"], namespace="ns")]).build()
    edges: dict[tuple[str, str], GraphEdgeAPIResponse] = {}
    add_modular_edges(edges, tree)
    before = set(edges)
    remove_cyclic_modular_edges(edges, tree)
    assert set(edges) == before
