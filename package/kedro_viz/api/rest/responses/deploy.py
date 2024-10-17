"""`kedro_viz.api.rest.responses.deploy` contains response classes
and utility functions for the `/deploy` REST endpoint"""

import logging
from typing import Any

from kedro_viz.api.rest.responses.nodes import save_api_node_response_to_fs
from kedro_viz.api.rest.responses.pipelines import (
    save_api_main_response_to_fs,
    save_api_pipeline_response_to_fs,
)

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
