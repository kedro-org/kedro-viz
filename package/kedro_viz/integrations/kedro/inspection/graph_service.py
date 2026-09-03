"""Serve graph responses from one Kedro inspection snapshot."""

from __future__ import annotations

from pathlib import Path
from typing import Any

from kedro_viz.api.rest.responses.pipelines import GraphAPIResponse
from kedro_viz.integrations.kedro.inspection.enrichment import (
    EnrichmentSources,
    enrich_graph_response,
)
from kedro_viz.integrations.kedro.inspection.errors import PipelineNotFoundError
from kedro_viz.integrations.kedro.inspection.graph_builder import GraphBuilder
from kedro_viz.integrations.kedro.inspection.snapshot_source import (
    InspectionProjectData,
    filter_inspection_project_data,
    load_inspection_project_data,
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
    def from_project(
        cls,
        project_path: str | Path,
        *,
        env: str | None = None,
        pipeline_name: str | None = None,
        runtime_params: dict[str, Any] | None = None,
        package_name: str | None = None,
        is_lite: bool = False,
        enrichment: EnrichmentSources | None = None,
    ) -> InspectionGraphService:
        """Read one project snapshot and prepare the graph service.

        Args:
            project_path: The Kedro project root.
            env: The Kedro environment, honouring ``--env``.
            pipeline_name: Restrict the view to one registered pipeline, honouring
                ``--pipeline``.
            runtime_params: Typed parameter overrides from ``--params``.
            package_name: Project package used to identify imports in lite mode.
            is_lite: Whether missing project dependencies should be temporarily mocked.
            enrichment: Explicit fields supplied by the transitional live load.

        Raises:
            PipelineNotFoundError: If ``pipeline_name`` is not registered.
        """
        project_data = load_inspection_project_data(
            project_path,
            env=env,
            runtime_params=runtime_params,
            package_name=package_name,
            is_lite=is_lite,
        )
        if pipeline_name is not None:
            project_data = filter_inspection_project_data(project_data, pipeline_name)
        return cls.from_project_data(project_data, enrichment=enrichment)

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
