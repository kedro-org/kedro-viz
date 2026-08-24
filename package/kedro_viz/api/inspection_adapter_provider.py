"""Serve graph responses from one Kedro inspection snapshot.

The snapshot is built once and reused for ``/api/main`` and ``/api/pipelines/{id}``.
Responses are enriched from same-ID live nodes with ``node_extras``, the abbreviated
``dataset_type`` used by frontend icons (for example,
``pandas.csv_dataset.CSVDataset`` rather than the snapshot's raw
``pandas.CSVDataset``), and, temporarily, task ``parameters`` (#2736). Enrichment does
not change graph topology.
"""

from __future__ import annotations

import dataclasses
from collections.abc import Mapping
from contextlib import nullcontext
from pathlib import Path
from typing import TYPE_CHECKING, Any

from fastapi.responses import JSONResponse

from kedro_viz.api.rest.responses.pipelines import (
    DataNodeAPIResponse,
    GraphAPIResponse,
    NodeExtrasAPIResponse,
    TaskNodeAPIResponse,
)
from kedro_viz.data_access import data_access_manager
from kedro_viz.integrations.kedro.inspection import GraphBuilder
from kedro_viz.integrations.kedro.inspection.snapshot_source import (
    _InspectionSession,
    lite_import_stubs,
)
from kedro_viz.models.flowchart.nodes import DataNode, TaskNode

if TYPE_CHECKING:
    from kedro.inspection.models import ProjectSnapshot

    from kedro_viz.data_access.repositories import GraphNodesRepository


class InspectionAdapterProvider:
    """Build graph responses from one inspection snapshot."""

    def __init__(
        self,
        project_path: str | Path,
        env: str | None = None,
        pipeline_name: str | None = None,
        *,
        runtime_params: dict[str, Any] | None = None,
        package_name: str | None = None,
        is_lite: bool = False,
        live_node_repository: GraphNodesRepository | None = None,
        layer_by_dataset: Mapping[str, str] | None = None,
    ) -> None:
        """Read the snapshot and prepare the graph builder.

        Args:
            project_path: The Kedro project root.
            env: The Kedro environment, honouring ``--env``.
            pipeline_name: Restrict the view to one registered pipeline, honouring
                ``--pipeline``. When ``None``, every registered pipeline is visible.
            runtime_params: Typed parameter overrides from ``--params``.
            package_name: The Kedro project package, used to identify project imports in lite
                mode.
            is_lite: Whether missing project dependencies should be temporarily mocked while
                reading the snapshot.
            live_node_repository: Repository the live-only fields are read from. Defaults to
                the populated process-wide repository; tests can inject their own.
            layer_by_dataset: Layers from the populated catalog. When supplied, this is
                authoritative so changes made by project hooks are preserved.

        Raises:
            ValueError: If ``pipeline_name`` is not a registered pipeline.
        """
        import_context = (
            lite_import_stubs(project_path, package_name) if is_lite else nullcontext()
        )
        with import_context:
            session = _InspectionSession(
                project_path, env=env, runtime_params=runtime_params
            )
            snapshot = session.snapshot()
            catalog_config = session.catalog_config()
            if pipeline_name is not None:
                snapshot = self._filter_to_pipeline(snapshot, pipeline_name)
            self._builder = GraphBuilder(
                snapshot,
                catalog_config,
                layer_by_dataset=layer_by_dataset,
            )
        self._live_node_repository = (
            live_node_repository
            if live_node_repository is not None
            else data_access_manager.nodes
        )

    def get_pipeline_response(
        self, pipeline_id: str | None = None
    ) -> GraphAPIResponse | JSONResponse:
        """Return the graph for one registered pipeline.

        Args:
            pipeline_id: The pipeline to render. When ``None``, the default pipeline is used.

        Returns:
            The graph response, or a 404 when ``pipeline_id`` is not registered.
        """
        if pipeline_id is None:
            pipeline_id = self._builder.default_pipeline_id()
        if not self._builder.has_pipeline(pipeline_id):
            return JSONResponse(
                status_code=404, content={"message": "Invalid pipeline ID"}
            )
        response = self._builder.build(pipeline_id)
        self._overlay_live_fields(response)
        return response

    def _overlay_live_fields(self, response: GraphAPIResponse) -> None:
        """Fill in the fields the snapshot cannot supply from the live project.

        Mutates ``response`` in place. The live repository keys nodes by the same IDs the
        adapter produces, so this is a direct lookup. A node the live project does not know
        about keeps what the builder gave it rather than being dropped.

        Args:
            response: The graph the builder produced for this view.
        """
        for graph_node in response.nodes:
            live_node = self._live_node_repository.get_node_by_id(graph_node.id)
            if live_node is None:
                continue
            if live_node.node_extras is not None:
                graph_node.node_extras = NodeExtrasAPIResponse(
                    stats=live_node.node_extras.stats,
                    styles=live_node.node_extras.styles,
                )
            if isinstance(graph_node, DataNodeAPIResponse):
                # The API exposes resolved types only for plain data nodes; transcoded and
                # parameter nodes use ``None``.
                graph_node.dataset_type = (
                    live_node.dataset_type if isinstance(live_node, DataNode) else None
                )
            if isinstance(graph_node, TaskNodeAPIResponse) and isinstance(
                live_node, TaskNode
            ):
                # TODO(#2736): resolve parameters from the config loader and drop this
                # overlay. Lite mode has no live node, so parameters are empty there.
                graph_node.parameters = live_node.parameters

    @staticmethod
    def _filter_to_pipeline(
        snapshot: ProjectSnapshot, pipeline_name: str
    ) -> ProjectSnapshot:
        """Return ``snapshot`` with only ``pipeline_name`` visible.

        Args:
            snapshot: The full project snapshot.
            pipeline_name: The registered pipeline to keep.

        Returns:
            A copy of the snapshot carrying that pipeline alone.

        Raises:
            ValueError: If the pipeline is not registered, listing what is available.
        """
        matching = [p for p in snapshot.pipelines if p.name == pipeline_name]
        if not matching:
            available = sorted(p.name for p in snapshot.pipelines)
            raise ValueError(
                f"Pipeline {pipeline_name!r} not found in snapshot; available: {available}"
            )
        return dataclasses.replace(snapshot, pipelines=matching)
