"""Serve graph responses from one Kedro inspection snapshot."""

from __future__ import annotations

import dataclasses
from contextlib import nullcontext
from pathlib import Path
from typing import TYPE_CHECKING, Any

from kedro_viz.api.rest.responses.pipelines import GraphAPIResponse
from kedro_viz.integrations.kedro.inspection.enrichment import (
    EnrichmentSources,
    enrich_graph_response,
)
from kedro_viz.integrations.kedro.inspection.graph_builder import GraphBuilder
from kedro_viz.integrations.kedro.inspection.snapshot_source import (
    _InspectionSession,
    lite_import_stubs,
)

if TYPE_CHECKING:
    from kedro.inspection.models import ProjectSnapshot


class PipelineNotFoundError(ValueError):
    """Raised when a requested pipeline is not present in the inspection snapshot."""


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
        sources = enrichment if enrichment is not None else EnrichmentSources()
        import_context = (
            lite_import_stubs(project_path, package_name) if is_lite else nullcontext()
        )
        with import_context:
            session = _InspectionSession(
                project_path, env=env, runtime_params=runtime_params
            )
            snapshot = session.snapshot()
            catalog_config = session.catalog_config()
            parameters = session.parameters()
            if pipeline_name is not None:
                snapshot = cls._filter_to_pipeline(snapshot, pipeline_name)
            builder = GraphBuilder(
                snapshot,
                catalog_config,
                parameters=parameters,
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

    @staticmethod
    def _filter_to_pipeline(
        snapshot: ProjectSnapshot, pipeline_name: str
    ) -> ProjectSnapshot:
        """Return a copy of the snapshot containing only the requested pipeline.

        Raises:
            PipelineNotFoundError: If ``pipeline_name`` is not registered.
        """
        matching = [
            pipeline
            for pipeline in snapshot.pipelines
            if pipeline.name == pipeline_name
        ]
        if not matching:
            available = sorted(pipeline.name for pipeline in snapshot.pipelines)
            raise PipelineNotFoundError(
                f"Pipeline {pipeline_name!r} not found in snapshot; available: {available}"
            )
        return dataclasses.replace(snapshot, pipelines=matching)
