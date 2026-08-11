"""Add modular-pipeline group nodes and boundary edges to one pipeline view."""

from __future__ import annotations

from collections import defaultdict
from typing import TYPE_CHECKING

from kedro_viz.api.rest.responses.pipelines import (
    DataNodeAPIResponse,
    GraphEdgeAPIResponse,
    ModularPipelinesTreeNodeAPIResponse,
    TaskNodeAPIResponse,
)
from kedro_viz.constants import ROOT_MODULAR_PIPELINE_ID
from kedro_viz.models.flowchart.model_utils import GraphNodeType

from .tree import (
    _build_modular_pipeline_tree_response,
    _ModularPipelineTreeBuilder,
    _ModularPipelineTreeEntry,
)

if TYPE_CHECKING:
    from kedro.inspection.models import NodeSnapshot


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
