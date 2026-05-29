"""`kedro_viz.api.rest.responses.save_responses` contains response classes
and utility functions for writing and saving REST endpoint responses to file system.

Phase 6.5: every read goes through a :class:`RuntimeDataProvider` (the same seam the runtime
routes use) rather than touching ``data_access_manager`` directly. Callers that don't pass an
explicit provider get whatever ``get_runtime_data_provider()`` returns — i.e. ``LiveDataProvider``
by default, ``InspectionAdapterProvider`` when the experimental flag is ON.
"""

from __future__ import annotations

import logging
from typing import TYPE_CHECKING, Any, Optional

from kedro_viz.api.rest.responses.utils import get_encoded_response
from kedro_viz.models.flowchart.node_metadata import DataNodeMetadata

if TYPE_CHECKING:
    from kedro_viz.api.data_provider import RuntimeDataProvider

logger = logging.getLogger(__name__)


def _resolve_provider(
    provider: Optional["RuntimeDataProvider"],
) -> "RuntimeDataProvider":
    """Return ``provider`` if given, else the process-wide active provider.

    Lazy import to break the circular ``save_responses`` ⇄ ``data_provider`` dependency.
    """
    if provider is not None:
        return provider
    from kedro_viz.api.data_provider import get_runtime_data_provider

    return get_runtime_data_provider()


def save_api_responses_to_fs(
    path: str,
    remote_fs: Any,
    is_all_previews_enabled: bool,
    provider: Optional["RuntimeDataProvider"] = None,
):
    """Saves all Kedro Viz API responses to a directory."""
    active = _resolve_provider(provider)
    try:
        logger.debug(
            """Saving/Uploading api files to %s""",
            path,
        )

        main_path = f"{path}/api/main"
        nodes_path = f"{path}/api/nodes"
        pipelines_path = f"{path}/api/pipelines"
        run_status_path = f"{path}/api/run-status"

        if "file" in remote_fs.protocol:
            remote_fs.makedirs(path, exist_ok=True)
            remote_fs.makedirs(nodes_path, exist_ok=True)
            remote_fs.makedirs(pipelines_path, exist_ok=True)

        save_api_main_response_to_fs(main_path, remote_fs, active)
        save_api_node_response_to_fs(
            nodes_path, remote_fs, is_all_previews_enabled, active
        )
        save_api_pipeline_response_to_fs(pipelines_path, remote_fs, active)
        save_api_run_status_response_to_fs(run_status_path, remote_fs, active)

    except Exception as exc:  # pragma: no cover
        logger.exception(
            "An error occurred while preparing data for saving. Error: %s", str(exc)
        )
        raise exc


def save_api_main_response_to_fs(
    main_path: str, remote_fs: Any, provider: "RuntimeDataProvider"
):
    """Saves API /main response to a directory."""
    try:
        write_api_response_to_fs(main_path, provider.get_pipeline_response(), remote_fs)
    except Exception as exc:  # pragma: no cover
        logger.exception("Failed to save default response. Error: %s", str(exc))
        raise exc


def save_api_pipeline_response_to_fs(
    pipelines_path: str, remote_fs: Any, provider: "RuntimeDataProvider"
):
    """Saves API /pipelines/{pipeline} response to a directory."""
    for pipeline_id in provider.get_pipeline_ids():
        try:
            write_api_response_to_fs(
                f"{pipelines_path}/{pipeline_id}",
                provider.get_pipeline_response(pipeline_id),
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
    nodes_path: str,
    remote_fs: Any,
    is_all_previews_enabled: bool,
    provider: "RuntimeDataProvider",
):
    """Saves API /nodes/{node} response to a directory."""
    # Set if preview is enabled/disabled for all data nodes
    DataNodeMetadata.set_is_all_previews_enabled(is_all_previews_enabled)

    for node_id in provider.get_node_ids():
        try:
            write_api_response_to_fs(
                f"{nodes_path}/{node_id}",
                provider.get_node_metadata_response(node_id),
                remote_fs,
            )
        except Exception as exc:  # pragma: no cover
            logger.exception(
                "Failed to save node data for node ID %s. Error: %s", node_id, str(exc)
            )
            raise exc


def save_api_run_status_response_to_fs(
    run_status_path: str, remote_fs: Any, provider: "RuntimeDataProvider"
):
    """Saves API /run-status response to a directory."""
    try:
        write_api_response_to_fs(
            run_status_path, provider.get_run_status_response(), remote_fs
        )
    except Exception as exc:  # pragma: no cover
        logger.exception("Failed to save run status response. Error: %s", str(exc))
        raise exc


def write_api_response_to_fs(file_path: str, response: Any, remote_fs: Any):
    """Get encoded responses and writes it to a file"""
    encoded_response = get_encoded_response(response)

    with remote_fs.open(file_path, "wb") as file:
        file.write(encoded_response)
