"""Build the modular-pipeline tree and its API representation for one pipeline."""

from __future__ import annotations

from typing import TYPE_CHECKING

from pydantic import BaseModel, Field

from kedro_viz.api.rest.responses.pipelines import (
    ModularPipelineChildAPIResponse,
    ModularPipelinesTreeNodeAPIResponse,
)
from kedro_viz.constants import ROOT_MODULAR_PIPELINE_ID
from kedro_viz.integrations.kedro.node_ids import (
    _create_dataset_node_id,
    _create_task_node_id_from_node_snapshot,
)
from kedro_viz.models.flowchart.model_utils import GraphNodeType
from kedro_viz.utils import _strip_transcoding, is_dataset_param

from .boundaries import _compute_namespace_boundaries, _in_subtree
from .index import ModularPipelineIndex

if TYPE_CHECKING:
    from kedro.inspection.models import NodeSnapshot


class _ModularPipelineTreeEntry(BaseModel):
    """One node in the modular-pipeline tree.

    ``name`` and the modular-pipeline IDs are namespace strings; dataset and task IDs in
    ``inputs``, ``outputs`` and ``children`` are hashed graph IDs.
    """

    name: str
    inputs: set[str] = Field(default_factory=set)
    outputs: set[str] = Field(default_factory=set)
    children: set[tuple[str, str]] = Field(default_factory=set)  # (node_id, node_type)


class _ModularPipelineTreeBuilder:
    """Build the modular-pipeline tree for the nodes of a single rendered pipeline."""

    def __init__(self, nodes: list[NodeSnapshot]) -> None:
        self._nodes = nodes
        # Resolved against this pipeline's nodes only: a node is a root child when it has no
        # modular pipeline assignment in this view, which can differ from project assignments.
        boundaries = _compute_namespace_boundaries(nodes)
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
        root = _ModularPipelineTreeEntry(name=ROOT_MODULAR_PIPELINE_ID)
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
        entry = _ModularPipelineTreeEntry(name=mp_id)
        tree[mp_id] = entry
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
        parent = tree[parent_id]
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
