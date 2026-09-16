"""Project-scoped services passed explicitly to Kedro-Viz consumers."""

from __future__ import annotations

from pathlib import Path
from typing import Any

from kedro_viz.integrations.kedro.inspection.enrichment import (
    EnrichmentSources,
    load_enrichment_sources,
)
from kedro_viz.integrations.kedro.inspection.graph_service import (
    InspectionGraphService,
)
from kedro_viz.integrations.kedro.inspection.snapshot_source import (
    filter_inspection_inputs,
    load_inspection_inputs,
)


class VizProjectContext:
    """Services prepared for one Kedro project load."""

    def __init__(self, graph: InspectionGraphService) -> None:
        self.graph = graph

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
    ) -> VizProjectContext:
        """Build project-scoped services from one inspection snapshot.

        Args:
            project_path: The Kedro project root.
            env: The Kedro environment, honouring ``--env``.
            pipeline_name: Restrict the context to one registered pipeline, honouring
                ``--pipeline``.
            runtime_params: Typed parameter overrides from ``--params``.
            package_name: Project package used to identify imports in lite mode.
            is_lite: Whether missing project dependencies should be temporarily mocked.
            enrichment: Explicit fields supplied by the transitional live load.

        Returns:
            A project context containing the prepared inspection graph service.

        Raises:
            PipelineNotFoundError: If ``pipeline_name`` is not registered.
        """
        inspection_inputs = load_inspection_inputs(
            project_path,
            env=env,
            runtime_params=runtime_params,
            package_name=package_name,
            is_lite=is_lite,
        )
        if pipeline_name is not None:
            inspection_inputs = filter_inspection_inputs(
                inspection_inputs, pipeline_name
            )
        enrichment_sources = (
            load_enrichment_sources(project_path) if enrichment is None else enrichment
        )
        return cls(
            graph=InspectionGraphService.from_inspection_inputs(
                inspection_inputs,
                enrichment=enrichment_sources,
            )
        )
