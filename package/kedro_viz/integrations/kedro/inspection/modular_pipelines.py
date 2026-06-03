"""Modular-pipeline membership and tree for snapshot nodes (Phase 3a + 3b).

Reproduces the current backend's modular-pipeline rules from ``NodeSnapshot.namespace`` plus the
Kedro pipeline set-algebra, without live ``Pipeline`` objects.

``ModularMembership`` (3a) — each node's ``modular_pipelines`` field:
- a **task** belongs to its own (deepest) namespace only;
- a **dataset** belongs to every modular pipeline ``P`` where it is an I/O of one of ``P``'s *direct*
  nodes (``namespace == P``) or a boundary input/output of ``P``'s subtree. That dual rule is why
  ``prm_spine_table`` (internal to ``ingestion`` but consumed by ``feature_engineering``) belongs to
  both, while a model ``regressor`` belongs only to its sub-pipeline.

``ModularTreeBuilder`` (3b) — the expand/collapse tree (``modularPipeline`` nodes + children), with
per-modular-pipeline ``inputs``/``outputs`` from the set-algebra
(``inputs = consumed - produced``; ``outputs = (produced - consumed) | (rest_inputs & produced)``).
Modular graph edges + cycle removal remain a later step (Phase 3c).
"""

from __future__ import annotations

from collections import defaultdict
from dataclasses import dataclass, field
from typing import TYPE_CHECKING

from kedro_viz.api.rest.responses.pipelines import GraphEdgeAPIResponse
from kedro_viz.constants import ROOT_MODULAR_PIPELINE_ID
from kedro_viz.integrations.kedro import node_ids
from kedro_viz.models.flowchart.model_utils import GraphNodeType
from kedro_viz.utils import _strip_transcoding, is_dataset_param

if TYPE_CHECKING:
    from kedro.inspection.models import NodeSnapshot


def _ancestor_namespaces(namespace: str) -> list[str]:
    """``"a.b.c"`` -> ``["a", "a.b", "a.b.c"]``."""
    parts = namespace.split(".")
    return [".".join(parts[: i + 1]) for i in range(len(parts))]


class ModularMembership:
    """Resolve modular-pipeline membership for a set of nodes."""

    def __init__(self, nodes: list[NodeSnapshot]):
        self._ids: set[str] = set()
        for node in nodes:
            if node.namespace:
                self._ids.update(_ancestor_namespaces(node.namespace))

        # Datasets that belong to each modular pipeline: I/O of its direct nodes, plus the boundary
        # inputs/outputs of its whole subtree (transcoding stripped).
        self._member_datasets: dict[str, set[str]] = {}
        for mp_id in self._ids:
            direct = {
                _strip_transcoding(io)
                for node in nodes
                if node.namespace == mp_id
                for io in [*node.inputs, *node.outputs]
            }
            subtree = [node for node in nodes if _in_subtree(node, mp_id)]
            produced = {_strip_transcoding(o) for node in subtree for o in node.outputs}
            consumed = {_strip_transcoding(i) for node in subtree for i in node.inputs}
            boundary = (consumed - produced) | (produced - consumed)
            self._member_datasets[mp_id] = direct | boundary

    def for_task(self, node: NodeSnapshot) -> list[str] | None:
        """A task belongs only to its own namespace."""
        return [node.namespace] if node.namespace else None

    def for_dataset(self, dataset_name: str) -> list[str] | None:
        """A dataset belongs to every modular pipeline that owns it (see module docstring)."""
        if is_dataset_param(dataset_name):
            return None
        owners = sorted(
            mp_id for mp_id in self._ids if dataset_name in self._member_datasets[mp_id]
        )
        return owners or None


@dataclass
class ModularTreeEntry:
    """One node in the modular-pipeline tree (IDs are hashed graph IDs)."""

    name: str
    inputs: set[str] = field(default_factory=set)
    outputs: set[str] = field(default_factory=set)
    children: set[tuple[str, str]] = field(default_factory=set)  # (node_id, node_type)


class ModularTreeBuilder:
    """Build the modular-pipeline tree for the nodes of a single rendered pipeline."""

    def __init__(self, nodes: list[NodeSnapshot]):
        self._nodes = nodes
        # Root membership is resolved against this pipeline's nodes (a node is a root child when it
        # has no modular owner *in this pipeline*, which can differ from its global membership).
        self._membership = ModularMembership(nodes)
        self.ids: list[str] = sorted(
            {
                mp
                for node in nodes
                if node.namespace
                for mp in _ancestor_namespaces(node.namespace)
            }
        )

    def build(self) -> dict[str, ModularTreeEntry]:
        """Return the tree keyed by modular pipeline id, including ``__root__``."""
        tree = {ROOT_MODULAR_PIPELINE_ID: ModularTreeEntry(ROOT_MODULAR_PIPELINE_ID)}
        params: set[str] = set()

        for mp_id in self.ids:
            entry = tree.setdefault(mp_id, ModularTreeEntry(mp_id))
            free_inputs, free_outputs = self._free_io(mp_id)
            entry.inputs = {node_ids.dataset_node_id(d) for d in free_inputs}
            entry.outputs = {node_ids.dataset_node_id(d) for d in free_outputs}
            params |= {
                node_ids.dataset_node_id(d) for d in free_inputs if is_dataset_param(d)
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

    # -- internals -------------------------------------------------------------------- #
    def _free_io(self, mp_id: str) -> tuple[set[str], set[str]]:
        sub = [node for node in self._nodes if _in_subtree(node, mp_id)]
        sub_names = {node.name for node in sub}
        rest = [node for node in self._nodes if node.name not in sub_names]

        produced = {_strip_transcoding(o) for node in sub for o in node.outputs}
        consumed = {_strip_transcoding(i) for node in sub for i in node.inputs}
        produced_rest = {_strip_transcoding(o) for node in rest for o in node.outputs}
        consumed_rest = {_strip_transcoding(i) for node in rest for i in node.inputs}

        free_inputs = consumed - produced
        free_outputs = (produced - consumed) | (
            (consumed_rest - produced_rest) & produced
        )
        return free_inputs, free_outputs

    def _add_direct_children(
        self, entry: ModularTreeEntry, mp_id: str, boundary: set[str], params: set[str]
    ) -> None:
        for node in self._nodes:
            if node.namespace != mp_id:
                continue
            entry.children.add(
                (
                    node_ids.task_node_id(node.name, node.inputs, node.outputs),
                    GraphNodeType.TASK.value,
                )
            )
            io_ids = {
                node_ids.dataset_node_id(io) for io in [*node.inputs, *node.outputs]
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
                root.children.add((node_ids.dataset_node_id(dataset), node_type))
        for node in self._nodes:
            if node.namespace is None:
                root.children.add(
                    (
                        node_ids.task_node_id_for(node),
                        GraphNodeType.TASK.value,
                    )
                )


def _in_subtree(node: NodeSnapshot, mp_id: str) -> bool:
    """Whether a node lives in modular pipeline ``mp_id`` or any of its descendants."""
    namespace = node.namespace
    if namespace is None:
        return False
    return namespace == mp_id or namespace.startswith(f"{mp_id}.")


# -- modular graph edges (Phase 3c) ---------------------------------------------------------- #


def add_modular_edges(
    edges: dict[tuple[str, str], GraphEdgeAPIResponse],
    tree: dict[str, ModularTreeEntry],
) -> None:
    """Connect each modular pipeline to its boundary datasets (input -> mp, mp -> output)."""
    for mp_id, entry in tree.items():
        if mp_id == ROOT_MODULAR_PIPELINE_ID:
            continue
        for input_id in entry.inputs:
            edges.setdefault(
                (input_id, mp_id),
                GraphEdgeAPIResponse(source=input_id, target=mp_id),
            )
        for output_id in entry.outputs:
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
        for input_id in entry.inputs & reachable:
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
