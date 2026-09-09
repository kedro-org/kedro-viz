"""Apply live-only fields to prepared node-metadata responses."""

from __future__ import annotations

from typing import cast

from kedro.io.core import AbstractDataset
from kedro.pipeline.node import Node as KedroNode

from kedro_viz.api.rest.responses.nodes import (
    DataNodeMetadataAPIResponse,
    NodeMetadataAPIResponse,
    ParametersNodeMetadataAPIResponse,
    TaskNodeMetadataAPIResponse,
    TranscodedDataNodeMetadataAPIReponse,
)
from kedro_viz.models.flowchart.live_node_metadata import (
    get_data_node_filepath,
    get_data_node_preview,
    get_data_node_preview_type,
    get_data_node_type,
    get_task_code,
    get_task_filepath,
    get_task_preview,
    get_transcoded_data_node_filepath,
    get_transcoded_data_node_original_type,
    get_transcoded_data_node_types,
)
from kedro_viz.models.flowchart.nodes import (
    DataNode,
    GraphNode,
    ParametersNode,
    TaskNode,
    TranscodedDataNode,
)


def is_compatible_live_node(
    response: NodeMetadataAPIResponse | None,
    live_node: GraphNode,
) -> bool:
    """Return whether a live node can enrich the prepared response."""
    if isinstance(response, TaskNodeMetadataAPIResponse):
        return isinstance(live_node, TaskNode) and isinstance(
            live_node.kedro_obj, KedroNode
        )
    if isinstance(response, DataNodeMetadataAPIResponse):
        return isinstance(live_node, DataNode) and isinstance(
            live_node.kedro_obj, AbstractDataset
        )
    if isinstance(response, ParametersNodeMetadataAPIResponse):
        return isinstance(live_node, ParametersNode) and isinstance(
            live_node.kedro_obj, AbstractDataset
        )
    return isinstance(response, TranscodedDataNodeMetadataAPIReponse) and isinstance(
        live_node, TranscodedDataNode
    )


def enrich_task_response(
    response: TaskNodeMetadataAPIResponse,
    live_node: TaskNode,
) -> None:
    """Overlay available live task fields without replacing static metadata."""
    response.parameters = live_node.parameters
    code = get_task_code(live_node)
    filepath = get_task_filepath(live_node)
    preview = get_task_preview(live_node)
    if code is not None:
        response.code = code
    if filepath is not None:
        response.filepath = filepath
    if preview is not None:
        response.preview = preview


def enrich_parameters_response(
    response: ParametersNodeMetadataAPIResponse,
    live_node: ParametersNode,
) -> None:
    """Overlay parameter values from the hook-aware live catalog."""
    if live_node.is_single_parameter():
        response.parameters = {live_node.parameter_name: live_node.parameter_value}
        return

    parameter_value = live_node.parameter_value
    if isinstance(parameter_value, dict):
        response.parameters = parameter_value


def enrich_data_response(
    response: DataNodeMetadataAPIResponse,
    live_node: DataNode,
    *,
    include_previews: bool,
) -> None:
    """Overlay available live dataset fields using explicit preview policy."""
    dataset = cast(AbstractDataset, live_node.kedro_obj)
    dataset.release()

    dataset_type = get_data_node_type(live_node)
    filepath = get_data_node_filepath(live_node)
    preview = get_data_node_preview(
        live_node,
        include_previews=include_previews,
    )
    preview_type = get_data_node_preview_type(
        live_node,
        include_previews=include_previews,
    )
    if dataset_type is not None:
        response.type = dataset_type
    if filepath is not None:
        response.filepath = filepath
    if preview is not None:
        response.preview = preview
    if preview_type is not None:
        response.preview_type = preview_type


def enrich_transcoded_response(
    response: TranscodedDataNodeMetadataAPIReponse,
    live_node: TranscodedDataNode,
) -> None:
    """Overlay complete live transcoded fields while preserving static fallbacks."""
    if isinstance(live_node.original_version, AbstractDataset):
        filepath = get_transcoded_data_node_filepath(live_node)
        if filepath is not None:
            response.filepath = filepath
        response.original_type = get_transcoded_data_node_original_type(live_node)

    if live_node.transcoded_versions and len(live_node.transcoded_versions) == len(
        response.transcoded_types
    ):
        response.transcoded_types = get_transcoded_data_node_types(live_node)
