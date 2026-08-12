"""Hermetic tests for the modular-pipeline tree."""

from typing import TYPE_CHECKING, cast

import pytest

from kedro_viz.constants import ROOT_MODULAR_PIPELINE_ID
from kedro_viz.integrations.kedro.node_ids import (
    _create_dataset_node_id,
    _create_task_node_id_from_node_snapshot,
)

if TYPE_CHECKING:
    from kedro.inspection.models import NodeSnapshot


def test_tree_ids_include_every_ancestor_namespace(_node, _tree_builder) -> None:
    builder = _tree_builder([_node("a.b.task", ["x"], ["y"], namespace="a.b")])
    assert builder.ids == ["a", "a.b"]


def test_tree_exposes_free_inputs_and_outputs(_node, _tree_builder) -> None:
    """``x`` is consumed but not produced inside ``ns``; ``y`` is produced but not consumed."""
    tree = _tree_builder([_node("ns.task", ["x"], ["y"], namespace="ns")]).build()
    assert tree["ns"].inputs == {_create_dataset_node_id("x")}
    assert tree["ns"].outputs == {_create_dataset_node_id("y")}


def test_internal_dataset_is_not_a_boundary(_node, _tree_builder) -> None:
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


def test_nested_pipeline_is_a_child_of_its_parent(_node, _tree_builder) -> None:
    tree = _tree_builder([_node("a.b.task", ["x"], ["y"], namespace="a.b")]).build()
    assert ("a.b", "modularPipeline") in tree["a"].children
    assert ("a", "modularPipeline") in tree[ROOT_MODULAR_PIPELINE_ID].children


def test_root_holds_nodes_without_a_namespace(_node, _tree_builder) -> None:
    node = _node("task", ["x"], ["y"])
    tree = _tree_builder([node]).build()
    assert tree[ROOT_MODULAR_PIPELINE_ID].children == {
        (_create_task_node_id_from_node_snapshot(cast("NodeSnapshot", node)), "task"),
        (_create_dataset_node_id("x"), "data"),
        (_create_dataset_node_id("y"), "data"),
    }


def test_tree_without_namespaces_has_only_root(_node, _tree_builder) -> None:
    tree = _tree_builder([_node("task", ["x"], ["y"])]).build()
    assert set(tree) == {ROOT_MODULAR_PIPELINE_ID}


def test_source_and_sink_nodes_are_modular_pipeline_children(
    _node, _tree_builder
) -> None:
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


def test_modular_node_tags_union_the_whole_subtree(_node, _tree_builder) -> None:
    builder = _tree_builder(
        [
            _node("a.one", ["x"], ["y"], namespace="a", tags={"outer"}),
            _node("a.b.two", ["y"], ["z"], namespace="a.b", tags={"inner"}),
        ]
    )
    tags = builder.get_tags_by_modular_pipeline()
    assert tags["a"] == ["inner", "outer"]
    assert tags["a.b"] == ["inner"]


def test_dataset_modular_pipelines_agree_with_the_tree_for_ancestor_boundary(
    _node, _tree_builder, _modular_pipeline_index
) -> None:
    """A dataset on an ancestor's boundary belongs to that ancestor too.

    ``mid`` is produced and consumed inside ``a.b``, and consumed outside ``a``. It is therefore
    a boundary output of both ``a.b`` and ``a``, and the index must report both modular
    pipelines — otherwise the dataset node disagrees with the folder it is drawn on.
    """
    nodes = [
        _node("a.b.make", ["x"], ["mid"], namespace="a.b"),
        _node("a.b.use", ["mid"], ["y"], namespace="a.b"),
        _node("outside", ["mid"], ["z"]),
    ]
    tree = _tree_builder(nodes).build()
    mid_id = _create_dataset_node_id("mid")
    index = _modular_pipeline_index(nodes)

    assert mid_id in tree["a"].outputs
    assert mid_id in tree["a.b"].outputs
    assert index.modular_pipelines_for_dataset("mid") == ["a", "a.b"]


@pytest.mark.parametrize(
    "namespace",
    [ROOT_MODULAR_PIPELINE_ID, f"{ROOT_MODULAR_PIPELINE_ID}.nested"],
)
def test_namespace_using_reserved_root_is_rejected(
    namespace: str, _node, _tree_builder
) -> None:
    node = _node(f"{namespace}.task", ["p"], ["q"], namespace=namespace)
    with pytest.raises(ValueError, match="Rename the namespace to render this project"):
        _tree_builder([node])
