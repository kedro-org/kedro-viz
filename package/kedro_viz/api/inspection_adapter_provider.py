"""Inspection-adapter–backed :class:`RuntimeDataProvider`.

When the inspection adapter is enabled, ``/api/main``, ``/api/pipelines/{id}``,
``/api/nodes/{id}``, ``/api/run-status`` and the static-export path are all served by this
provider. The graph endpoints come from the inspection snapshot via
:class:`~kedro_viz.integrations.kedro.inspection.graph_builder.GraphBuilder`. Node metadata is
returned from live viz objects via the **metadata bridge** when a project is loaded, or from a
thin **snapshot lookup** when running in lite mode without a live project. The static export
walks ``get_pipeline_ids()`` / ``get_node_ids()`` here and re-uses the same response builders,
so the exported file set carries new-scheme IDs end-to-end. Run status is delegated to the
shared response builder; the ``hash_node`` hook uses the same node-ID scheme as the adapter
graph, so the IDs already correlate.
"""

from __future__ import annotations

import dataclasses
import logging
from pathlib import Path
from typing import Any, Optional, Union, cast

from fastapi.responses import JSONResponse
from kedro.pipeline.node import Node as KedroNode

from kedro_viz.api.rest.responses.nodes import (
    NodeMetadataAPIResponse,
)
from kedro_viz.api.rest.responses.pipelines import GraphAPIResponse
from kedro_viz.api.rest.responses.run_events import (
    RunStatusAPIResponse,
    get_run_status_response,
)
from kedro_viz.api.rest.responses.save_responses import save_api_responses_to_fs
from kedro_viz.integrations.kedro import node_ids
from kedro_viz.integrations.kedro.inspection.graph_builder import GraphBuilder
from kedro_viz.integrations.kedro.inspection.layers import extract_layers
from kedro_viz.integrations.kedro.inspection.snapshot_source import (
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

logger = logging.getLogger(__name__)


class InspectionAdapterProvider:
    """Serves graph + node-metadata reads from a one-shot Kedro inspection snapshot.

    The snapshot and layer mapping are loaded once at construction; subsequent requests reuse the
    same :class:`GraphBuilder`. When ``pipeline_name`` is set (i.e. ``kedro viz run --pipeline X``),
    only that pipeline is visible — mirroring how the live path filters ``data_access_manager``.

    Node-metadata resolution is two-tiered. The **metadata bridge** is a
    ``{new_id -> live viz node}`` dict built once at construction from a live
    ``GraphNodesRepository`` (defaults to the populated module singleton; tests can inject a
    fresh one). The **snapshot lookup** is a ``{new_id -> thin payload}`` dict built from the
    snapshot itself, so ``/api/nodes/{id}`` still answers in lite mode when no live project is
    loaded. Lookup order is bridge first, snapshot lookup second, 404 only if neither knows the
    ID — legacy ID schemes are deliberately not served here.
    """

    def __init__(
        self,
        project_path: str | Path,
        env: str | None = None,
        pipeline_name: str | None = None,
        *,
        live_nodes: Optional[Any] = None,
    ):
        snapshot = load_snapshot(project_path, env=env)
        if pipeline_name is not None:
            snapshot = self._filter_to_pipeline(snapshot, pipeline_name)
        catalog_config = load_catalog_config(project_path, env=env)
        layer_mapping = extract_layers(catalog_config)
        self._snapshot = snapshot
        self._builder = GraphBuilder(snapshot, layer_mapping)
        self._metadata_bridge = self._build_metadata_bridge(live_nodes)
        # Thin metadata payload keyed by new-scheme id, computed directly from the snapshot so
        # lite mode (no live project loaded → empty bridge) still answers /api/nodes/{id}.
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
        return self._builder.build(pipeline_id)

    def get_pipeline_ids(self) -> list[str]:
        """Pipeline IDs visible to this provider (honours ``--pipeline`` scope)."""
        return self._builder.pipeline_ids()

    def get_node_ids(self) -> list[str]:
        """Metadata-bearing node IDs.

        Full mode (bridge populated): bridge keys, so the exported file set covers exactly the
        live viz nodes. Lite mode (no live project, empty bridge): snapshot-lookup keys, so the
        export still writes a file per snapshot-known node.
        """
        if self._metadata_bridge:
            return list(self._metadata_bridge)
        return list(self._snapshot_lookup)

    def get_node_metadata_response(
        self, node_id: str
    ) -> Union[NodeMetadataAPIResponse, JSONResponse]:
        """Return metadata for the node carrying the new-scheme ``node_id``.

        Full mode: looks up the bridge and returns the same pydantic domain model the live
        response builder uses, so the payload is byte-identical to the live response.

        Lite mode: bridge is empty; falls back to a thin snapshot-backed payload built from
        :class:`~kedro.inspection.models.ProjectSnapshot`. The shape matches the live
        ``*APIResponse`` schemas, but live-only fields (``code``, ``parameters`` values,
        ``preview``, ``stats``, ``run_command``) are omitted — frontend treats absent fields
        as unavailable.

        Unknown ID returns 404; a node that exists but has no metadata returns ``{}`` (matches
        the live behaviour for free-input datasets, etc.).
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
        # The branches below return the same pydantic domain models the live response builder does;
        # FastAPI serialises them against ``response_model=NodeMetadataAPIResponse`` at the route.
        # ``cast`` keeps mypy happy without changing runtime behaviour.
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
        # Delegated to the shared response builder; ``hash_node`` emits the same node-ID scheme
        # the adapter graph uses, so the IDs in this payload correlate without translation.
        return get_run_status_response()

    def save_api_responses_to_fs(
        self, path: str, remote_fs: Any, is_all_previews_enabled: bool
    ) -> None:
        # The export uses this provider's surface, so the exported file set carries the
        # adapter's node-ID scheme end-to-end.
        save_api_responses_to_fs(
            path, remote_fs, is_all_previews_enabled, provider=self
        )

    # -- helpers ------------------------------------------------------------------------- #

    @staticmethod
    def _filter_to_pipeline(snapshot: Any, pipeline_name: str) -> Any:
        """Return ``snapshot`` with only ``pipeline_name`` visible (raises if it doesn't exist)."""
        filtered = [p for p in snapshot.pipelines if p.name == pipeline_name]
        if not filtered:
            available = sorted(p.name for p in snapshot.pipelines)
            raise ValueError(
                f"Pipeline {pipeline_name!r} not found in snapshot; available: {available}"
            )
        return dataclasses.replace(snapshot, pipelines=filtered)

    def _build_metadata_bridge(self, live_nodes: Optional[Any]) -> dict[str, GraphNode]:
        """Build the ``{new_id -> live viz node}`` map used by ``get_node_metadata_response``.

        ``live_nodes`` may be either a ``GraphNodesRepository`` (test injection) or ``None`` to
        read the populated module singleton — i.e. exactly what the live path uses. Returns an
        empty dict when the singleton hasn't been populated yet (lite mode), in which case
        ``get_node_metadata_response`` falls back to the snapshot lookup instead.
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
            # Transcoded variants collapse to one new id; keep the first one we see (deterministic
            # because `as_list` preserves insertion order).
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
            # ``TaskNode.kedro_obj`` is always a ``KedroNode`` (the field type union widens to
            # include ``AbstractDataset`` only on the GraphNode base, where DataNode lives).
            kedro_node = cast(KedroNode, viz_node.kedro_obj)
            return node_ids.task_node_id(
                kedro_node.name, list(kedro_node.inputs), list(kedro_node.outputs)
            )
        if isinstance(viz_node, (DataNode, TranscodedDataNode, ParametersNode)):
            # ``DataNode.name`` is the full dataset name; ``TranscodedDataNode.name`` is already
            # stripped of the ``@variant`` suffix by the live factory — ``dataset_node_id`` also
            # strips, so transcoded variants resolve to the same id from either side.
            return node_ids.dataset_node_id(viz_node.name)
        # ModularPipelineNode and anything else: not addressable via /api/nodes/{id}.
        return None

    def _build_snapshot_lookup(self) -> dict[str, dict[str, Any]]:
        """Build the lite-mode metadata payload keyed by new-scheme id.

        Walks every node and io-ref in the snapshot once and records the thin payload the
        frontend should see in lite mode. The shape matches the live ``*APIResponse`` schemas
        (so the frontend doesn't branch on mode), with live-only fields omitted:

        - **task** → ``{"inputs": [...], "outputs": [...]}``  (no source code, no resolved
          parameter values, no run_command — all require a live project)
        - **data** → ``{"type": "...", "filepath": "..."}``  (no preview, no stats)
        - **parameter** → ``{"parameters": {}}``  (the snapshot carries only names, not values)

        ``setdefault`` semantics: a given id is recorded once on first encounter; later
        appearances (e.g. an output of one node also being an input of another) don't overwrite.
        """
        lookup: dict[str, dict[str, Any]] = {}
        for pipeline in self._snapshot.pipelines:
            for node in pipeline.nodes:
                task_id = node_ids.task_node_id(
                    node.name, list(node.inputs), list(node.outputs)
                )
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
            # Snapshot carries parameter names, not resolved values — frontend treats {} as
            # "values unavailable in lite mode".
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
