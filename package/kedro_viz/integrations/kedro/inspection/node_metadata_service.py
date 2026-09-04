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
from kedro_viz.integrations.kedro.inspection.errors import NodeNotFoundError
from kedro_viz.integrations.kedro.inspection.graph_builder import MEMORY_DATASET_TYPE
from kedro_viz.integrations.kedro.inspection.parameters import parameters_for_inputs
from kedro_viz.integrations.kedro.node_ids import (
    _create_dataset_node_id,
    _create_task_node_id_from_node_snapshot,
)
from kedro_viz.models.metadata import NodeExtras
from kedro_viz.utils import _strip_transcoding, is_dataset_param

if TYPE_CHECKING:
    from kedro.inspection.models import DatasetSnapshot, ProjectSnapshot


class NodeMetadataService:
    """Prepare static node metadata keyed by the graph's canonical node IDs."""

    def __init__(
        self,
        snapshot: ProjectSnapshot,
        *,
        parameter_feed: Mapping[str, Any],
        node_extras_by_name: Mapping[str, NodeExtras] | None = None,
    ) -> None:
        self._snapshot = snapshot
        self._parameter_feed = dict(parameter_feed)
        self._node_extras_by_name = dict(node_extras_by_name or {})
        self._metadata_by_node_id = self._build_metadata_index()

    def get_node_metadata_response(self, node_id: str) -> NodeMetadataAPIResponse:
        """Return fresh metadata for ``node_id``.

        Raises:
            NodeNotFoundError: If the ID is unknown or represents an unsupported node kind.
        """
        try:
            prepared = self._metadata_by_node_id[node_id]
        except KeyError as exc:
            raise NodeNotFoundError(f"Invalid node ID: {node_id!r}") from exc
        return prepared.model_copy(deep=True)

    def _build_metadata_index(self) -> dict[str, NodeMetadataAPIResponse]:
        (
            first_references,
            first_free_inputs,
            input_references,
            output_references,
        ) = self._index_dataset_references()
        metadata_by_node_id: dict[str, NodeMetadataAPIResponse] = {}

        for pipeline in self._snapshot.pipelines:
            for node in pipeline.nodes:
                task_id = _create_task_node_id_from_node_snapshot(node)
                if task_id not in metadata_by_node_id:
                    metadata_by_node_id[task_id] = TaskNodeMetadataAPIResponse(
                        parameters=parameters_for_inputs(
                            node.inputs, self._parameter_feed
                        ),
                        inputs=list(node.inputs),
                        outputs=list(node.outputs),
                        run_command=f"kedro run --to-nodes='{node.name}'",
                    )
                for reference in node.inputs:
                    self._register_dataset_metadata(
                        metadata_by_node_id,
                        reference,
                        first_references=first_references,
                        first_free_inputs=first_free_inputs,
                        input_references=input_references,
                        output_references=output_references,
                    )
                for reference in node.outputs:
                    self._register_dataset_metadata(
                        metadata_by_node_id,
                        reference,
                        first_references=first_references,
                        first_free_inputs=first_free_inputs,
                        input_references=input_references,
                        output_references=output_references,
                    )

        return metadata_by_node_id

    def _register_dataset_metadata(
        self,
        metadata_by_node_id: dict[str, NodeMetadataAPIResponse],
        reference: str,
        *,
        first_references: Mapping[str, str],
        first_free_inputs: Mapping[str, bool],
        input_references: Mapping[str, list[str]],
        output_references: Mapping[str, str],
    ) -> None:
        node_id = _create_dataset_node_id(reference)
        if node_id in metadata_by_node_id:
            return

        base_name = _strip_transcoding(reference)
        first_reference = first_references[base_name]
        if is_dataset_param(first_reference):
            metadata_by_node_id[node_id] = self._build_parameters_metadata(
                first_reference
            )
            return

        if first_reference != base_name:
            metadata_by_node_id[node_id] = self._build_transcoded_metadata(
                base_name,
                input_references.get(base_name, []),
                output_references.get(base_name),
                is_free_input=first_free_inputs[base_name],
            )
            return

        dataset = self._snapshot.datasets.get(first_reference)
        metadata_by_node_id[node_id] = DataNodeMetadataAPIResponse(
            filepath=dataset.filepath if dataset is not None else None,
            type=self._dataset_type(dataset),
            run_command=(
                None
                if first_free_inputs[base_name]
                else f"kedro run --to-outputs={base_name}"
            ),
            stats=self._stats_for(base_name),
        )

    def _build_parameters_metadata(
        self, reference: str
    ) -> ParametersNodeMetadataAPIResponse:
        if reference == "parameters":
            values = dict(self._parameter_feed.get(reference, {}))
        else:
            name = reference.removeprefix("params:")
            values = {name: self._parameter_feed.get(reference)}
        return ParametersNodeMetadataAPIResponse(parameters=values)

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

    def _index_dataset_references(
        self,
    ) -> tuple[
        dict[str, str],
        dict[str, bool],
        dict[str, list[str]],
        dict[str, str],
    ]:
        first_references: dict[str, str] = {}
        first_free_inputs: dict[str, bool] = {}
        input_references: dict[str, list[str]] = {}
        seen_inputs: dict[str, set[str]] = {}
        output_references: dict[str, str] = {}

        def index_reference(
            reference: str,
            *,
            is_input: bool,
            is_free_input: bool,
        ) -> None:
            base_name = _strip_transcoding(reference)
            first_references.setdefault(base_name, reference)
            first_free_inputs.setdefault(base_name, is_free_input)
            first_reference = first_references[base_name]
            if first_reference == base_name:
                return
            if is_input:
                inputs = input_references.setdefault(base_name, [])
                seen = seen_inputs.setdefault(base_name, set())
                if reference not in seen:
                    inputs.append(reference)
                    seen.add(reference)
            else:
                # Match the live repository: the last producer assignment wins.
                output_references[base_name] = reference

        for pipeline in self._snapshot.pipelines:
            for node in pipeline.nodes:
                for reference in node.inputs:
                    index_reference(
                        reference,
                        is_input=True,
                        is_free_input=reference in pipeline.inputs,
                    )
                for reference in node.outputs:
                    index_reference(
                        reference,
                        is_input=False,
                        is_free_input=False,
                    )

        return (
            first_references,
            first_free_inputs,
            input_references,
            output_references,
        )

    @staticmethod
    def _dataset_type(dataset: DatasetSnapshot | None) -> str:
        return MEMORY_DATASET_TYPE if dataset is None else dataset.type

    def _stats_for(self, node_name: str) -> dict[str, Any] | None:
        node_extras = self._node_extras_by_name.get(node_name)
        return None if node_extras is None else node_extras.stats
