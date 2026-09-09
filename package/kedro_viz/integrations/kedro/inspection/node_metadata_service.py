"""Serve node metadata from shared inspection inputs."""

from __future__ import annotations

from collections.abc import Mapping

from kedro_viz.api.rest.responses.nodes import NodeMetadataAPIResponse
from kedro_viz.integrations.kedro.inspection.node_metadata_builder import (
    NodeMetadataBuilder,
)
from kedro_viz.integrations.kedro.inspection.snapshot_source import InspectionInputs
from kedro_viz.models.metadata import NodeExtras


class NodeMetadataService:
    """Coordinate node-metadata responses for one inspection snapshot."""

    def __init__(self, builder: NodeMetadataBuilder) -> None:
        self._builder = builder

    @classmethod
    def from_inspection_inputs(
        cls,
        inspection_inputs: InspectionInputs,
        *,
        enrichment: Mapping[str, NodeExtras] | None = None,
    ) -> NodeMetadataService:
        """Prepare static metadata without loading the project or a live catalog."""
        return cls(
            NodeMetadataBuilder(
                inspection_inputs.snapshot,
                parameters=dict(inspection_inputs.parameters),
                node_extras_by_name=enrichment,
            )
        )

    def get_node_metadata_response(self, node_id: str) -> NodeMetadataAPIResponse:
        """Return fresh metadata for a canonical graph node ID.

        Raises:
            NodeNotFoundError: If the ID is unknown or represents an unsupported node kind.
        """
        return self._builder.build(node_id)
