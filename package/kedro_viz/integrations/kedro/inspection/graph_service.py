"""Serve graph responses from one Kedro inspection snapshot."""

from __future__ import annotations

from kedro_viz.api.rest.responses.pipelines import GraphAPIResponse
from kedro_viz.integrations.kedro.inspection.enrichment import (
    EnrichmentSources,
    enrich_graph_response,
)
from kedro_viz.integrations.kedro.inspection.errors import PipelineNotFoundError
from kedro_viz.integrations.kedro.inspection.graph_builder import GraphBuilder
from kedro_viz.integrations.kedro.inspection.snapshot_source import (
    InspectionProjectData,
)


class InspectionGraphService:
    """Build graph responses from one prepared inspection snapshot."""

    def __init__(
        self,
        builder: GraphBuilder,
        enrichment: EnrichmentSources | None = None,
    ) -> None:
        self._builder = builder
        self._enrichment = enrichment if enrichment is not None else EnrichmentSources()

    @classmethod
    def from_project_data(
        cls,
        project_data: InspectionProjectData,
        *,
        enrichment: EnrichmentSources | None = None,
    ) -> InspectionGraphService:
        """Prepare the graph service from already-loaded inspection inputs."""
        sources = enrichment if enrichment is not None else EnrichmentSources()
        builder = GraphBuilder(
            project_data.snapshot,
            dict(project_data.catalog_config),
            parameter_feed=dict(project_data.parameter_feed),
            layer_by_dataset=sources.layer_by_dataset,
        )
        return cls(builder, sources)

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
        response = self._builder.build(selected_pipeline_id)
        enrich_graph_response(response, self._enrichment)
        return response
