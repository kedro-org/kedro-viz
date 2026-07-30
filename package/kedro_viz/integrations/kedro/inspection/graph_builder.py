"""Build the main Kedro-Viz graph response from an inspection snapshot.

Creates task, data, parameter nodes, edges, global tags and pipeline dictionaries. Node IDs come
from ``kedro_viz.integrations.kedro.node_ids``; registered non-transcoded datasets use raw catalog
type strings from the snapshot.
"""

from __future__ import annotations

from collections import defaultdict
from typing import TYPE_CHECKING, Any

from kedro_viz.api.rest.responses.pipelines import (
    DataNodeAPIResponse,
    GraphAPIResponse,
    GraphEdgeAPIResponse,
    NamedEntityAPIResponse,
    TaskNodeAPIResponse,
)
from kedro_viz.constants import DEFAULT_REGISTERED_PIPELINE_ID
from kedro_viz.integrations.kedro.inspection.layers import (
    _extract_layers,
    sort_layers,
)
from kedro_viz.integrations.kedro.node_ids import (
    _create_dataset_node_id,
    _create_task_node_id,
    _is_auto_node_name,
)
from kedro_viz.models.flowchart.model_utils import GraphNodeType
from kedro_viz.utils import _strip_transcoding, is_dataset_param

if TYPE_CHECKING:
    from kedro.inspection.models import (
        NodeSnapshot,
        PipelineSnapshot,
        ProjectSnapshot,
    )

# Match the live backend's get_dataset_type(MemoryDataset()) output for datasets
# absent from the snapshot catalog.
MEMORY_DATASET_TYPE = "io.memory_dataset.MemoryDataset"


class _SnapshotGraphIndex:
    """Aggregate tags and pipeline IDs by task and dataset identity."""

    def __init__(self, pipelines: dict[str, PipelineSnapshot]) -> None:
        self._pipelines_by_task_id: dict[str, set[str]] = defaultdict(set)
        self._pipelines_by_dataset_name: dict[str, set[str]] = defaultdict(set)
        self._tags_by_task_id: dict[str, set[str]] = defaultdict(set)
        self._tags_by_dataset_name: dict[str, set[str]] = defaultdict(set)
        self._all_tags: set[str] = set()
        for pipeline_id, pipeline in pipelines.items():
            for node in pipeline.nodes:
                task_id = _create_task_node_id(
                    node_name=node.name,
                    func_name=node.func_name,
                    namespace=node.namespace,
                    inputs=node.inputs,
                    outputs=node.outputs,
                )
                self._pipelines_by_task_id[task_id].add(pipeline_id)
                self._tags_by_task_id[task_id].update(node.tags)
                self._all_tags.update(node.tags)
                for io in [*node.inputs, *node.outputs]:
                    stripped = _strip_transcoding(io)
                    self._pipelines_by_dataset_name[stripped].add(pipeline_id)
                    self._tags_by_dataset_name[stripped].update(node.tags)

    def get_pipelines_for_task_id(self, task_id: str) -> list[str]:
        """Sorted IDs of the registered pipelines the task node appears in."""
        return sorted(self._pipelines_by_task_id.get(task_id, set()))

    def get_tags_for_task_id(self, task_id: str) -> list[str]:
        """Sorted tags aggregated across every pipeline the task node appears in."""
        return sorted(self._tags_by_task_id.get(task_id, set()))

    def get_pipelines_for_dataset_name(self, dataset_name: str) -> list[str]:
        """Sorted IDs of the registered pipelines the dataset appears in."""
        return sorted(self._pipelines_by_dataset_name.get(dataset_name, set()))

    def get_tags_for_dataset_name(self, dataset_name: str) -> list[str]:
        """Sorted tags aggregated across every pipeline the dataset appears in."""
        return sorted(self._tags_by_dataset_name.get(dataset_name, set()))

    def get_all_tags(self) -> list[str]:
        """Sorted list of every tag used across the project."""
        return sorted(self._all_tags)


class GraphBuilder:
    """Build ``GraphAPIResponse`` objects for a project snapshot.

    Tags and pipelines associated with each node are aggregated across all registered pipelines,
    while rendered nodes and edges are scoped to the selected pipeline.
    """

    def __init__(
        self,
        snapshot: ProjectSnapshot,
        catalog_config: dict[str, Any] | None = None,
    ) -> None:
        self._snapshot = snapshot
        self._layer_by_dataset = _extract_layers(
            catalog_config=catalog_config or {},
            dataset_names=_dataset_names_from_snapshot(snapshot),
        )
        self._pipelines_by_id = {
            pipeline.name: pipeline for pipeline in snapshot.pipelines
        }
        self._index = _SnapshotGraphIndex(self._pipelines_by_id)

    def default_pipeline_id(self) -> str:
        """Return the default pipeline ID to render.

        Returns:
            ``__default__`` when it is registered, otherwise the first registered pipeline ID
            (declaration order).

        Raises:
            ValueError: If the snapshot has no registered pipelines.
        """
        if not self._pipelines_by_id:
            raise ValueError("No registered pipelines in snapshot")
        if DEFAULT_REGISTERED_PIPELINE_ID in self._pipelines_by_id:
            return DEFAULT_REGISTERED_PIPELINE_ID
        return next(iter(self._pipelines_by_id))

    def has_pipeline(self, pipeline_id: str) -> bool:
        """Whether a pipeline is registered in this snapshot view.

        Args:
            pipeline_id: The pipeline ID to check.

        Returns:
            ``True`` if ``pipeline_id`` is a registered pipeline in this snapshot view.
        """
        return pipeline_id in self._pipelines_by_id

    def pipeline_ids(self) -> list[str]:
        """Registered pipeline IDs in this snapshot view (preserves declaration order)."""
        return list(self._pipelines_by_id.keys())

    def build(self, pipeline_id: str | None = None) -> GraphAPIResponse:
        """Build the main graph response for a registered pipeline.

        Args:
            pipeline_id: The registered pipeline to render. When ``None``, the default
                pipeline (see :meth:`default_pipeline_id`) is used.

        Returns:
            The ``GraphAPIResponse`` for the selected pipeline: its task, data and parameter
            nodes and edges, plus the globally-aggregated tag and pipeline lists.

        Raises:
            ValueError: If ``pipeline_id`` is not a registered pipeline in this snapshot view.
        """
        selected = pipeline_id or self.default_pipeline_id()
        if not self.has_pipeline(selected):
            raise ValueError(f"Invalid pipeline ID: {selected!r}")
        pipeline = self._pipelines_by_id[selected]

        nodes: list[TaskNodeAPIResponse | DataNodeAPIResponse] = []
        edges: dict[tuple[str, str], GraphEdgeAPIResponse] = {}
        # Map each stripped name to one original name for catalog lookup.
        datasets: dict[str, str] = {}
        transcoded_datasets: set[str] = set()

        for node in pipeline.nodes:
            task_id = _create_task_node_id(
                node_name=node.name,
                func_name=node.func_name,
                namespace=node.namespace,
                inputs=node.inputs,
                outputs=node.outputs,
            )
            nodes.append(self._build_task_node(node, task_id))
            for name in node.inputs:
                self._add_edge(edges, _create_dataset_node_id(name), task_id)
                self._register_dataset(name, datasets, transcoded_datasets)
            for name in node.outputs:
                self._add_edge(edges, task_id, _create_dataset_node_id(name))
                self._register_dataset(name, datasets, transcoded_datasets)

        for stripped_name, original_name in datasets.items():
            nodes.append(
                self._build_dataset_node(
                    stripped_name,
                    original_name,
                    is_transcoded=stripped_name in transcoded_datasets,
                )
            )

        return GraphAPIResponse(
            nodes=nodes,
            edges=list(edges.values()),
            layers=self._sorted_layers_for_pipeline(nodes, edges),
            tags=[
                NamedEntityAPIResponse(id=tag, name=tag)
                for tag in self._index.get_all_tags()
            ],
            pipelines=[
                NamedEntityAPIResponse(id=pid, name=pid)
                for pid in self._pipelines_by_id
            ],
            modular_pipelines={},
            selected_pipeline=selected,
        )

    def _build_task_node(self, node: NodeSnapshot, task_id: str) -> TaskNodeAPIResponse:
        return TaskNodeAPIResponse(
            id=task_id,
            name=_display_name(node.name, node.func_name, node.namespace),
            full_name=node.name,
            tags=self._index.get_tags_for_task_id(task_id),
            pipelines=self._index.get_pipelines_for_task_id(task_id),
            type=GraphNodeType.TASK.value,
            modular_pipelines=None,
            parameters={},
        )

    def _build_dataset_node(
        self,
        stripped_name: str,
        original_name: str,
        *,
        is_transcoded: bool,
    ) -> DataNodeAPIResponse:
        is_parameter = is_dataset_param(stripped_name)
        if is_parameter or is_transcoded:
            dataset_type = None
        else:
            dataset = self._snapshot.datasets.get(
                original_name
            ) or self._snapshot.datasets.get(stripped_name)
            if dataset is None:
                # No catalog entry means an unregistered (in-memory) dataset.
                dataset_type = MEMORY_DATASET_TYPE
            else:
                dataset_type = dataset.type or None
        return DataNodeAPIResponse(
            id=_create_dataset_node_id(stripped_name),
            name=stripped_name,
            tags=self._index.get_tags_for_dataset_name(stripped_name),
            pipelines=self._index.get_pipelines_for_dataset_name(stripped_name),
            type=(
                GraphNodeType.PARAMETERS.value
                if is_parameter
                else GraphNodeType.DATA.value
            ),
            modular_pipelines=None,
            layer=(None if is_parameter else self._layer_by_dataset.get(stripped_name)),
            dataset_type=dataset_type,
        )

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
            dataset_pipelines = self._index.get_pipelines_for_dataset_name(dataset_name)
            if is_dataset_param(dataset_name) or not dataset_pipelines:
                continue
            layer_by_node_id.setdefault(_create_dataset_node_id(dataset_name), layer)
        return sort_layers(layer_by_node_id, dependencies)

    @staticmethod
    def _register_dataset(
        name: str, datasets: dict[str, str], transcoded_datasets: set[str]
    ) -> None:
        """Record a dataset for rendering and identify transcoded references."""
        stripped_name = _strip_transcoding(name)
        datasets.setdefault(stripped_name, name)
        if stripped_name != name:
            transcoded_datasets.add(stripped_name)

    @staticmethod
    def _add_edge(
        edges: dict[tuple[str, str], GraphEdgeAPIResponse], source: str, target: str
    ) -> None:
        edges.setdefault(
            (source, target), GraphEdgeAPIResponse(source=source, target=target)
        )


def _display_name(snapshot_name: str, func_name: str, namespace: str | None) -> str:
    """Return the function name for auto-named nodes, otherwise the local node name."""
    local_name = (
        snapshot_name.removeprefix(f"{namespace}.") if namespace else snapshot_name
    )
    return func_name if _is_auto_node_name(local_name, func_name) else local_name


def _dataset_names_from_snapshot(snapshot: ProjectSnapshot) -> set[str]:
    """Return non-parameter dataset names referenced by registered pipelines."""
    return {
        name
        for pipeline in snapshot.pipelines
        for node in pipeline.nodes
        for name in (*node.inputs, *node.outputs)
        if not is_dataset_param(name)
    }
