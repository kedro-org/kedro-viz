"""Build node-detail responses from a Kedro inspection snapshot."""

from __future__ import annotations

from collections.abc import Mapping
from typing import TYPE_CHECKING, Any

from kedro_viz.api.rest.responses.nodes import (
    DataNodeMetadataAPIResponse,
    NodeMetadataAPIResponse,
    ParametersNodeMetadataAPIResponse,
    TaskNodeMetadataAPIResponse,
    TranscodedDataNodeMetadataAPIReponse,
)
from kedro_viz.constants import MEMORY_DATASET_TYPE
from kedro_viz.integrations.kedro.inspection.errors import (
    NodeMetadataNotAvailableError,
    NodeNotFoundError,
)
from kedro_viz.integrations.kedro.inspection.modular_pipelines import (
    ModularPipelineIndex,
)
from kedro_viz.integrations.kedro.inspection.snapshot_source import (
    DatasetEntry,
    build_dataset_index,
    build_parameters_from_inputs,
)
from kedro_viz.integrations.kedro.node_ids import (
    _create_dataset_node_id,
    _create_task_node_id_from_node_snapshot,
)
from kedro_viz.models.metadata import NodeExtras
from kedro_viz.utils import _strip_transcoding, is_dataset_param

if TYPE_CHECKING:
    from kedro.inspection.models import DatasetSnapshot, ProjectSnapshot


class NodeMetadataBuilder:
    """Prepare static node metadata keyed by the graph's canonical node IDs."""

    def __init__(
        self,
        snapshot: ProjectSnapshot,
        *,
        parameters: Mapping[str, Any],
        node_extras_by_name: Mapping[str, NodeExtras] | None = None,
    ) -> None:
        self._snapshot = snapshot
        self._parameters = dict(parameters)
        self._node_extras_by_name = dict(node_extras_by_name or {})
        self._modular_pipeline_index = ModularPipelineIndex.from_registered_pipelines(
            snapshot.pipelines
        )
        self._metadata_by_node_id = self._build_metadata_index()

    def build(self, node_id: str) -> NodeMetadataAPIResponse:
        """Return fresh metadata for ``node_id``.

        Raises:
            NodeMetadataNotAvailableError: If the ID represents a modular pipeline.
            NodeNotFoundError: If the ID is unknown.
        """
        try:
            prepared = self._metadata_by_node_id[node_id]
        except KeyError as exc:
            if self._modular_pipeline_index.has_modular_pipeline(node_id):
                raise NodeMetadataNotAvailableError(
                    f"Node metadata is not available for: {node_id!r}"
                ) from exc
            raise NodeNotFoundError(f"Invalid node ID: {node_id!r}") from exc
        return prepared.model_copy(deep=True)

    def _build_metadata_index(self) -> dict[str, NodeMetadataAPIResponse]:
        datasets = build_dataset_index(self._snapshot.pipelines)
        metadata_by_node_id: dict[str, NodeMetadataAPIResponse] = {}

        for pipeline in self._snapshot.pipelines:
            for node in pipeline.nodes:
                task_id = _create_task_node_id_from_node_snapshot(node)
                if task_id not in metadata_by_node_id:
                    metadata_by_node_id[task_id] = TaskNodeMetadataAPIResponse(
                        parameters=build_parameters_from_inputs(
                            node.inputs, self._parameters
                        ),
                        inputs=list(node.inputs),
                        outputs=list(node.outputs),
                        run_command=f"kedro run --to-nodes='{node.name}'",
                    )
                for reference in [*node.inputs, *node.outputs]:
                    node_id = _create_dataset_node_id(reference)
                    if node_id not in metadata_by_node_id:
                        base_name = _strip_transcoding(reference)
                        metadata_by_node_id[node_id] = self._build_dataset_metadata(
                            base_name, datasets[base_name]
                        )

        return metadata_by_node_id

    def _build_dataset_metadata(
        self, base_name: str, entry: DatasetEntry
    ) -> NodeMetadataAPIResponse:
        if is_dataset_param(entry.name):
            return ParametersNodeMetadataAPIResponse(
                parameters=build_parameters_from_inputs([entry.name], self._parameters)
            )

        if entry.name != base_name:
            return self._build_transcoded_metadata(
                base_name,
                entry.inputs,
                entry.output,
                is_free_input=entry.is_free_input,
            )

        dataset = self._snapshot.datasets.get(entry.name)
        return DataNodeMetadataAPIResponse(
            filepath=dataset.filepath if dataset is not None else None,
            type=self._dataset_type(dataset),
            run_command=(
                None if entry.is_free_input else f"kedro run --to-outputs={base_name}"
            ),
            stats=self._stats_for(base_name),
        )

    def _build_transcoded_metadata(
        self,
        base_name: str,
        input_references: list[str],
        output_reference: str | None,
        *,
        is_free_input: bool,
    ) -> TranscodedDataNodeMetadataAPIReponse:
        if output_reference is None:
            original_reference = input_references[0]
            transcoded_references = input_references[1:]
        else:
            original_reference = output_reference
            transcoded_references = input_references

        original = self._snapshot.datasets.get(original_reference)
        return TranscodedDataNodeMetadataAPIReponse(
            filepath=original.filepath if original is not None else None,
            original_type=self._dataset_type(original),
            transcoded_types=[
                self._dataset_type(self._snapshot.datasets.get(reference))
                for reference in transcoded_references
            ],
            run_command=(
                None
                if is_free_input or output_reference is None
                else f"kedro run --to-outputs={output_reference}"
            ),
            stats=self._stats_for(base_name),
        )

    @staticmethod
    def _dataset_type(dataset: DatasetSnapshot | None) -> str:
        return MEMORY_DATASET_TYPE if dataset is None else dataset.type

    def _stats_for(self, node_name: str) -> dict[str, Any] | None:
        node_extras = self._node_extras_by_name.get(node_name)
        return None if node_extras is None else node_extras.stats
