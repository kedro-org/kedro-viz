"""Response for run status API endpoint."""

import json
import logging
import uuid
from enum import Enum
from pathlib import Path
from typing import Any, Optional, Union

from pydantic import BaseModel, Field

from kedro_viz.api.rest.responses.utils import (
    calculate_pipeline_duration,
    convert_status_to_enum,
)
from kedro_viz.constants import PIPELINE_EVENT_FULL_PATH
from kedro_viz.launchers.utils import _find_kedro_project
from kedro_viz.utils import _hash_input_output

logger = logging.getLogger(__name__)


# Constants for event types
class EventType(str, Enum):
    """Constants for event types."""

    BEFORE_PIPELINE_RUN = "before_pipeline_run"
    AFTER_PIPELINE_RUN = "after_pipeline_run"
    ON_PIPELINE_ERROR = "on_pipeline_error"
    AFTER_NODE_RUN = "after_node_run"
    ON_NODE_ERROR = "on_node_error"
    AFTER_DATASET_LOADED = "after_dataset_loaded"
    AFTER_DATASET_SAVED = "after_dataset_saved"


class PipelineStatus(str, Enum):
    """Constants for pipeline statuses."""

    SUCCESSFUL = "Successful"
    FAILED = "Failed"


class NodeStatus(str, Enum):
    """Enum representing the possible statuses of a node."""

    SUCCESSFUL = "Successful"
    FAILED = "Failed"


class DatasetStatus(str, Enum):
    """Enum representing the possible statuses of a dataset."""

    AVAILABLE = "Available"
    MISSING = "Missing"


class BaseErrorInfo(BaseModel):
    """Base class for error information."""

    message: str
    traceback: Optional[str] = None


class NodeErrorInfo(BaseErrorInfo):
    """Information about a node error."""

    pass


class DatasetErrorInfo(BaseErrorInfo):
    """Information about a dataset error."""

    error_node: Optional[str] = None
    error_operation: Optional[str] = None


class PipelineErrorInfo(BaseErrorInfo):
    """Information about a pipeline error."""

    pass


class NodeInfo(BaseModel):
    """Information about a node."""

    status: NodeStatus = NodeStatus.SUCCESSFUL
    duration_sec: float = 0.0
    error: Optional[NodeErrorInfo] = None


class DatasetInfo(BaseModel):
    """Information about a dataset."""

    name: str
    size_bytes: int = 0
    status: DatasetStatus = DatasetStatus.AVAILABLE
    error: Optional[DatasetErrorInfo] = None


class PipelineInfo(BaseModel):
    """Information about the pipeline run."""

    run_id: str = "default-run-id"
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    duration_sec: float = 0.0
    status: PipelineStatus = PipelineStatus.SUCCESSFUL
    error: Optional[PipelineErrorInfo] = None


class RunStatusAPIResponse(BaseModel):
    """Format for structured run status endpoint response."""

    nodes: dict[str, NodeInfo] = Field(default_factory=dict)
    datasets: dict[str, DatasetInfo] = Field(default_factory=dict)
    pipeline: PipelineInfo = Field(default_factory=PipelineInfo)


def _create_or_update_dataset_info(
    datasets: dict[str, DatasetInfo],
    dataset_id: str,
    dataset_name: str,
    size_bytes: Optional[int],
    status: PipelineStatus,
    overwrite_size: bool = False,
) -> None:
    """Create or update DatasetInfo, with optional size overwrite control.

    Args:
        datasets: Dictionary of existing dataset info objects
        dataset_id: Unique identifier for the dataset
        dataset_name: Name of the dataset
        size_bytes: Size of the dataset in bytes
        status: Status of the dataset
        overwrite_size: Whether to overwrite existing size information
    """
    status_enum = convert_status_to_enum(status, DatasetStatus.AVAILABLE)

    if dataset_id not in datasets:
        datasets[dataset_id] = DatasetInfo(
            name=dataset_name,
            size_bytes=size_bytes or 0,
            status=status_enum,
        )
        return

    # Update existing dataset info
    dataset_info = datasets[dataset_id]
    if not dataset_info.name and dataset_name:
        dataset_info.name = dataset_name

    if size_bytes is not None and (overwrite_size or dataset_info.size_bytes == 0):
        dataset_info.size_bytes = size_bytes

    dataset_info.status = status_enum


def _extract_pipeline_timing_and_status(
    events: list[dict[str, Any]], pipeline_info: PipelineInfo
) -> None:
    """Extract pipeline start time, end time, and status from events.

    Args:
        events: List of event dictionaries
        pipeline_info: Pipeline info object to update
    """
    # Find pipeline start event
    start_event = next(
        (
            event
            for event in events
            if (
                event.get("event") == EventType.BEFORE_PIPELINE_RUN
                and event.get("timestamp")
            )
        ),
        None,
    )
    if start_event:
        pipeline_info.start_time = start_event.get("timestamp", None)

    # Find most recent pipeline end event
    end_event = next(
        (
            event
            for event in reversed(events)
            if event.get("event")
            in {EventType.AFTER_PIPELINE_RUN, EventType.ON_PIPELINE_ERROR}
        ),
        None,
    )

    if end_event:
        if "timestamp" in end_event:
            pipeline_info.end_time = end_event.get("timestamp", None)

        if end_event.get("event") == EventType.ON_PIPELINE_ERROR:
            pipeline_info.status = PipelineStatus.FAILED
            error_message = end_event.get("error", "Unknown pipeline error")
            traceback_message = end_event.get("traceback")
            pipeline_info.error = PipelineErrorInfo(
                message=error_message,
                traceback=traceback_message,
            )
        else:
            pipeline_info.status = PipelineStatus.SUCCESSFUL


def _process_node_completion_event(
    event: dict[str, Any], nodes: dict[str, NodeInfo]
) -> None:
    """Process after_node_run event to update node information.

    Args:
        event: Event dictionary containing node completion data
        nodes: Dictionary of node info objects to update
    """
    node_id = event.get("node_id", "unknown_node")
    status = event.get("status", "Successful")
    duration = float(event.get("duration_sec", 0.0))

    nodes[node_id] = NodeInfo(
        status=convert_status_to_enum(status, NodeStatus.SUCCESSFUL),
        duration_sec=duration,
    )


def _process_node_error_event(
    event: dict[str, Any], nodes: dict[str, NodeInfo]
) -> None:
    """Process on_node_error event to update node error information.

    Args:
        event: Event dictionary containing node error data
        nodes: Dictionary of node info objects to update
    """
    node_id = event.get("node_id", "unknown_node")
    error_message = event.get("error", "Unknown error")
    traceback_message = event.get("traceback")

    error_info = NodeErrorInfo(
        message=error_message,
        traceback=traceback_message,
    )

    if node_id in nodes:
        nodes[node_id].status = NodeStatus.FAILED
        nodes[node_id].error = error_info
    else:
        nodes[node_id] = NodeInfo(
            status=NodeStatus.FAILED,
            error=error_info,
        )


def _process_dataset_event(
    event: dict[str, Any], datasets: dict[str, DatasetInfo]
) -> None:
    """Process dataset loaded/saved events to update dataset information.

    Args:
        event: Event dictionary containing dataset data
        datasets: Dictionary of dataset info objects to update
    """
    node_id = event.get("node_id", "unknown_dataset")
    dataset_name = event.get("dataset", "")
    # Convert size_bytes to int, defaulting to 0 if conversion fails
    try:
        size_bytes = int(event.get("size_bytes", 0))
    except (TypeError, ValueError):
        size_bytes = 0
    status = event.get("status", "Available")
    event_type = event.get("event")

    # Overwrite size for save operations
    overwrite_size = event_type == EventType.AFTER_DATASET_SAVED

    _create_or_update_dataset_info(
        datasets=datasets,
        dataset_id=node_id,
        dataset_name=dataset_name,
        size_bytes=size_bytes,
        status=status,
        overwrite_size=overwrite_size,
    )


def _process_dataset_error_event(
    event: dict[str, Any],
    datasets: dict[str, DatasetInfo],
    nodes: dict[str, NodeInfo],
    pipeline_info: PipelineInfo,
) -> None:
    """Process dataset error events to update dataset and node error information.

    Args:
        event: Event dictionary containing dataset error data
        datasets: Dictionary of dataset info objects to update
        nodes: Dictionary of node info objects to update
        pipeline_info: Pipeline info object to potentially update
    """
    dataset_name = event.get("dataset", "")
    node_id = event.get("node_id", "")
    node_name = event.get("node", "")
    error_message = event.get("error", "Dataset error")
    traceback_message = event.get("traceback")

    # Update dataset status if dataset name is provided
    if dataset_name:
        # Use consistent dataset ID: node_id if available, otherwise hash name
        dataset_id = node_id if node_id else _hash_input_output(dataset_name)
        dataset_error_info = DatasetErrorInfo(
            message=error_message,
            error_node=node_name,
            error_operation=event.get("operation", ""),
            traceback=traceback_message,
        )

        if dataset_id in datasets:
            datasets[dataset_id].status = DatasetStatus.MISSING
            datasets[dataset_id].error = dataset_error_info
        else:
            datasets[dataset_id] = DatasetInfo(
                name=dataset_name,
                status=DatasetStatus.MISSING,
                error=dataset_error_info,
            )

    # Update node status
    node_error_info = NodeErrorInfo(
        message=error_message,
        traceback=traceback_message,
    )

    if node_id in nodes:
        nodes[node_id].status = NodeStatus.FAILED
        nodes[node_id].error = node_error_info
    elif node_name:
        # Try to find node by name if node_id is not available
        for nid, node in nodes.items():
            if nid.endswith(node_name):
                node.status = NodeStatus.FAILED
                node.error = node_error_info
                break

    # Update pipeline error status if not already set
    if not pipeline_info.error:
        pipeline_info.status = PipelineStatus.FAILED
        pipeline_info.error = PipelineErrorInfo(
            message=error_message,
            traceback=traceback_message,
        )


def _finalize_pipeline_info(
    pipeline_info: PipelineInfo, nodes: dict[str, NodeInfo]
) -> None:
    """Finalize pipeline information by setting run_id and calculating duration.

    Args:
        pipeline_info: Pipeline info object to finalize
        nodes: Dictionary of node info objects for duration calculation
    """
    # Generate unique run_id if using default
    if pipeline_info.run_id == "default-run-id":
        pipeline_info.run_id = str(uuid.uuid4())

    # Calculate total pipeline duration
    node_durations = {node_id: node.duration_sec for node_id, node in nodes.items()}
    pipeline_info.duration_sec = calculate_pipeline_duration(
        pipeline_info.start_time,
        pipeline_info.end_time,
        node_durations,
    )


def transform_events_to_structured_format(
    events: list[dict[str, Any]],
) -> RunStatusAPIResponse:
    """Convert raw run events into structured API response format.

    Args:
        events: List of raw event dictionaries

    Returns:
        Structured API response object containing nodes, datasets, and pipeline info
    """
    nodes: dict[str, NodeInfo] = {}
    datasets: dict[str, DatasetInfo] = {}
    pipeline = PipelineInfo()

    # Extract pipeline metadata first
    _extract_pipeline_timing_and_status(events, pipeline)

    # Process events by type
    for event in events:
        event_type = event.get("event")

        if event_type == EventType.AFTER_NODE_RUN:
            _process_node_completion_event(event, nodes)
        elif event_type == EventType.ON_NODE_ERROR:
            _process_node_error_event(event, nodes)
        elif event_type in {
            EventType.AFTER_DATASET_LOADED,
            EventType.AFTER_DATASET_SAVED,
        }:
            _process_dataset_event(event, datasets)
        elif event_type == EventType.ON_PIPELINE_ERROR:
            # Handle pipeline errors that may contain dataset information
            if "dataset" in event:
                _process_dataset_error_event(event, datasets, nodes, pipeline)

    # Finalize pipeline information
    _finalize_pipeline_info(pipeline, nodes)

    return RunStatusAPIResponse(
        nodes=nodes,
        datasets=datasets,
        pipeline=pipeline,
    )


def get_run_status_response() -> RunStatusAPIResponse:
    """Get run status data for API endpoint in structured format.

    Returns:
        Structured API response object containing run status data

    Raises:
        FileNotFoundError: If the run events file cannot be found
        json.JSONDecodeError: If the run events file contains invalid JSON
    """
    try:
        kedro_project_path = _find_kedro_project(Path.cwd())
        if not kedro_project_path:
            logger.warning(
                "Could not find a Kedro project to load pipeline events file"
            )
            return RunStatusAPIResponse()

        pipeline_events_file_path = PIPELINE_EVENT_FULL_PATH

        if not pipeline_events_file_path.exists():
            logger.warning(f"Run events file {pipeline_events_file_path} not found")
            return RunStatusAPIResponse()

        with pipeline_events_file_path.open("r", encoding="utf8") as file:
            try:
                events = json.load(file)
            except json.JSONDecodeError as exc:
                logger.error(f"Invalid JSON in run events file: {exc}")
                return RunStatusAPIResponse()

        return transform_events_to_structured_format(events)

    except (OSError, IOError) as exc:
        logger.error(f"Error reading run events file: {exc}")
        return RunStatusAPIResponse()
    except Exception as exc:
        logger.exception(f"Unexpected error loading run events: {exc}")
        return RunStatusAPIResponse()
