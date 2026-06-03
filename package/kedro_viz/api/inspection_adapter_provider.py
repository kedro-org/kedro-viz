"""Serve graph and node-metadata reads from a Kedro inspection snapshot.

Backs ``/api/main``, ``/api/pipelines/{id}``, ``/api/nodes/{id}``, ``/api/run-status`` and the
static export when the adapter is active. The graph is built from the snapshot. In full mode it
is enriched with live-only fields and node metadata comes from the live objects; in lite mode
(no live project) metadata comes from a thin snapshot payload instead.
"""

from __future__ import annotations

import dataclasses
import logging
from contextlib import nullcontext
from pathlib import Path
from typing import TYPE_CHECKING, Any, Optional, Union, cast

from fastapi.responses import JSONResponse
from kedro.pipeline.node import Node as KedroNode

from kedro_viz.api.rest.responses.nodes import (
    NodeMetadataAPIResponse,
)
from kedro_viz.api.rest.responses.pipelines import (
    GraphAPIResponse,
    NodeExtrasAPIResponse,
    TaskNodeAPIResponse,
)
from kedro_viz.api.rest.responses.run_events import (
    RunStatusAPIResponse,
    get_run_status_response,
)
from kedro_viz.api.rest.responses.save_responses import save_api_responses_to_fs
from kedro_viz.integrations.kedro import node_ids
from kedro_viz.integrations.kedro.inspection.graph_builder import GraphBuilder
from kedro_viz.integrations.kedro.inspection.layers import extract_layers
from kedro_viz.integrations.kedro.inspection.snapshot_source import (
    lite_import_stubs,
    load_catalog_config,
    load_snapshot,
)
from kedro_viz.models.flowchart.node_metadata import (
    DataNodeMetadata,
    ParametersNodeMetadata,
    TaskNodeMetadata,
    TranscodedDataNodeMetadata,
)
from kedro_viz.models.flowchart.nodes import (
    DataNode,
    GraphNode,
    ParametersNode,
    TaskNode,
    TranscodedDataNode,
)
from kedro_viz.utils import _strip_transcoding, is_dataset_param

if TYPE_CHECKING:
    from kedro.inspection.models import ProjectSnapshot

    from kedro_viz.data_access.repositories import GraphNodesRepository

logger = logging.getLogger(__name__)


class InspectionAdapterProvider:
    """Serve graph + node metadata from a one-shot snapshot.

    The snapshot and layers are loaded once at construction and reused per request; with
    ``pipeline_name`` set, only that pipeline is visible.

    Node metadata resolves in two tiers: the **bridge** (``new_id -> live viz node``, full mode),
    then the **snapshot lookup** (``new_id -> thin payload``, lite mode), else 404.
    """

    def __init__(
        self,
        project_path: str | Path,
        env: str | None = None,
        pipeline_name: str | None = None,
        *,
        package_name: str | None = None,
        is_lite: bool = False,
        live_nodes: Optional["GraphNodesRepository"] = None,
    ):
        # In lite mode the project's deps may be missing; mock them while reading the snapshot
        # and catalog config so it can still be built. Full mode already has the deps loaded.
        stub_ctx = (
            lite_import_stubs(project_path, package_name) if is_lite else nullcontext()
        )
        with stub_ctx:
            snapshot = load_snapshot(project_path, env=env)
            catalog_config = load_catalog_config(project_path, env=env)
        if pipeline_name is not None:
            snapshot = self._filter_to_pipeline(snapshot, pipeline_name)
        layer_mapping = extract_layers(catalog_config)
        self._snapshot = snapshot
        self._builder = GraphBuilder(snapshot, layer_mapping)
        # Bridge → full-mode metadata; snapshot lookup → lite-mode metadata.
        self._metadata_bridge = self._build_metadata_bridge(live_nodes)
        self._snapshot_lookup = self._build_snapshot_lookup()

    # -- RuntimeDataProvider surface ----------------------------------------------------- #

    def get_pipeline_response(
        self, pipeline_id: Optional[str] = None
    ) -> Union[GraphAPIResponse, JSONResponse]:
        """Return the graph for ``pipeline_id`` (default pipeline when ``None``); 404 if unknown."""
        if pipeline_id is None:
            pipeline_id = self._builder.default_pipeline_id()
        if not self._builder.has_pipeline(pipeline_id):
            return JSONResponse(
                status_code=404, content={"message": "Invalid pipeline ID"}
            )
        response = self._builder.build(pipeline_id)
        if self._metadata_bridge:
            self._enrich_graph_with_bridge(response)
        return response

    def get_pipeline_ids(self) -> list[str]:
        """Pipeline IDs visible to this provider (honours ``--pipeline`` scope)."""
        return self._builder.pipeline_ids()

    def get_node_ids(self) -> list[str]:
        """Metadata-bearing node IDs: bridge keys in full mode, snapshot-lookup keys in lite mode.

        These drive the static export, so it writes one file per known node in either mode.
        """
        if self._metadata_bridge:
            return list(self._metadata_bridge)
        return list(self._snapshot_lookup)

    def get_node_metadata_response(
        self, node_id: str
    ) -> Union[NodeMetadataAPIResponse, JSONResponse]:
        """Return metadata for ``node_id``: bridge first (full mode), then snapshot lookup (lite).

        Full mode returns the same model as the live response. Lite mode returns a thin payload
        with live-only fields (code, preview, stats, parameter values) omitted. Unknown ID → 404;
        a known node with no metadata → ``{}``.
        """
        viz_node = self._metadata_bridge.get(node_id)
        if viz_node is not None:
            return self._live_metadata_response(viz_node)
        lite = self._snapshot_lookup.get(node_id)
        if lite is not None:
            return JSONResponse(content=lite)
        return JSONResponse(status_code=404, content={"message": "Invalid node ID"})

    @staticmethod
    def _live_metadata_response(
        viz_node: GraphNode,
    ) -> Union[NodeMetadataAPIResponse, JSONResponse]:
        if not viz_node.has_metadata():
            return JSONResponse(content={})
        # Return the same domain models as the live response builder; FastAPI serialises them at
        # the route. ``cast`` is for mypy only — no runtime effect.
        if isinstance(viz_node, TaskNode):
            return cast("NodeMetadataAPIResponse", TaskNodeMetadata(task_node=viz_node))
        if isinstance(viz_node, DataNode):
            return cast("NodeMetadataAPIResponse", DataNodeMetadata(data_node=viz_node))
        if isinstance(viz_node, TranscodedDataNode):
            return cast(
                "NodeMetadataAPIResponse",
                TranscodedDataNodeMetadata(transcoded_data_node=viz_node),
            )
        return cast(
            "NodeMetadataAPIResponse",
            ParametersNodeMetadata(parameters_node=viz_node),
        )

    def get_run_status_response(self) -> RunStatusAPIResponse:
        # Shared response builder; the run-status hook emits the same node-ID scheme as the
        # adapter graph, so IDs correlate without translation.
        return get_run_status_response()

    def save_api_responses_to_fs(
        self, path: str, remote_fs: Any, is_all_previews_enabled: bool
    ) -> None:
        # Export through this provider so the file set carries the adapter's node-ID scheme.
        save_api_responses_to_fs(
            path, remote_fs, is_all_previews_enabled, provider=self
        )

    # -- helpers ------------------------------------------------------------------------- #

    def _enrich_graph_with_bridge(self, response: GraphAPIResponse) -> None:
        """Overlay live-only fields (node_extras, resolved task parameters) onto the graph.

        Full mode only — the bridge is empty in lite mode, so the fields stay absent.
        """
        for graph_node in response.nodes:
            live_node = self._metadata_bridge.get(graph_node.id)
            if live_node is None:
                continue
            if live_node.node_extras is not None:
                graph_node.node_extras = NodeExtrasAPIResponse(
                    stats=live_node.node_extras.stats,
                    styles=live_node.node_extras.styles,
                )
            if isinstance(graph_node, TaskNodeAPIResponse) and isinstance(
                live_node, TaskNode
            ):
                graph_node.parameters = live_node.parameters

    @staticmethod
    def _filter_to_pipeline(
        snapshot: "ProjectSnapshot", pipeline_name: str
    ) -> "ProjectSnapshot":
        """Return ``snapshot`` with only ``pipeline_name`` visible (raises if it doesn't exist)."""
        filtered = [p for p in snapshot.pipelines if p.name == pipeline_name]
        if not filtered:
            available = sorted(p.name for p in snapshot.pipelines)
            raise ValueError(
                f"Pipeline {pipeline_name!r} not found in snapshot; available: {available}"
            )
        return dataclasses.replace(snapshot, pipelines=filtered)

    def _build_metadata_bridge(
        self, live_nodes: Optional["GraphNodesRepository"]
    ) -> dict[str, GraphNode]:
        """Build the ``{new_id -> live viz node}`` map for full-mode metadata.

        ``live_nodes`` is a repository to read (tests inject one) or ``None`` to use the populated
        module singleton. Empty in lite mode (singleton not populated) → metadata falls back to
        the snapshot lookup.
        """
        repository = live_nodes
        if repository is None:
            from kedro_viz.data_access import data_access_manager

            repository = data_access_manager.nodes
        bridge: dict[str, GraphNode] = {}
        for viz_node in repository.as_list():
            new_id = self._new_id_for(viz_node)
            if new_id is None:
                continue
            # Transcoded variants collapse to one id; keep the first (as_list is insertion-ordered).
            bridge.setdefault(new_id, viz_node)
        if not bridge:
            logger.info(
                "Inspection-adapter metadata bridge is empty — /api/nodes/{id} will return "
                "lite-mode (snapshot-only) payloads in this process; live-only fields "
                "(source code, resolved parameter values, previews, stats) are omitted."
            )
        return bridge

    @staticmethod
    def _new_id_for(viz_node: GraphNode) -> Optional[str]:
        """Return the new-scheme ID for a metadata-bearing viz node, or ``None`` to skip it."""
        if isinstance(viz_node, TaskNode):
            if viz_node.kedro_obj is None:
                return None
            # kedro_obj is always a KedroNode here (only DataNode holds a dataset).
            return node_ids.task_node_id_for(cast(KedroNode, viz_node.kedro_obj))
        if isinstance(viz_node, (DataNode, TranscodedDataNode, ParametersNode)):
            # dataset_node_id strips transcoding, so a variant maps to the same id from either side.
            return node_ids.dataset_node_id(viz_node.name)
        # ModularPipelineNode and anything else: not addressable via /api/nodes/{id}.
        return None

    def _build_snapshot_lookup(self) -> dict[str, dict[str, Any]]:
        """Build the lite-mode ``{new_id -> thin payload}`` map from the snapshot.

        One entry per node and io-ref, shaped like the live schemas but with live-only fields
        omitted: task → ``{inputs, outputs}``; data → ``{type, filepath}``; parameter →
        ``{parameters: {}}``. First write wins (``setdefault``).
        """
        lookup: dict[str, dict[str, Any]] = {}
        for pipeline in self._snapshot.pipelines:
            for node in pipeline.nodes:
                task_id = node_ids.task_node_id_for(node)
                lookup.setdefault(
                    task_id,
                    {"inputs": list(node.inputs), "outputs": list(node.outputs)},
                )
                for ref in [*node.inputs, *node.outputs]:
                    self._record_io_lite_metadata(lookup, ref)
        return lookup

    def _record_io_lite_metadata(
        self, lookup: dict[str, dict[str, Any]], ref: str
    ) -> None:
        """Record the lite payload for a single input/output reference (data or parameter)."""
        ds_id = node_ids.dataset_node_id(ref)
        if ds_id in lookup:
            return
        if is_dataset_param(ref):
            # Snapshot has parameter names, not values — {} means "unavailable in lite mode".
            lookup[ds_id] = {"parameters": {}}
            return
        stripped = _strip_transcoding(ref)
        dataset = self._snapshot.datasets.get(stripped)
        if dataset is None:
            # In-memory dataset (no catalog entry); only the type is meaningful.
            lookup[ds_id] = {"type": "kedro.io.MemoryDataset"}
            return
        payload: dict[str, Any] = {"type": dataset.type}
        if dataset.filepath:
            payload["filepath"] = dataset.filepath
        lookup[ds_id] = payload
