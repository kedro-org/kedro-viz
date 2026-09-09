"""Serve node metadata from shared inspection inputs."""

from __future__ import annotations

from collections.abc import Mapping
from typing import cast

from kedro_viz.api.rest.responses.nodes import (
    DataNodeMetadataAPIResponse,
    NodeMetadataAPIResponse,
    ParametersNodeMetadataAPIResponse,
    TaskNodeMetadataAPIResponse,
    TranscodedDataNodeMetadataAPIReponse,
)
from kedro_viz.integrations.kedro.inspection.errors import (
    NodeMetadataNotAvailableError,
    NodeNotFoundError,
)
from kedro_viz.integrations.kedro.inspection.node_metadata_builder import (
    NodeMetadataBuilder,
)
from kedro_viz.integrations.kedro.inspection.node_metadata_enrichment import (
    enrich_data_response,
    enrich_parameters_response,
    enrich_task_response,
    enrich_transcoded_response,
    is_compatible_live_node,
)
from kedro_viz.integrations.kedro.inspection.snapshot_source import InspectionInputs
from kedro_viz.models.flowchart.nodes import (
    DataNode,
    GraphNode,
    ParametersNode,
    TaskNode,
    TranscodedDataNode,
)
from kedro_viz.models.metadata import NodeExtras


class NodeMetadataService:
    """Coordinate node-metadata responses for one inspection snapshot."""

    def __init__(
        self,
        builder: NodeMetadataBuilder,
        *,
        live_nodes_by_id: Mapping[str, GraphNode] | None = None,
    ) -> None:
        self._builder = builder
        self._live_nodes_by_id = self._copy_supported_live_nodes(live_nodes_by_id)

    @classmethod
    def from_inspection_inputs(
        cls,
        inspection_inputs: InspectionInputs,
        *,
        enrichment: Mapping[str, NodeExtras] | None = None,
        live_nodes_by_id: Mapping[str, GraphNode] | None = None,
    ) -> NodeMetadataService:
        """Prepare static metadata and retain compatible live nodes without project I/O."""
        return cls(
            NodeMetadataBuilder(
                inspection_inputs.snapshot,
                parameters=dict(inspection_inputs.parameters),
                node_extras_by_name=enrichment,
            ),
            live_nodes_by_id=live_nodes_by_id,
        )

    def get_node_metadata_response(
        self,
        node_id: str,
        *,
        include_previews: bool = True,
    ) -> NodeMetadataAPIResponse:
        """Return fresh metadata with optional exact-ID live enrichment.

        Raises:
            NodeMetadataNotAvailableError: If the ID represents a modular pipeline.
            NodeNotFoundError: If the ID is unknown.
        """
        response = self._builder.build(node_id)
        live_node = self._live_nodes_by_id.get(node_id)
        if live_node is None:
            return response
        if isinstance(response, TaskNodeMetadataAPIResponse):
            enrich_task_response(response, cast(TaskNode, live_node))
        elif isinstance(response, DataNodeMetadataAPIResponse):
            enrich_data_response(
                response,
                cast(DataNode, live_node),
                include_previews=include_previews,
            )
        elif isinstance(response, TranscodedDataNodeMetadataAPIReponse):
            enrich_transcoded_response(response, cast(TranscodedDataNode, live_node))
        elif isinstance(response, ParametersNodeMetadataAPIResponse):
            enrich_parameters_response(response, cast(ParametersNode, live_node))
        return response

    def _copy_supported_live_nodes(
        self,
        live_nodes_by_id: Mapping[str, GraphNode] | None,
    ) -> dict[str, GraphNode]:
        retained: dict[str, GraphNode] = {}
        for node_id, node in dict(live_nodes_by_id or {}).items():
            if not isinstance(node, GraphNode) or node.id != node_id:
                continue
            try:
                prepared = self._builder.build(node_id)
            except (NodeNotFoundError, NodeMetadataNotAvailableError):
                continue
            if is_compatible_live_node(prepared, node):
                retained[node_id] = node
        return retained
