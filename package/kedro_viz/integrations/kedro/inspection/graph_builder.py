"""Build a Kedro-Viz ``GraphAPIResponse`` from an inspection snapshot (the main graph).

Produces the main graph: task, data and parameter nodes; the edges between them; the tag and
pipeline lists; per-node registered-pipeline membership; and data-node tags. Node IDs come from
:mod:`kedro_viz.integrations.kedro.node_ids`.

Modular-pipeline nodes/tree, per-node ``layer`` with the global ``layers`` list, and resolved task
``parameters`` are later phases: here every node carries ``modular_pipelines=None`` (the tree is
``{}``), datasets carry ``layer=None`` (``layers`` is ``[]``), and task ``parameters`` is ``{}``.
The raw catalog ``type`` string (e.g. ``pandas.CSVDataset``) is still surfaced as ``dataset_type``.
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

# The dataset_type string for an unregistered (in-memory) dataset
# (``get_dataset_type(MemoryDataset())``). The snapshot has no entry for these,
# so the adapter synthesizes this string, which the frontend's icon mapping expects.
MEMORY_DATASET_TYPE = "io.memory_dataset.MemoryDataset"


class GraphBuilder:
    """Build ``GraphAPIResponse`` objects for a project snapshot.

    Pipeline membership and the tag list are global (across every registered pipeline), matching the
    current backend; only the rendered nodes/edges are scoped to the selected pipeline.
    """

    def __init__(self, snapshot: ProjectSnapshot):
        self._snapshot = snapshot
        self._pipelines = {pipeline.name: pipeline for pipeline in snapshot.pipelines}
        self._task_pipelines: dict[str, set[str]] = defaultdict(set)
        self._dataset_pipelines: dict[str, set[str]] = defaultdict(set)
        self._compute_membership()
        # Tags are global and invariant across pipeline views, so build them once.
        self._tags = self._build_tags()

    def _compute_membership(self) -> None:
        """Record, for every task and dataset, which registered pipelines contain it."""
        for pipeline_id, pipeline in self._pipelines.items():
            for node in pipeline.nodes:
                task_id = _create_task_node_id(node.name, node.inputs, node.outputs)
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
            task_id = _create_task_node_id(node.name, node.inputs, node.outputs)
            nodes.append(self._build_task_node(node, task_id))
            for name in node.inputs:
                self._add_edge(edges, _create_dataset_node_id(name), task_id)
                self._register_dataset(name, node, datasets, dataset_tags)
            for name in node.outputs:
                self._add_edge(edges, task_id, _create_dataset_node_id(name))
                self._register_dataset(name, node, datasets, dataset_tags)

        for stripped_name, original_name in datasets.items():
            nodes.append(
                self._build_dataset_node(
                    stripped_name,
                    original_name,
                    sorted(dataset_tags[stripped_name]),
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

    # -- node builders ---------------------------------------------------------------- #
    def _build_task_node(self, node: NodeSnapshot, task_id: str) -> TaskNodeAPIResponse:
        return TaskNodeAPIResponse(
            id=task_id,
            name=_display_name(node.name, node.namespace),
            full_name=node.name,
            tags=sorted(node.tags),
            pipelines=sorted(self._task_pipelines[task_id]),
            type=GraphNodeType.TASK.value,
            modular_pipelines=None,
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
            tags=tags,
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


def _display_name(snapshot_name: str, namespace: str | None) -> str:
    """Derive the UI display name: strip the namespace and any auto-name ``__<hash>`` suffix."""
    local = snapshot_name
    prefix = f"{namespace}."
    if namespace and local.startswith(prefix):
        local = local[len(prefix) :]
    auto = _AUTO_NAME_RE.match(local)
    return auto.group("func") if auto else local
