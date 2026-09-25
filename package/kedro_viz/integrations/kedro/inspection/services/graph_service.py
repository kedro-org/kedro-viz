"""Serve graph responses from one Kedro inspection snapshot."""

from __future__ import annotations

from typing import TYPE_CHECKING

from kedro_viz.api.rest.responses.pipelines import GraphAPIResponse
from kedro_viz.integrations.kedro.inspection.builders.graph_builder import GraphBuilder
from kedro_viz.integrations.kedro.inspection.datasource.snapshot_source import (
    InspectionInputs,
)
from kedro_viz.integrations.kedro.inspection.errors import PipelineNotFoundError

if TYPE_CHECKING:
    from collections.abc import Mapping

    from kedro_viz.integrations.kedro.inspection.datasource.enrichment import (
        GraphExtras,
    )
    from kedro_viz.models.metadata import NodeExtras


class GraphService:
    """Build graph responses from one prepared inspection snapshot."""

    def __init__(self, builder: GraphBuilder) -> None:
        self._builder = builder

    @classmethod
    def from_inspection_inputs(
        cls,
        inspection_inputs: InspectionInputs,
        *,
        node_extras_by_name: Mapping[str, NodeExtras] | None = None,
        graph_extras: GraphExtras | None = None,
    ) -> GraphService:
        """Prepare the graph service from already-loaded inspection inputs."""
        builder = GraphBuilder(
            inspection_inputs.snapshot,
            dict(inspection_inputs.catalog_config),
            parameters=dict(inspection_inputs.parameters),
            layer_by_dataset_name=(
                graph_extras.layer_by_dataset_name if graph_extras is not None else None
            ),
            node_extras_by_name=node_extras_by_name,
        )
        return cls(builder)

    def get_pipeline_response(self, pipeline_id: str | None = None) -> GraphAPIResponse:
        """Return the graph for one registered pipeline.

        Raises:
            PipelineNotFoundError: If ``pipeline_id`` is not registered.
        """
        selected_pipeline_id = (
            self._builder.default_pipeline_id() if pipeline_id is None else pipeline_id
        )
        if not self._builder.has_pipeline(selected_pipeline_id):
            raise PipelineNotFoundError(
                f"Invalid pipeline ID: {selected_pipeline_id!r}"
            )
        return self._builder.build(selected_pipeline_id)
