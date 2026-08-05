"""Modular-pipeline membership, tree and edges for snapshot nodes.

Derives modular pipelines from ``NodeSnapshot.namespace`` and the Kedro pipeline set-algebra,
without live ``Pipeline`` objects.

- ``ModularMembership`` — the modular pipelines each node belongs to: a task belongs to its own
  (deepest) namespace; a dataset belongs to every modular pipeline it is an I/O of, directly or at
  a subtree boundary.
- ``ModularTreeBuilder`` — the expand/collapse tree (``modularPipeline`` nodes + children) with
  per-pipeline ``inputs``/``outputs`` (``inputs = consumed - produced``;
  ``outputs = (produced - consumed) | (rest_inputs & produced)``).
- ``add_modular_edges`` / ``remove_cyclic_modular_edges`` — connect each modular pipeline to its
  boundary datasets, then drop any edge that would form a cycle.
"""

from __future__ import annotations

from collections import defaultdict
from dataclasses import dataclass, field
from typing import TYPE_CHECKING

from kedro_viz.api.rest.responses.pipelines import GraphEdgeAPIResponse
from kedro_viz.constants import ROOT_MODULAR_PIPELINE_ID
from kedro_viz.integrations.kedro.node_ids import (
    _create_dataset_node_id,
    _create_task_node_id,
)
from kedro_viz.models.flowchart.model_utils import GraphNodeType
from kedro_viz.utils import _strip_transcoding, is_dataset_param

if TYPE_CHECKING:
    from kedro.inspection.models import NodeSnapshot


def _ancestor_namespaces(namespace: str) -> list[str]:
    """``"a.b.c"`` -> ``["a", "a.b", "a.b.c"]``."""
    parts = namespace.split(".")
    return [".".join(parts[: i + 1]) for i in range(len(parts))]


def _modular_pipeline_ids(nodes: list[NodeSnapshot]) -> set[str]:
    """Every modular pipeline the nodes belong to, including ancestors.

    A namespace literally called ``__root__`` is ignored: that ID is reserved for the synthetic
    root entry, and the legacy backend does not emit a modular pipeline for it either.
    """
    return {
        mp_id
        for node in nodes
        if node.namespace
        for mp_id in _ancestor_namespaces(node.namespace)
        if mp_id != ROOT_MODULAR_PIPELINE_ID
    }


def _task_node_id(node: NodeSnapshot) -> str:
    """Graph ID for a snapshot task node."""
    return _create_task_node_id(
        node_name=node.name,
        func_name=node.func_name,
        namespace=node.namespace,
        inputs=node.inputs,
        outputs=node.outputs,
    )


def _remove_intermediates(
    datasets: set[str], all_inputs: set[str], all_outputs: set[str]
) -> set[str]:
    """Drop datasets both produced and consumed within the same node set.

    Mirrors ``Pipeline._remove_intermediates``: transcoding is stripped only to decide what
    counts as intermediate, and the surviving names are returned in their original
    (possibly transcoded) form so later set operations compare like for like.
    """
    intermediate = {_strip_transcoding(i) for i in all_inputs} & {
        _strip_transcoding(o) for o in all_outputs
    }
    return {d for d in datasets if _strip_transcoding(d) not in intermediate}


def _free_io(nodes: list[NodeSnapshot], mp_id: str) -> tuple[set[str], set[str]]:
    """Boundary inputs and outputs of a namespace subtree, in original dataset names.

    Mirrors the legacy backend's Kedro set algebra::

        free_inputs  = sub.inputs()
        free_outputs = sub.outputs() | (rest.inputs() & sub.all_outputs())
    """
    sub: list[NodeSnapshot] = []
    rest: list[NodeSnapshot] = []
    for node in nodes:
        (sub if _in_subtree(node, mp_id) else rest).append(node)

    sub_inputs = {i for node in sub for i in node.inputs}
    sub_outputs = {o for node in sub for o in node.outputs}
    rest_inputs = {i for node in rest for i in node.inputs}
    rest_outputs = {o for node in rest for o in node.outputs}

    free_inputs = _remove_intermediates(sub_inputs, sub_inputs, sub_outputs)
    free_outputs = _remove_intermediates(sub_outputs, sub_inputs, sub_outputs) | (
        _remove_intermediates(rest_inputs, rest_inputs, rest_outputs) & sub_outputs
    )
    return free_inputs, free_outputs


class ModularMembership:
    """Resolve the modular pipelines a set of nodes belongs to."""

    def __init__(self, nodes: list[NodeSnapshot]) -> None:
        self._ids = _modular_pipeline_ids(nodes)

        # Datasets that belong to each modular pipeline: I/O of its direct nodes, plus the
        # boundary of its whole subtree. The boundary comes from the same calculation the tree
        # uses, so a dataset's membership always agrees with the folder it is drawn on.
        self._member_datasets: dict[str, set[str]] = {}
        for mp_id in self._ids:
            direct = {
                _strip_transcoding(io)
                for node in nodes
                if node.namespace == mp_id
                for io in [*node.inputs, *node.outputs]
            }
            free_inputs, free_outputs = _free_io(nodes, mp_id)
            boundary = {_strip_transcoding(d) for d in free_inputs | free_outputs}
            self._member_datasets[mp_id] = direct | boundary

    def for_task(self, node: NodeSnapshot) -> list[str] | None:
        """A task belongs only to its own namespace."""
        return [node.namespace] if node.namespace else None

    def for_dataset(self, dataset_name: str) -> list[str] | None:
        """A dataset belongs to every modular pipeline that owns it (see module docstring)."""
        if is_dataset_param(dataset_name):
            return None
        stripped = _strip_transcoding(dataset_name)
        owners = sorted(
            mp_id for mp_id in self._ids if stripped in self._member_datasets[mp_id]
        )
        return owners or None


@dataclass
class ModularTreeEntry:
    """One node in the modular-pipeline tree.

    ``name`` and the modular-pipeline IDs are namespace strings; dataset and task IDs in
    ``inputs``, ``outputs`` and ``children`` are hashed graph IDs.
    """

    name: str
    inputs: set[str] = field(default_factory=set)
    outputs: set[str] = field(default_factory=set)
    children: set[tuple[str, str]] = field(default_factory=set)  # (node_id, node_type)


class ModularTreeBuilder:
    """Build the modular-pipeline tree for the nodes of a single rendered pipeline."""

    def __init__(self, nodes: list[NodeSnapshot]) -> None:
        self._nodes = nodes
        # Root membership is resolved against this pipeline's nodes (a node is a root child when it
        # has no modular owner *in this pipeline*, which can differ from its global membership).
        self._membership = ModularMembership(nodes)
        self.ids: list[str] = sorted(_modular_pipeline_ids(nodes))

    def build(self) -> dict[str, ModularTreeEntry]:
        """Return the tree keyed by modular pipeline id, including ``__root__``."""
        tree = {ROOT_MODULAR_PIPELINE_ID: ModularTreeEntry(ROOT_MODULAR_PIPELINE_ID)}
        params: set[str] = set()

        for mp_id in self.ids:
            entry = tree.setdefault(mp_id, ModularTreeEntry(mp_id))
            free_inputs, free_outputs = _free_io(self._nodes, mp_id)
            entry.inputs = {_create_dataset_node_id(d) for d in free_inputs}
            entry.outputs = {_create_dataset_node_id(d) for d in free_outputs}
            params |= {
                _create_dataset_node_id(d) for d in free_inputs if is_dataset_param(d)
            }
            boundary = entry.inputs | entry.outputs

            self._add_direct_children(entry, mp_id, boundary, params)
            self._link_to_parent(tree, mp_id, boundary, params)

        self._add_root_children(tree[ROOT_MODULAR_PIPELINE_ID])
        return tree

    def modular_node_tags(self) -> dict[str, list[str]]:
        """Tags for each modular-pipeline node = the union of its whole subtree's tags."""
        return {
            mp_id: sorted(
                {
                    tag
                    for node in self._nodes
                    if _in_subtree(node, mp_id)
                    for tag in node.tags
                }
            )
            for mp_id in self.ids
        }

    def _add_direct_children(
        self, entry: ModularTreeEntry, mp_id: str, boundary: set[str], params: set[str]
    ) -> None:
        for node in self._nodes:
            if node.namespace != mp_id:
                continue
            entry.children.add((_task_node_id(node), GraphNodeType.TASK.value))
            io_ids = {
                _create_dataset_node_id(io) for io in [*node.inputs, *node.outputs]
            }
            for io_id in io_ids - boundary - params:
                entry.children.add((io_id, GraphNodeType.DATA.value))

    def _link_to_parent(
        self,
        tree: dict[str, ModularTreeEntry],
        mp_id: str,
        boundary: set[str],
        params: set[str],
    ) -> None:
        parent_id = (
            mp_id.rsplit(".", 1)[0] if "." in mp_id else ROOT_MODULAR_PIPELINE_ID
        )
        parent = tree.setdefault(parent_id, ModularTreeEntry(parent_id))
        parent.children.add((mp_id, GraphNodeType.MODULAR_PIPELINE.value))
        for dataset_id in boundary:
            if (
                dataset_id not in parent.inputs
                and dataset_id not in parent.outputs
                and dataset_id not in params
            ):
                parent.children.add((dataset_id, GraphNodeType.DATA.value))

    def _add_root_children(self, root: ModularTreeEntry) -> None:
        for dataset in {
            _strip_transcoding(io)
            for node in self._nodes
            for io in [*node.inputs, *node.outputs]
        }:
            if self._membership.for_dataset(dataset) is None:
                node_type = (
                    GraphNodeType.PARAMETERS.value
                    if is_dataset_param(dataset)
                    else GraphNodeType.DATA.value
                )
                root.children.add((_create_dataset_node_id(dataset), node_type))
        for node in self._nodes:
            if node.namespace is None:
                root.children.add((_task_node_id(node), GraphNodeType.TASK.value))


def _in_subtree(node: NodeSnapshot, mp_id: str) -> bool:
    """Whether a node lives in modular pipeline ``mp_id`` or any of its descendants."""
    namespace = node.namespace
    if namespace is None:
        return False
    return namespace == mp_id or namespace.startswith(f"{mp_id}.")


def add_modular_edges(
    edges: dict[tuple[str, str], GraphEdgeAPIResponse],
    tree: dict[str, ModularTreeEntry],
) -> None:
    """Connect each modular pipeline to its boundary datasets (input -> mp, mp -> output)."""
    for mp_id, entry in tree.items():
        if mp_id == ROOT_MODULAR_PIPELINE_ID:
            continue
        for input_id in sorted(entry.inputs):
            edges.setdefault(
                (input_id, mp_id),
                GraphEdgeAPIResponse(source=input_id, target=mp_id),
            )
        for output_id in sorted(entry.outputs):
            edges.setdefault(
                (mp_id, output_id),
                GraphEdgeAPIResponse(source=mp_id, target=output_id),
            )


def remove_cyclic_modular_edges(
    edges: dict[tuple[str, str], GraphEdgeAPIResponse],
    tree: dict[str, ModularTreeEntry],
) -> None:
    """Drop any ``input -> mp`` edge whose input is also reachable *from* the mp (a cycle)."""
    adjacency: dict[str, set[str]] = defaultdict(set)
    for source, target in edges:
        adjacency[source].add(target)
    for mp_id, entry in tree.items():
        if mp_id == ROOT_MODULAR_PIPELINE_ID:
            continue
        reachable = _reachable_from(mp_id, adjacency)
        for input_id in sorted(entry.inputs & reachable):
            edges.pop((input_id, mp_id), None)
            adjacency[input_id].discard(mp_id)


def _reachable_from(start: str, adjacency: dict[str, set[str]]) -> set[str]:
    """Return all nodes reachable from ``start`` (excluding ``start`` unless it is in a cycle)."""
    seen: set[str] = set()
    stack = list(adjacency.get(start, ()))
    while stack:
        node = stack.pop()
        if node in seen:
            continue
        seen.add(node)
        stack.extend(adjacency.get(node, ()))
    return seen
