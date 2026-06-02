"""Build a Kedro-Viz ``GraphAPIResponse`` from an inspection snapshot.

Produces the full graph — task, data and parameter nodes; the edges between them, including
modular-pipeline edges; the global tag and pipeline lists; per-node pipeline and
modular-pipeline membership; data-node tags; the modular-pipeline tree (``modularPipeline``
nodes + children); and per-node ``layer`` assignment with the global ``layers`` list (the layer
mapping is passed in by the caller because the snapshot itself doesn't expose viz metadata).

All node IDs come from :mod:`kedro_viz.integrations.kedro.node_ids`.

Live-only fields not carried by the snapshot — ``node_extras`` stats/styles, resolved task
``parameters`` values — are populated by the metadata bridge in
:mod:`kedro_viz.api.inspection_adapter_provider`, not here.
"""

from __future__ import annotations

import re
from collections import defaultdict
from dataclasses import dataclass
from typing import TYPE_CHECKING, cast

from kedro_viz.api.rest.responses.pipelines import (
    DataNodeAPIResponse,
    GraphAPIResponse,
    GraphEdgeAPIResponse,
    ModularPipelineChildAPIResponse,
    ModularPipelinesTreeNodeAPIResponse,
    NamedEntityAPIResponse,
    TaskNodeAPIResponse,
)
from kedro_viz.constants import (
    DEFAULT_REGISTERED_PIPELINE_ID,
    ROOT_MODULAR_PIPELINE_ID,
)
from kedro_viz.integrations.kedro import node_ids
from kedro_viz.integrations.kedro.inspection.modular_pipelines import (
    ModularMembership,
    ModularTreeBuilder,
    ModularTreeEntry,
)
from kedro_viz.models.flowchart.model_utils import GraphNodeType
from kedro_viz.services.layers import sort_layers
from kedro_viz.utils import _strip_transcoding, is_dataset_param

if TYPE_CHECKING:
    from kedro.inspection.models import NodeSnapshot, ProjectSnapshot

    from kedro_viz.models.flowchart.nodes import GraphNode

_AUTO_NAME_RE = re.compile(r"^(?P<func>.+)__[0-9a-f]{8}$")


@dataclass(frozen=True)
class _LayerNode:
    """Minimal stand-in carrying just ``.layer`` for the layer sorter."""

    layer: str


class GraphBuilder:
    """Build ``GraphAPIResponse`` objects for a project snapshot.

    Pipeline membership, modular-pipeline membership and the tag list are global (across every
    registered pipeline), matching the current backend; only the rendered nodes/edges are scoped to
    the selected pipeline.
    """

    def __init__(
        self, snapshot: ProjectSnapshot, layer_mapping: dict[str, str] | None = None
    ):
        self._snapshot = snapshot
        self._layers = layer_mapping or {}
        self._pipelines = {pipeline.name: pipeline for pipeline in snapshot.pipelines}
        self._task_pipelines: dict[str, set[str]] = defaultdict(set)
        self._dataset_pipelines: dict[str, set[str]] = defaultdict(set)
        self._compute_membership()
        # Modular-pipeline membership is global: a node carries the same membership in every view,
        # so it is computed once over all pipelines' nodes (deduplicated by name).
        unique_nodes = {
            node.name: node
            for pipeline in snapshot.pipelines
            for node in pipeline.nodes
        }
        self._modular = ModularMembership(list(unique_nodes.values()))
        # Tags are global and invariant across pipeline views, so build them once.
        self._tags = self._build_tags()
        # Layer presence is global (every project layer can appear in any view); only the ordering is
        # per-pipeline. Mirror the live backend by seeding the layer sort with all layered datasets.
        self._global_layer_nodes: dict[str, _LayerNode] = {
            node_ids.dataset_node_id(name): _LayerNode(layer)
            for name, layer in self._layers.items()
            if name in self._dataset_pipelines
        }

    def _compute_membership(self) -> None:
        """Record, for every task and dataset, which registered pipelines contain it."""
        for pipeline_id, pipeline in self._pipelines.items():
            for node in pipeline.nodes:
                task_id = node_ids.task_node_id(node.name, node.inputs, node.outputs)
                self._task_pipelines[task_id].add(pipeline_id)
                for io in [*node.inputs, *node.outputs]:
                    self._dataset_pipelines[_strip_transcoding(io)].add(pipeline_id)

    def default_pipeline_id(self) -> str:
        """Return ``__default__`` if present, else the first registered pipeline."""
        if DEFAULT_REGISTERED_PIPELINE_ID in self._pipelines:
            return DEFAULT_REGISTERED_PIPELINE_ID
        return next(iter(self._pipelines))

    def has_pipeline(self, pipeline_id: str) -> bool:
        """Whether ``pipeline_id`` is a registered pipeline in this snapshot view."""
        return pipeline_id in self._pipelines

    def pipeline_ids(self) -> list[str]:
        """Registered pipeline IDs in this snapshot view (preserves declaration order)."""
        return list(self._pipelines)

    def build(self, pipeline_id: str | None = None) -> GraphAPIResponse:
        """Build the graph response for ``pipeline_id`` (default pipeline when ``None``)."""
        selected = pipeline_id or self.default_pipeline_id()
        pipeline = self._pipelines[selected]

        nodes: list[TaskNodeAPIResponse | DataNodeAPIResponse] = []
        edges: dict[tuple[str, str], GraphEdgeAPIResponse] = {}
        datasets: dict[
            str, str
        ] = {}  # stripped name -> an original (maybe transcoded) name
        dataset_tags: dict[str, set[str]] = defaultdict(set)

        for node in pipeline.nodes:
            task_id = node_ids.task_node_id(node.name, node.inputs, node.outputs)
            nodes.append(self._build_task_node(node, task_id))
            for name in node.inputs:
                self._add_edge(edges, node_ids.dataset_node_id(name), task_id)
                self._register_dataset(name, node, datasets, dataset_tags)
            for name in node.outputs:
                self._add_edge(edges, task_id, node_ids.dataset_node_id(name))
                self._register_dataset(name, node, datasets, dataset_tags)

        for stripped_name, original_name in datasets.items():
            nodes.append(
                self._build_dataset_node(
                    stripped_name,
                    original_name,
                    sorted(dataset_tags[stripped_name]),
                )
            )

        tree_builder = ModularTreeBuilder(pipeline.nodes)
        tree = tree_builder.build()
        nodes.extend(self._build_modular_pipeline_nodes(tree_builder, selected))
        self._add_modular_edges(edges, tree)
        self._remove_cyclic_modular_edges(edges, tree)

        return GraphAPIResponse(
            nodes=nodes,
            edges=list(edges.values()),
            layers=self._sorted_layers(nodes, edges),
            tags=self._tags,
            pipelines=[
                NamedEntityAPIResponse(id=pid, name=pid) for pid in self._pipelines
            ],
            modular_pipelines=_to_tree_response(tree),
            selected_pipeline=selected,
        )

    # -- node builders ---------------------------------------------------------------- #
    def _build_task_node(self, node: NodeSnapshot, task_id: str) -> TaskNodeAPIResponse:
        return TaskNodeAPIResponse(
            id=task_id,
            name=_display_name(node.name, node.namespace),
            full_name=node.name,
            tags=sorted(node.tags),
            pipelines=sorted(self._task_pipelines[task_id]),
            type=GraphNodeType.TASK.value,
            modular_pipelines=self._modular.for_task(node),
            parameters={},
        )

    def _build_dataset_node(
        self,
        stripped_name: str,
        original_name: str,
        tags: list[str],
    ) -> DataNodeAPIResponse:
        is_parameter = is_dataset_param(stripped_name)
        dataset = self._snapshot.datasets.get(
            original_name
        ) or self._snapshot.datasets.get(stripped_name)
        return DataNodeAPIResponse(
            id=node_ids.dataset_node_id(stripped_name),
            name=stripped_name,
            tags=tags,
            pipelines=sorted(self._dataset_pipelines[stripped_name]),
            type=(
                GraphNodeType.PARAMETERS.value
                if is_parameter
                else GraphNodeType.DATA.value
            ),
            modular_pipelines=self._modular.for_dataset(stripped_name),
            layer=None if is_parameter else self._layers.get(stripped_name),
            dataset_type=None if is_parameter or dataset is None else dataset.type,
        )

    def _build_tags(self) -> list[NamedEntityAPIResponse]:
        tags = {
            tag
            for pipeline in self._pipelines.values()
            for node in pipeline.nodes
            for tag in node.tags
        }
        return [NamedEntityAPIResponse(id=tag, name=tag) for tag in sorted(tags)]

    @staticmethod
    def _build_modular_pipeline_nodes(
        tree_builder: ModularTreeBuilder, selected: str
    ) -> list[DataNodeAPIResponse]:
        tags = tree_builder.modular_node_tags()
        return [
            DataNodeAPIResponse(
                id=mp_id,
                name=mp_id,
                tags=tags[mp_id],
                pipelines=[selected],
                type=GraphNodeType.MODULAR_PIPELINE.value,
                modular_pipelines=None,
                layer=None,
                dataset_type=None,
            )
            for mp_id in tree_builder.ids
        ]

    def _sorted_layers(
        self,
        nodes: list[TaskNodeAPIResponse | DataNodeAPIResponse],
        edges: dict[tuple[str, str], GraphEdgeAPIResponse],
    ) -> list[str]:
        """Topologically sort the data-node layers, reusing the existing layers service."""
        if not self._layers:
            return []
        dependencies: dict[str, set[str]] = defaultdict(set)
        for source, target in edges:
            dependencies[source].add(target)
        # Global layered datasets give layer *presence*; this view's nodes give the *ordering*.
        nodes_by_id: dict[str, object] = dict(self._global_layer_nodes)
        nodes_by_id.update({node.id: node for node in nodes})
        # ``sort_layers`` only reads ``.layer`` off each node, so these stand in for the domain
        # ``GraphNode`` it is typed against.
        return sort_layers(cast("dict[str, GraphNode]", nodes_by_id), dependencies)

    @staticmethod
    def _add_modular_edges(
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

    @staticmethod
    def _remove_cyclic_modular_edges(
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

    @staticmethod
    def _register_dataset(
        name: str,
        node: NodeSnapshot,
        datasets: dict[str, str],
        dataset_tags: dict[str, set[str]],
    ) -> None:
        stripped = _strip_transcoding(name)
        datasets.setdefault(stripped, name)
        dataset_tags[stripped].update(node.tags)

    @staticmethod
    def _add_edge(
        edges: dict[tuple[str, str], GraphEdgeAPIResponse], source: str, target: str
    ) -> None:
        edges.setdefault(
            (source, target), GraphEdgeAPIResponse(source=source, target=target)
        )


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


def _to_tree_response(
    tree: dict[str, ModularTreeEntry],
) -> dict[str, ModularPipelinesTreeNodeAPIResponse]:
    """Convert internal tree entries into the API tree response."""
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


def _display_name(snapshot_name: str, namespace: str | None) -> str:
    """Derive the UI display name: strip the namespace and any auto-name ``__<hash>`` suffix."""
    local = snapshot_name
    prefix = f"{namespace}."
    if namespace and local.startswith(prefix):
        local = local[len(prefix) :]
    auto = _AUTO_NAME_RE.match(local)
    return auto.group("func") if auto else local
