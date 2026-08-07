"""Hermetic tests for modular pipelines, their tree and their edges."""

from types import SimpleNamespace
from typing import TYPE_CHECKING, cast

import pytest

from kedro_viz.api.rest.responses.pipelines import GraphEdgeAPIResponse
from kedro_viz.constants import ROOT_MODULAR_PIPELINE_ID
from kedro_viz.integrations.kedro.inspection.modular_pipelines import (
    _add_modular_pipeline_boundary_edges,
    _ancestor_namespaces,
    _ModularPipelineIndex,
    _ModularTreeBuilder,
    _remove_cyclic_modular_pipeline_boundary_edges,
)
from kedro_viz.integrations.kedro.node_ids import (
    _create_dataset_node_id,
    _create_task_node_id_from_node_snapshot,
)

if TYPE_CHECKING:
    from kedro.inspection.models import NodeSnapshot


def _membership(nodes: list[SimpleNamespace]) -> _ModularPipelineIndex:
    """Build a ``_ModularPipelineIndex`` from duck-typed snapshot stand-ins."""
    return _ModularPipelineIndex.from_nodes(cast("list[NodeSnapshot]", nodes))


def _tree_builder(nodes: list[SimpleNamespace]) -> _ModularTreeBuilder:
    """Build a ``_ModularTreeBuilder`` from duck-typed snapshot stand-ins."""
    return _ModularTreeBuilder(cast("list[NodeSnapshot]", nodes))


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


def test_dataset_belongs_to_every_owning_modular_pipeline() -> None:
    """A boundary dataset is owned by the nested pipeline and each of its ancestors."""
    node = _node("a.b.task", ["x"], ["y"], namespace="a.b")
    membership = _membership([node])
    assert membership.get_modular_pipelines_for_dataset("x") == ["a", "a.b"]
    assert membership.get_modular_pipelines_for_dataset("y") == ["a", "a.b"]


def test_parameters_never_belong_to_a_modular_pipeline() -> None:
    node = _node("ns.task", ["params:opts"], ["y"], namespace="ns")
    assert _membership([node]).get_modular_pipelines_for_dataset("params:opts") is None


def test_unowned_dataset_has_no_modular_pipelines() -> None:
    node = _node("task", ["x"], ["y"])
    assert _membership([node]).get_modular_pipelines_for_dataset("x") is None


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
    node = _node("task", ["x"], ["y"])
    tree = _tree_builder([node]).build()
    assert tree[ROOT_MODULAR_PIPELINE_ID].children == {
        (_create_task_node_id_from_node_snapshot(cast("NodeSnapshot", node)), "task"),
        (_create_dataset_node_id("x"), "data"),
        (_create_dataset_node_id("y"), "data"),
    }


def test_tree_without_namespaces_has_only_root() -> None:
    tree = _tree_builder([_node("task", ["x"], ["y"])]).build()
    assert set(tree) == {ROOT_MODULAR_PIPELINE_ID}


def test_source_and_sink_nodes_are_modular_pipeline_children() -> None:
    source = _node("ns.source", [], ["value"], namespace="ns")
    sink = _node("ns.sink", ["value"], [], namespace="ns")
    tree = _tree_builder([source, sink]).build()

    assert tree["ns"].inputs == set()
    assert tree["ns"].outputs == set()
    assert tree["ns"].children == {
        (
            _create_task_node_id_from_node_snapshot(cast("NodeSnapshot", source)),
            "task",
        ),
        (
            _create_task_node_id_from_node_snapshot(cast("NodeSnapshot", sink)),
            "task",
        ),
        (_create_dataset_node_id("value"), "data"),
    }


def test_modular_node_tags_union_the_whole_subtree() -> None:
    builder = _tree_builder(
        [
            _node("a.one", ["x"], ["y"], namespace="a", tags={"outer"}),
            _node("a.b.two", ["y"], ["z"], namespace="a.b", tags={"inner"}),
        ]
    )
    tags = builder.get_tags_by_modular_pipeline()
    assert tags["a"] == ["inner", "outer"]
    assert tags["a.b"] == ["inner"]


def test_modular_edges_connect_boundary_datasets() -> None:
    tree = _tree_builder([_node("ns.task", ["x"], ["y"], namespace="ns")]).build()
    edges: dict[tuple[str, str], GraphEdgeAPIResponse] = {}
    _add_modular_pipeline_boundary_edges(edges, tree)
    assert (_create_dataset_node_id("x"), "ns") in edges
    assert ("ns", _create_dataset_node_id("y")) in edges


def test_root_has_no_modular_edges() -> None:
    tree = _tree_builder([_node("task", ["x"], ["y"])]).build()
    edges: dict[tuple[str, str], GraphEdgeAPIResponse] = {}
    _add_modular_pipeline_boundary_edges(edges, tree)
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
    _add_modular_pipeline_boundary_edges(edges, tree)
    assert (a_id, "ns") in edges

    _remove_cyclic_modular_pipeline_boundary_edges(edges, tree)
    assert (a_id, "ns") not in edges
    assert ("ns", b_id) in edges


def test_acyclic_modular_edges_are_kept() -> None:
    tree = _tree_builder([_node("ns.task", ["x"], ["y"], namespace="ns")]).build()
    edges: dict[tuple[str, str], GraphEdgeAPIResponse] = {}
    _add_modular_pipeline_boundary_edges(edges, tree)
    before = set(edges)
    _remove_cyclic_modular_pipeline_boundary_edges(edges, tree)
    assert set(edges) == before


def test_dataset_owners_agree_with_the_tree_for_an_ancestor_boundary() -> None:
    """A dataset on an ancestor's boundary belongs to that ancestor too.

    ``mid`` is produced and consumed inside ``a.b``, and consumed outside ``a``. It is therefore
    a boundary output of both ``a.b`` and ``a``, and membership must say so — otherwise the
    dataset node disagrees with the folder it is drawn on.
    """
    nodes = [
        _node("a.b.make", ["x"], ["mid"], namespace="a.b"),
        _node("a.b.use", ["mid"], ["y"], namespace="a.b"),
        _node("outside", ["mid"], ["z"]),
    ]
    tree = _tree_builder(nodes).build()
    mid_id = _create_dataset_node_id("mid")

    assert mid_id in tree["a"].outputs
    assert mid_id in tree["a.b"].outputs
    assert _membership(nodes).get_modular_pipelines_for_dataset("mid") == ["a", "a.b"]


def test_transcoded_boundary_matches_legacy_set_algebra() -> None:
    """Transcoding is stripped only when removing intermediates, matching Kedro.

    ``shared@pandas1`` is produced inside and ``shared@pandas2`` consumed inside, so ``shared``
    is internal. The outside consumer reads ``shared@pandas3``, which does not match the
    produced name, so legacy does not treat it as a boundary output and neither do we.
    """
    nodes = [
        _node("ns.make", ["x"], ["shared@pandas1"], namespace="ns"),
        _node("ns.use", ["shared@pandas2"], ["y"], namespace="ns"),
        _node("outside", ["shared@pandas3"], ["z"]),
    ]
    tree = _tree_builder(nodes).build()
    assert _create_dataset_node_id("shared") not in tree["ns"].outputs


def test_for_dataset_accepts_a_transcoded_name() -> None:
    nodes = [_node("ns.task", ["ds@pandas"], ["y"], namespace="ns")]
    membership = _membership(nodes)
    assert (
        membership.get_modular_pipelines_for_dataset("ds@pandas")
        == membership.get_modular_pipelines_for_dataset("ds")
        == ["ns"]
    )


@pytest.mark.parametrize(
    "namespace",
    [ROOT_MODULAR_PIPELINE_ID, f"{ROOT_MODULAR_PIPELINE_ID}.nested"],
)
def test_namespace_using_reserved_root_is_rejected(namespace: str) -> None:
    node = _node(f"{namespace}.task", ["p"], ["q"], namespace=namespace)
    with pytest.raises(ValueError, match="Rename the namespace to render this project"):
        _tree_builder([node])


def test_modular_edges_are_emitted_in_a_stable_order() -> None:
    nodes = [_node("ns.task", ["b_in", "a_in"], ["b_out", "a_out"], namespace="ns")]
    tree = _tree_builder(nodes).build()
    edges: dict[tuple[str, str], GraphEdgeAPIResponse] = {}
    _add_modular_pipeline_boundary_edges(edges, tree)

    expected = [(input_id, "ns") for input_id in sorted(tree["ns"].inputs)]
    expected.extend(("ns", output_id) for output_id in sorted(tree["ns"].outputs))
    assert list(edges) == expected
