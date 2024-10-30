"""`kedro_viz.api.rest.responses.save_responses` contains response classes
and utility functions for writing and saving REST endpoint responses to file system"""

import logging
from typing import Any

from kedro_viz.api.rest.responses.nodes import get_node_metadata_response
from kedro_viz.api.rest.responses.pipelines import get_pipeline_response
from kedro_viz.api.rest.responses.utils import get_encoded_response
from kedro_viz.data_access import data_access_manager
from kedro_viz.models.flowchart.node_metadata import DataNodeMetadata

logger = logging.getLogger(__name__)


def save_api_responses_to_fs(path: str, remote_fs: Any, is_all_previews_enabled: bool):
    """Saves all Kedro Viz API responses to a directory."""
    try:
        logger.debug(
            """Saving/Uploading api files to %s""",
            path,
        )

        main_path = f"{path}/api/main"
        nodes_path = f"{path}/api/nodes"
        pipelines_path = f"{path}/api/pipelines"

        if "file" in remote_fs.protocol:
            remote_fs.makedirs(path, exist_ok=True)
            remote_fs.makedirs(nodes_path, exist_ok=True)
            remote_fs.makedirs(pipelines_path, exist_ok=True)

        save_api_main_response_to_fs(main_path, remote_fs)
        save_api_node_response_to_fs(nodes_path, remote_fs, is_all_previews_enabled)
        save_api_pipeline_response_to_fs(pipelines_path, remote_fs)

    except Exception as exc:  # pragma: no cover
        logger.exception(
            "An error occurred while preparing data for saving. Error: %s", str(exc)
        )
        raise exc


def save_api_main_response_to_fs(main_path: str, remote_fs: Any):
    """Saves API /main response to a directory."""
    try:
        write_api_response_to_fs(main_path, get_pipeline_response(), remote_fs)
    except Exception as exc:  # pragma: no cover
        logger.exception("Failed to save default response. Error: %s", str(exc))
        raise exc


def save_api_pipeline_response_to_fs(pipelines_path: str, remote_fs: Any):
    """Saves API /pipelines/{pipeline} response to a directory."""
    for pipeline_id in data_access_manager.registered_pipelines.get_pipeline_ids():
        try:
            write_api_response_to_fs(
                f"{pipelines_path}/{pipeline_id}",
                get_pipeline_response(pipeline_id),
                remote_fs,
            )
        except Exception as exc:  # pragma: no cover
            logger.exception(
                "Failed to save pipeline data for pipeline ID %s. Error: %s",
                pipeline_id,
                str(exc),
            )
            raise exc


def save_api_node_response_to_fs(
    nodes_path: str, remote_fs: Any, is_all_previews_enabled: bool
):
    """Saves API /nodes/{node} response to a directory."""
    # Set if preview is enabled/disabled for all data nodes
    DataNodeMetadata.set_is_all_previews_enabled(is_all_previews_enabled)

    for node_id in data_access_manager.nodes.get_node_ids():
        try:
            write_api_response_to_fs(
                f"{nodes_path}/{node_id}",
                get_node_metadata_response(node_id),
                remote_fs,
            )
        except Exception as exc:  # pragma: no cover
            logger.exception(
                "Failed to save node data for node ID %s. Error: %s", node_id, str(exc)
            )
            raise exc


def write_api_response_to_fs(file_path: str, response: Any, remote_fs: Any):
    """Get encoded responses and writes it to a file"""
    encoded_response = get_encoded_response(response)

    with remote_fs.open(file_path, "wb") as file:
        file.write(encoded_response)
