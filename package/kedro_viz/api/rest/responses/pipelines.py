"""`kedro_viz.api.rest.responses.pipelines` contains response classes 
and utility functions for the `/pipelines/*` REST endpoints"""

# pylint: disable=missing-class-docstring,invalid-name
import logging
from typing import Any
from kedro_viz.api.rest.responses.main import get_pipeline_response
from kedro_viz.api.rest.responses.common import write_api_response_to_fs
from kedro_viz.data_access import data_access_manager

logger = logging.getLogger(__name__)


def save_api_pipeline_response_to_fs(pipelines_path: str, remote_fs: Any):
    """Saves API /pipelines/{pipeline} response to a directory."""
    for pipelineId in data_access_manager.registered_pipelines.get_pipeline_ids():
        try:
            write_api_response_to_fs(
                f"{pipelines_path}/{pipelineId}",
                get_pipeline_response(pipelineId),
                remote_fs,
            )
        except Exception as exc:  # pragma: no cover
            logger.exception(
                "Failed to save pipeline data for pipeline ID %s. Error: %s",
                pipelineId,
                str(exc),
            )
            raise exc
