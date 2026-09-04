"""Project-scoped services passed explicitly to Kedro-Viz consumers."""

from __future__ import annotations

from collections.abc import Mapping
from pathlib import Path
from typing import TYPE_CHECKING, Any

from kedro_viz.integrations.kedro.inspection.enrichment import EnrichmentSources
from kedro_viz.integrations.kedro.inspection.graph_service import (
    InspectionGraphService,
)
from kedro_viz.integrations.kedro.inspection.node_extras import load_node_extras
from kedro_viz.integrations.kedro.inspection.node_metadata_service import (
    NodeMetadataService,
)
from kedro_viz.integrations.kedro.inspection.run_status_service import RunStatusService
from kedro_viz.integrations.kedro.inspection.snapshot_source import (
    filter_inspection_project_data,
    load_inspection_project_data,
)
from kedro_viz.models.metadata import NodeExtras

if TYPE_CHECKING:
    from kedro_viz.models.flowchart.nodes import GraphNode


class VizProjectContext:
    """Services prepared for one Kedro project load."""

    def __init__(
        self,
        graph: InspectionGraphService,
        node_metadata: NodeMetadataService,
        run_status: RunStatusService,
    ) -> None:
        self.graph = graph
        self.node_metadata = node_metadata
        self.run_status = run_status

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
        node_extras_by_name: Mapping[str, NodeExtras] | None = None,
        live_nodes_by_id: Mapping[str, GraphNode] | None = None,
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
            node_extras_by_name: File-backed stats and styles already read by the live
                loader. When omitted, they are read without constructing a catalog.
            live_nodes_by_id: Optional live task and dataset nodes keyed by their
                existing graph IDs.

        Returns:
            A project context containing the prepared inspection services.

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
        prepared_node_extras = (
            load_node_extras(Path(project_path))
            if node_extras_by_name is None
            else node_extras_by_name
        )
        return cls(
            graph=InspectionGraphService.from_project_data(
                project_data,
                enrichment=enrichment,
            ),
            node_metadata=NodeMetadataService(
                project_data.snapshot,
                parameter_feed=project_data.parameter_feed,
                node_extras_by_name=prepared_node_extras,
                live_nodes_by_id=live_nodes_by_id,
            ),
            run_status=RunStatusService(project_path),
        )
