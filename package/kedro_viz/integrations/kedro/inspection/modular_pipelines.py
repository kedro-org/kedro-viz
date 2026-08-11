"""Build modular pipeline groups, tree, and boundary connections for Viz.

Public entry points:

* ``ModularPipelineIndex``: which modular pipelines each dataset belongs to, built once.
* ``ModularPipelineView``: per-pipeline tree, group nodes and edges, built per render.

Concepts:

* Namespace: a dotted node path whose prefixes form nested modular-pipeline groups.
* Boundary I/O: datasets that enter or leave a namespace subtree.
* Tree: the group hierarchy and its task, dataset and nested-group children.
* Boundary edges: links between group nodes and their input and output datasets.

Set algebra lives in ``modular_pipeline_algebra``.
"""

from __future__ import annotations

from collections import defaultdict
from collections.abc import Iterable
from dataclasses import dataclass, field
from typing import TYPE_CHECKING

from kedro_viz.api.rest.responses.pipelines import (
    DataNodeAPIResponse,
    GraphEdgeAPIResponse,
    ModularPipelineChildAPIResponse,
    ModularPipelinesTreeNodeAPIResponse,
    TaskNodeAPIResponse,
)
from kedro_viz.constants import ROOT_MODULAR_PIPELINE_ID
from kedro_viz.integrations.kedro.inspection.modular_pipeline_algebra import (
    _in_subtree,
    compute_namespace_boundaries,
)
from kedro_viz.integrations.kedro.node_ids import (
    _create_dataset_node_id,
    _create_task_node_id_from_node_snapshot,
)
from kedro_viz.models.flowchart.model_utils import GraphNodeType
from kedro_viz.utils import _strip_transcoding, is_dataset_param

if TYPE_CHECKING:
    from kedro.inspection.models import NodeSnapshot, PipelineSnapshot


class ModularPipelineIndex:
    """Look up which modular pipelines each dataset belongs to."""

    def __init__(
        self,
        *,
        modular_pipeline_ids: set[str],
        datasets_by_modular_pipeline: dict[str, set[str]],
    ) -> None:
        self._modular_pipeline_ids = modular_pipeline_ids
        self._datasets_by_modular_pipeline = datasets_by_modular_pipeline

    @classmethod
    def from_nodes(cls, nodes: list[NodeSnapshot]) -> ModularPipelineIndex:
        """Build an index for one pipeline's nodes."""
        boundaries = compute_namespace_boundaries(nodes)

        return cls(
            modular_pipeline_ids=boundaries.modular_pipeline_ids,
            datasets_by_modular_pipeline=boundaries.datasets_by_modular_pipeline,
        )

    @classmethod
    def from_registered_pipelines(
        cls, pipelines: Iterable[PipelineSnapshot]
    ) -> ModularPipelineIndex:
        """Combine assignments calculated independently for each registered pipeline."""
        modular_pipeline_ids: set[str] = set()
        datasets_by_modular_pipeline: dict[str, set[str]] = {}
        for pipeline in pipelines:
            boundaries = compute_namespace_boundaries(pipeline.nodes)
            modular_pipeline_ids.update(boundaries.modular_pipeline_ids)
            for mp_id, datasets in boundaries.datasets_by_modular_pipeline.items():
                datasets_by_modular_pipeline.setdefault(mp_id, set()).update(datasets)
        return cls(
            modular_pipeline_ids=modular_pipeline_ids,
            datasets_by_modular_pipeline=datasets_by_modular_pipeline,
        )

    def modular_pipelines_for_dataset(self, name: str) -> list[str] | None:
        """Return the sorted modular pipeline IDs this dataset belongs to, or ``None``.

        Parameters are not assigned to any modular pipeline. Transcoded names belong to the
        same modular pipelines as their base names.
        """
        if is_dataset_param(name):
            return None
        base_name = _strip_transcoding(name)
        modular_pipeline_ids = sorted(
            mp_id
            for mp_id in self._modular_pipeline_ids
            if base_name in self._datasets_by_modular_pipeline[mp_id]
        )
        return modular_pipeline_ids or None


@dataclass
class _ModularPipelineTreeEntry:
    """One node in the modular-pipeline tree.

    ``name`` and the modular-pipeline IDs are namespace strings; dataset and task IDs in
    ``inputs``, ``outputs`` and ``children`` are hashed graph IDs.
    """

    name: str
    inputs: set[str] = field(default_factory=set)
    outputs: set[str] = field(default_factory=set)
    children: set[tuple[str, str]] = field(default_factory=set)  # (node_id, node_type)


class _ModularPipelineTreeBuilder:
    """Build the modular-pipeline tree for the nodes of a single rendered pipeline."""

    def __init__(self, nodes: list[NodeSnapshot]) -> None:
        self._nodes = nodes
        # Resolved against this pipeline's nodes only: a node is a root child when it has no
        # modular pipeline assignment in this view, which can differ from project assignments.
        boundaries = compute_namespace_boundaries(nodes)
        self._boundary_io_by_modular_pipeline = (
            boundaries.boundary_io_by_modular_pipeline
        )
        self._index = ModularPipelineIndex(
            modular_pipeline_ids=boundaries.modular_pipeline_ids,
            datasets_by_modular_pipeline=boundaries.datasets_by_modular_pipeline,
        )
        self.ids = sorted(boundaries.modular_pipeline_ids)

    def build(self) -> dict[str, _ModularPipelineTreeEntry]:
        """Return the tree keyed by modular pipeline ID, including ``__root__``.

        Parameter references are tracked separately so they remain parameter children under
        ``__root__`` instead of being added as data children inside modular pipelines.
        """
        root = _ModularPipelineTreeEntry(ROOT_MODULAR_PIPELINE_ID)
        tree = {ROOT_MODULAR_PIPELINE_ID: root}
        params: set[str] = set()

        for mp_id in self.ids:
            self._populate_entry(tree, mp_id, params)

        self._add_root_children(root)
        return tree

    def _populate_entry(
        self,
        tree: dict[str, _ModularPipelineTreeEntry],
        mp_id: str,
        params: set[str],
    ) -> None:
        """Populate one entry, record its boundary parameters and link it to its parent."""
        entry = tree.setdefault(mp_id, _ModularPipelineTreeEntry(mp_id))
        free_inputs, free_outputs = self._boundary_io_by_modular_pipeline[mp_id]
        entry.inputs = {_create_dataset_node_id(d) for d in free_inputs}
        entry.outputs = {_create_dataset_node_id(d) for d in free_outputs}
        params.update(
            _create_dataset_node_id(d) for d in free_inputs if is_dataset_param(d)
        )
        boundary = entry.inputs | entry.outputs

        self._add_direct_children(entry, mp_id, boundary, params)
        self._link_to_parent(tree, mp_id, boundary, params)

    def get_tags_by_modular_pipeline(self) -> dict[str, list[str]]:
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
        self,
        entry: _ModularPipelineTreeEntry,
        mp_id: str,
        boundary: set[str],
        params: set[str],
    ) -> None:
        """Add direct task and internal dataset children to a modular pipeline."""
        for node in self._nodes:
            if node.namespace != mp_id:
                continue
            entry.children.add(
                (
                    _create_task_node_id_from_node_snapshot(node),
                    GraphNodeType.TASK.value,
                )
            )
            io_ids = {
                _create_dataset_node_id(io) for io in [*node.inputs, *node.outputs]
            }
            for io_id in io_ids - boundary - params:
                entry.children.add((io_id, GraphNodeType.DATA.value))

    def _link_to_parent(
        self,
        tree: dict[str, _ModularPipelineTreeEntry],
        mp_id: str,
        boundary: set[str],
        params: set[str],
    ) -> None:
        """Link a modular pipeline and its eligible boundary datasets to its parent."""
        parent_id = (
            mp_id.rsplit(".", 1)[0] if "." in mp_id else ROOT_MODULAR_PIPELINE_ID
        )
        parent = tree.setdefault(parent_id, _ModularPipelineTreeEntry(parent_id))
        parent.children.add((mp_id, GraphNodeType.MODULAR_PIPELINE.value))
        for dataset_id in boundary:
            if (
                dataset_id not in parent.inputs
                and dataset_id not in parent.outputs
                and dataset_id not in params
            ):
                parent.children.add((dataset_id, GraphNodeType.DATA.value))

    def _add_root_children(self, root: _ModularPipelineTreeEntry) -> None:
        """Add datasets not assigned to a modular pipeline and unnamespaced tasks to root."""
        for dataset in {
            _strip_transcoding(io)
            for node in self._nodes
            for io in [*node.inputs, *node.outputs]
        }:
            if self._index.modular_pipelines_for_dataset(dataset) is None:
                node_type = (
                    GraphNodeType.PARAMETERS.value
                    if is_dataset_param(dataset)
                    else GraphNodeType.DATA.value
                )
                root.children.add((_create_dataset_node_id(dataset), node_type))
        for node in self._nodes:
            if node.namespace is None:
                root.children.add(
                    (
                        _create_task_node_id_from_node_snapshot(node),
                        GraphNodeType.TASK.value,
                    )
                )


class ModularPipelineView:
    """Build modular pipeline rendering data for one selected pipeline.

    Built per render because the tree and boundary edges depend on the selected pipeline.
    """

    def __init__(self, nodes: list[NodeSnapshot]) -> None:
        """Prepare tree and boundary data for one pipeline view."""
        self._tree_builder = _ModularPipelineTreeBuilder(nodes)

    def extend_graph(
        self,
        graph_nodes: list[TaskNodeAPIResponse | DataNodeAPIResponse],
        edges: dict[tuple[str, str], GraphEdgeAPIResponse],
        selected_pipeline_id: str,
    ) -> dict[str, ModularPipelinesTreeNodeAPIResponse]:
        """Append group nodes, wire boundary edges and return the API tree.

        ``graph_nodes`` and ``edges`` are mutated in place.
        """
        tree = self._tree_builder.build()
        graph_nodes.extend(
            self._build_modular_pipeline_group_nodes(selected_pipeline_id)
        )
        _add_modular_pipeline_boundary_edges(edges, tree)
        _remove_cyclic_modular_pipeline_boundary_edges(edges, tree)
        return _build_modular_pipeline_tree_response(tree)

    def _build_modular_pipeline_group_nodes(
        self, selected_pipeline_id: str
    ) -> list[DataNodeAPIResponse]:
        """Build flowchart group nodes for each modular pipeline namespace.

        The API has no separate modular-pipeline node model, so group nodes use
        ``DataNodeAPIResponse`` with ``type="modularPipeline"``.
        """
        tags = self._tree_builder.get_tags_by_modular_pipeline()
        return [
            DataNodeAPIResponse(
                id=mp_id,
                name=mp_id,
                tags=tags[mp_id],
                pipelines=[selected_pipeline_id],
                type=GraphNodeType.MODULAR_PIPELINE.value,
                modular_pipelines=None,
                layer=None,
                dataset_type=None,
            )
            for mp_id in self._tree_builder.ids
        ]


def _add_modular_pipeline_boundary_edges(
    edges: dict[tuple[str, str], GraphEdgeAPIResponse],
    tree: dict[str, _ModularPipelineTreeEntry],
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


def _remove_cyclic_modular_pipeline_boundary_edges(
    edges: dict[tuple[str, str], GraphEdgeAPIResponse],
    tree: dict[str, _ModularPipelineTreeEntry],
) -> None:
    """Drop an ``input -> mp`` edge when its input is reachable downstream of ``mp``.

    For example, ``ns.inner`` consumes ``a`` and produces ``b``, while an outer task consumes
    ``b`` and produces ``a``. The path ``ns -> b -> outer -> a`` means retaining ``a -> ns``
    would create a cycle.
    """
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


def _build_modular_pipeline_tree_response(
    tree: dict[str, _ModularPipelineTreeEntry],
) -> dict[str, ModularPipelinesTreeNodeAPIResponse]:
    """Convert internal tree entries into deterministic API response models."""
    return {
        mp_id: ModularPipelinesTreeNodeAPIResponse(
            id=mp_id,
            name=entry.name,
            inputs=sorted(entry.inputs),
            outputs=sorted(entry.outputs),
            children=[
                ModularPipelineChildAPIResponse(id=child_id, type=child_type)
                for child_id, child_type in sorted(entry.children)
            ],
        )
        for mp_id, entry in tree.items()
    }
