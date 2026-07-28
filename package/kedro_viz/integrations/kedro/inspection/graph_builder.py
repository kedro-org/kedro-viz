"""Build a Kedro-Viz ``GraphAPIResponse`` from an inspection snapshot.

Produces the full graph: task, data and parameter nodes; the edges between them (including
modular-pipeline edges); the tag and pipeline lists; per-node pipeline and modular-pipeline
membership; data-node tags; the modular-pipeline tree; and per-node ``layer`` with the global
``layers`` list (layers are read from the catalog config, which the snapshot omits).

Node IDs come from :mod:`kedro_viz.integrations.kedro.node_ids`. Live-only fields (``node_extras``,
resolved task ``parameters``, resolved ``dataset_type`` class paths) are added by the metadata
bridge in :mod:`kedro_viz.api.inspection_adapter_provider`, not here — the snapshot only carries
the raw catalog ``type`` string (e.g. ``pandas.CSVDataset``).
"""

from __future__ import annotations

import re
from collections import defaultdict
from typing import TYPE_CHECKING, Any

from kedro_viz.api.rest.responses.pipelines import (
    DataNodeAPIResponse,
    GraphAPIResponse,
    GraphEdgeAPIResponse,
    ModularPipelineChildAPIResponse,
    ModularPipelinesTreeNodeAPIResponse,
    NamedEntityAPIResponse,
    TaskNodeAPIResponse,
)
from kedro_viz.constants import DEFAULT_REGISTERED_PIPELINE_ID
from kedro_viz.integrations.kedro.inspection.layers import (
    _extract_layers,
    sort_layers,
)
from kedro_viz.integrations.kedro.inspection.modular_pipelines import (
    ModularMembership,
    ModularTreeBuilder,
    ModularTreeEntry,
    add_modular_edges,
    remove_cyclic_modular_edges,
)
from kedro_viz.integrations.kedro.node_ids import (
    _create_dataset_node_id,
    _create_task_node_id,
)
from kedro_viz.models.flowchart.model_utils import GraphNodeType
from kedro_viz.utils import _strip_transcoding, is_dataset_param

if TYPE_CHECKING:
    from kedro.inspection.models import NodeSnapshot, ProjectSnapshot

_AUTO_NAME_RE = re.compile(r"^(?P<func>.+)__[0-9a-f]{8}$")

# The dataset_type string for an unregistered (in-memory) dataset
# (``get_dataset_type(MemoryDataset())``). The snapshot has no entry for these,
# so the adapter synthesizes this string, which the frontend's icon mapping expects.
MEMORY_DATASET_TYPE = "io.memory_dataset.MemoryDataset"


class GraphBuilder:
    """Build ``GraphAPIResponse`` objects for a project snapshot.

    Pipeline membership, modular-pipeline membership and the tag list are global (across every
    registered pipeline), matching the current backend; only the rendered nodes/edges are scoped to
    the selected pipeline.
    """

    def __init__(
        self,
        snapshot: ProjectSnapshot,
        catalog_config: dict[str, Any] | None = None,
        parameters: dict[str, Any] | None = None,
    ):
        self._snapshot = snapshot
        self._layer_by_dataset = _extract_layers(
            catalog_config or {}, _dataset_names_from_snapshot(snapshot)
        )
        # Resolved parameter values (``--params`` already applied), used to fill task-node
        # ``parameters`` in the format the detail panel expects. Empty when values aren't loaded.
        self._parameters = parameters or {}
        self._pipelines = {pipeline.name: pipeline for pipeline in snapshot.pipelines}
        self._task_pipelines: dict[str, set[str]] = defaultdict(set)
        self._dataset_pipelines: dict[str, set[str]] = defaultdict(set)
        # Tags are global: a task/dataset carries the union of the tags from every registered
        # pipeline it appears in, so they are aggregated once during the membership pass.
        self._task_tags: dict[str, set[str]] = defaultdict(set)
        self._dataset_tags: dict[str, set[str]] = defaultdict(set)
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

    def _compute_membership(self) -> None:
        """Record global pipeline membership and tags for every task and dataset."""
        for pipeline_id, pipeline in self._pipelines.items():
            for node in pipeline.nodes:
                task_id = _create_task_node_id(node.name, node.inputs, node.outputs)
                self._task_pipelines[task_id].add(pipeline_id)
                self._task_tags[task_id].update(node.tags)
                for io in [*node.inputs, *node.outputs]:
                    stripped = _strip_transcoding(io)
                    self._dataset_pipelines[stripped].add(pipeline_id)
                    self._dataset_tags[stripped].update(node.tags)

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

        for node in pipeline.nodes:
            task_id = _create_task_node_id(node.name, node.inputs, node.outputs)
            nodes.append(self._build_task_node(node, task_id))
            for name in node.inputs:
                self._add_edge(edges, _create_dataset_node_id(name), task_id)
                self._register_dataset(name, datasets)
            for name in node.outputs:
                self._add_edge(edges, task_id, _create_dataset_node_id(name))
                self._register_dataset(name, datasets)

        for stripped_name, original_name in datasets.items():
            nodes.append(self._build_dataset_node(stripped_name, original_name))

        tree_builder = ModularTreeBuilder(pipeline.nodes)
        tree = tree_builder.build()
        nodes.extend(self._build_modular_pipeline_nodes(tree_builder, selected))
        add_modular_edges(edges, tree)
        remove_cyclic_modular_edges(edges, tree)

        return GraphAPIResponse(
            nodes=nodes,
            edges=list(edges.values()),
            layers=self._sorted_layers_for_pipeline(nodes, edges),
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
            tags=sorted(self._task_tags[task_id]),
            pipelines=sorted(self._task_pipelines[task_id]),
            type=GraphNodeType.TASK.value,
            modular_pipelines=self._modular.for_task(node),
            parameters=self._task_parameters(node.inputs),
        )

    def _task_parameters(self, inputs: list[str]) -> dict[str, Any]:
        """Resolved parameter values a task consumes, in the format the detail panel expects.

        A ``parameters`` input means "all parameters" → the whole dict; a ``params:x`` input
        contributes ``{"x": <value>}`` (``x`` may be dotted, e.g. ``model_options.test_size``).
        """
        result: dict[str, Any] = {}
        for ref in inputs:
            if ref == "parameters":
                return dict(self._parameters)
            if ref.startswith("params:"):
                name = ref[len("params:") :]
                result[name] = _resolve_param(self._parameters, name)
        return result

    def _build_dataset_node(
        self,
        stripped_name: str,
        original_name: str,
    ) -> DataNodeAPIResponse:
        is_parameter = is_dataset_param(stripped_name)
        dataset = self._snapshot.datasets.get(
            original_name
        ) or self._snapshot.datasets.get(stripped_name)
        if is_parameter:
            dataset_type = None
        elif dataset is None:
            # No catalog entry means an unregistered (in-memory) dataset.
            dataset_type = MEMORY_DATASET_TYPE
        else:
            dataset_type = dataset.type or None
        return DataNodeAPIResponse(
            id=_create_dataset_node_id(stripped_name),
            name=stripped_name,
            tags=sorted(self._dataset_tags[stripped_name]),
            pipelines=sorted(self._dataset_pipelines[stripped_name]),
            type=(
                GraphNodeType.PARAMETERS.value
                if is_parameter
                else GraphNodeType.DATA.value
            ),
            modular_pipelines=self._modular.for_dataset(stripped_name),
            layer=(
                None if is_parameter else self._layer_by_dataset.get(stripped_name)
            ),
            dataset_type=dataset_type,
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

    def _sorted_layers_for_pipeline(
        self,
        nodes: list[TaskNodeAPIResponse | DataNodeAPIResponse],
        edges: dict[tuple[str, str], GraphEdgeAPIResponse],
    ) -> list[str]:
        """Sort the project-wide layer set using the selected pipeline's edges."""
        if not self._layer_by_dataset:
            return []
        dependencies: dict[str, set[str]] = defaultdict(set)
        for source, target in edges:
            dependencies[source].add(target)
        layer_by_node_id: dict[str, str | None] = {
            node.id: node.layer if isinstance(node, DataNodeAPIResponse) else None
            for node in nodes
        }
        # Include layered datasets used by any pipeline so every view exposes the
        # project-wide layer set; this view's edges determine their order.
        for dataset_name, layer in self._layer_by_dataset.items():
            if is_dataset_param(dataset_name) or dataset_name not in (
                self._dataset_pipelines
            ):
                continue
            layer_by_node_id.setdefault(_create_dataset_node_id(dataset_name), layer)
        return sort_layers(layer_by_node_id, dependencies)

    @staticmethod
    def _register_dataset(name: str, datasets: dict[str, str]) -> None:
        """Record the dataset for rendering, keyed by stripped name (tags are indexed globally)."""
        datasets.setdefault(_strip_transcoding(name), name)

    @staticmethod
    def _add_edge(
        edges: dict[tuple[str, str], GraphEdgeAPIResponse], source: str, target: str
    ) -> None:
        edges.setdefault(
            (source, target), GraphEdgeAPIResponse(source=source, target=target)
        )


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


def _dataset_names_from_snapshot(snapshot: ProjectSnapshot) -> set[str]:
    """Return non-parameter dataset names referenced by registered pipelines."""
    return {
        name
        for pipeline in snapshot.pipelines
        for node in pipeline.nodes
        for name in (*node.inputs, *node.outputs)
        if not is_dataset_param(name)
    }


def _resolve_param(parameters: dict[str, Any], dotted: str) -> Any:
    """Look up ``dotted`` (e.g. ``model_options.test_size``) in the parameters dict; ``None`` if absent."""
    node: Any = parameters
    for key in dotted.split("."):
        if isinstance(node, dict) and key in node:
            node = node[key]
        else:
            return None
    return node
