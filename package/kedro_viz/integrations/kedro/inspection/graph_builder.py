"""Build the main Kedro-Viz graph response from an inspection snapshot.

Creates task, data and parameter nodes; edges; and global tags and pipeline membership.
Modular-pipeline structure, layers and resolved task parameters use empty placeholders. Node IDs
come from ``kedro_viz.integrations.kedro.node_ids``; registered non-transcoded datasets use raw
catalog type strings from the snapshot.
"""

from __future__ import annotations

import re
from collections import defaultdict
from typing import TYPE_CHECKING

from kedro_viz.api.rest.responses.pipelines import (
    DataNodeAPIResponse,
    GraphAPIResponse,
    GraphEdgeAPIResponse,
    NamedEntityAPIResponse,
    TaskNodeAPIResponse,
)
from kedro_viz.constants import DEFAULT_REGISTERED_PIPELINE_ID
from kedro_viz.integrations.kedro.node_ids import (
    _create_dataset_node_id,
    _create_task_node_id,
)
from kedro_viz.models.flowchart.model_utils import GraphNodeType
from kedro_viz.utils import _strip_transcoding, is_dataset_param

if TYPE_CHECKING:
    from kedro.inspection.models import NodeSnapshot, ProjectSnapshot

_AUTO_NAME_RE = re.compile(r"^(?P<func>.+)__[0-9a-f]{8}$")

# Match the live backend's get_dataset_type(MemoryDataset()) output for datasets
# absent from the snapshot catalog.
MEMORY_DATASET_TYPE = "io.memory_dataset.MemoryDataset"


class GraphBuilder:
    """Build ``GraphAPIResponse`` objects for a project snapshot.

    Pipeline membership and tags are global (aggregated across every registered pipeline), while
    only the rendered nodes and edges are scoped to the selected pipeline.
    """

    def __init__(self, snapshot: ProjectSnapshot) -> None:
        self._snapshot = snapshot
        self._pipelines = {pipeline.name: pipeline for pipeline in snapshot.pipelines}
        self._task_pipelines: dict[str, set[str]] = defaultdict(set)
        self._dataset_pipelines: dict[str, set[str]] = defaultdict(set)
        self._task_tags: dict[str, set[str]] = defaultdict(set)
        self._dataset_tags: dict[str, set[str]] = defaultdict(set)
        self._index_nodes()
        self._tags = self._build_tags()

    def _index_nodes(self) -> None:
        """Aggregate task and dataset membership and tags globally, matching the live backend."""
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
        # Map each stripped name to one original name for catalog lookup.
        datasets: dict[str, str] = {}
        transcoded_datasets: set[str] = set()

        for node in pipeline.nodes:
            task_id = _create_task_node_id(node.name, node.inputs, node.outputs)
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
            layers=[],
            tags=self._tags,
            pipelines=[
                NamedEntityAPIResponse(id=pid, name=pid) for pid in self._pipelines
            ],
            modular_pipelines={},
            selected_pipeline=selected,
        )

    def _build_task_node(self, node: NodeSnapshot, task_id: str) -> TaskNodeAPIResponse:
        return TaskNodeAPIResponse(
            id=task_id,
            name=_display_name(node.name, node.namespace),
            full_name=node.name,
            tags=sorted(self._task_tags[task_id]),
            pipelines=sorted(self._task_pipelines[task_id]),
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
            tags=sorted(self._dataset_tags[stripped_name]),
            pipelines=sorted(self._dataset_pipelines[stripped_name]),
            type=(
                GraphNodeType.PARAMETERS.value
                if is_parameter
                else GraphNodeType.DATA.value
            ),
            modular_pipelines=None,
            layer=None,
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


def _display_name(snapshot_name: str, namespace: str | None) -> str:
    """Derive the UI display name: strip the namespace and any auto-name ``__<hash>`` suffix."""
    local = snapshot_name
    prefix = f"{namespace}."
    if namespace and local.startswith(prefix):
        local = local[len(prefix) :]
    auto = _AUTO_NAME_RE.match(local)
    return auto.group("func") if auto else local
