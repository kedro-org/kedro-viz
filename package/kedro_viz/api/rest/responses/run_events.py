"""Response for run status API endpoint."""

import json
import logging
import uuid
from enum import Enum
from pathlib import Path
from typing import Any, Optional, Union

from pydantic import BaseModel, Field

from kedro_viz.api.rest.responses.utils import (
    RunEventStatus,
    calculate_pipeline_duration,
    convert_status_to_enum,
)
from kedro_viz.constants import PIPELINE_EVENT_FULL_PATH
from kedro_viz.launchers.utils import _find_kedro_project
from kedro_viz.utils import _hash_input_output

logger = logging.getLogger(__name__)


class EventType(str, Enum):
    """Enum for supported event types in run logs."""

    BEFORE_PIPELINE_RUN = "before_pipeline_run"
    AFTER_PIPELINE_RUN = "after_pipeline_run"
    ON_PIPELINE_ERROR = "on_pipeline_error"
    AFTER_NODE_RUN = "after_node_run"
    ON_NODE_ERROR = "on_node_error"
    AFTER_DATASET_LOADED = "after_dataset_loaded"
    AFTER_DATASET_SAVED = "after_dataset_saved"


class BaseErrorInfo(BaseModel):
    """Base class for error information.

    Attributes:
        message: A string containing the error message.
        traceback: Optional traceback for debugging purposes.
    """

    message: str
    traceback: str = ""


class NodeErrorInfo(BaseErrorInfo):
    """Error information specific to a node execution failure."""

    pass


class DatasetErrorInfo(BaseErrorInfo):
    """Error information related to dataset loading or saving.

    Attributes:
        error_node: The name of the node that caused the dataset error.
        error_operation: The type of operation ("loading" or "saving").
    """

    error_node: Optional[str] = None
    error_operation: Optional[str] = None


class PipelineErrorInfo(BaseErrorInfo):
    """Error information specific to pipeline-level failures."""

    pass


class NodeInfo(BaseModel):
    """Metadata associated with a node execution.

    Attributes:
        duration: Time taken to execute the node in seconds.
        status: status of the node (e.g., SUCCESS, FAILED).
        error: Optional error information if execution failed.
    """

    duration: float = 0.0
    status: RunEventStatus = RunEventStatus.SUCCESS
    error: Optional[NodeErrorInfo] = None


class DatasetInfo(BaseModel):
    """Metadata associated with a dataset load/save operation.

    Attributes:
        name: Name of the dataset.
        size: Size of the dataset in bytes.
        status: status of the dataset operation.
        error: Optional error info if operation failed.
    """

    name: str
    size: int = 0
    status: RunEventStatus = RunEventStatus.SUCCESS
    error: Optional[DatasetErrorInfo] = None


class PipelineInfo(BaseModel):
    """Metadata related to the overall pipeline run.

    Attributes:
        run_id: Unique identifier for the pipeline run.
        start_time: ISO-formatted start timestamp.
        end_time: ISO-formatted end timestamp.
        duration: Total duration of the pipeline in seconds.
        status: Overall status of the pipeline.
        error: Optional error info if the pipeline failed.
    """

    run_id: str = "default-run-id"
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    duration: float = 0.0
    status: RunEventStatus = RunEventStatus.SUCCESS
    error: Optional[PipelineErrorInfo] = None


class RunStatusAPIResponse(BaseModel):
    """Structured response model for run status API endpoint.

    Attributes:
        nodes: Dictionary of node execution metadata.
        datasets: Dictionary of dataset metadata.
        pipeline: Metadata for the entire pipeline execution.
    """

    nodes: dict[str, NodeInfo] = Field(default_factory=dict)
    datasets: dict[str, DatasetInfo] = Field(default_factory=dict)
    pipeline: PipelineInfo = Field(default_factory=PipelineInfo)


def _create_dataset_info(
    datasets: dict[str, DatasetInfo],
    dataset_id: str,
    dataset_name: str,
    size: Optional[int],
    status: RunEventStatus,
) -> None:
    """Create new DatasetInfo entry for a dataset.

    Args:
        datasets: Dictionary of existing dataset info objects
        dataset_id: Unique identifier for the dataset
        dataset_name: Name of the dataset
        size: Size of the dataset in bytes
        status: Status of the dataset
    """
    datasets[dataset_id] = DatasetInfo(
        name=dataset_name,
        size=size or 0,
        status=status,
    )


def _update_dataset_info(
    datasets: dict[str, DatasetInfo],
    dataset_id: str,
    dataset_name: str,
    size: Optional[int],
    status: RunEventStatus,
    overwrite_size: bool = False,
) -> None:
    """Update existing DatasetInfo entry for a dataset.

    Args:
        datasets: Dictionary of existing dataset info objects
        dataset_id: Unique identifier for the dataset
        dataset_name: Name of the dataset
        size: Size of the dataset in bytes
        status: Status of the dataset
        overwrite_size: Whether to overwrite existing size information
    """
    dataset_info = datasets[dataset_id]

    if not dataset_info.name and dataset_name:
        dataset_info.name = dataset_name

    if size is not None and (overwrite_size or dataset_info.size == 0):
        dataset_info.size = size

    dataset_info.status = status


def _update_pipeline_info(
    events: list[dict[str, Any]], pipeline_info: PipelineInfo
) -> None:
    """Update pipeline start time, end time, and status from events.

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
        pipeline_info.start_time = start_event.get("timestamp")

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
            pipeline_info.end_time = end_event.get("timestamp")

        if end_event.get("event") == EventType.ON_PIPELINE_ERROR:
            pipeline_info.status = RunEventStatus.FAILED
            error_message = end_event.get("error", "Unknown pipeline error")
            traceback_message = end_event.get("traceback", "")
            pipeline_info.error = PipelineErrorInfo(
                message=error_message,
                traceback=traceback_message,
            )
        else:
            pipeline_info.status = RunEventStatus.SUCCESS


def _process_node_completion_event(
    event: dict[str, Any], nodes: dict[str, NodeInfo]
) -> None:
    """Process after_node_run event to update node information.

    Args:
        event: Event dictionary containing node completion data
        nodes: Dictionary of node info objects to update
    """
    node_id = event.get("node_id", "unknown_node")
    status = event.get("status", RunEventStatus.SUCCESS)
    duration = float(event.get("duration", 0.0))

    nodes[node_id] = NodeInfo(
        status=convert_status_to_enum(status, RunEventStatus.SUCCESS),
        duration=duration,
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
    traceback_message = event.get("traceback", "")

    error_info = NodeErrorInfo(
        message=error_message,
        traceback=traceback_message,
    )

    if node_id in nodes:
        nodes[node_id].status = RunEventStatus.FAILED
        nodes[node_id].error = error_info
    else:
        nodes[node_id] = NodeInfo(
            status=RunEventStatus.FAILED,
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
    # Convert size to int, defaulting to 0 if conversion fails
    try:
        size = int(event.get("size", 0))
    except (TypeError, ValueError):
        size = 0
    status = event.get("status", RunEventStatus.SUCCESS)
    event_type = event.get("event")

    # Overwrite size for save operations
    overwrite_size = event_type == EventType.AFTER_DATASET_SAVED

    # Convert status to enum
    status_enum = convert_status_to_enum(status, RunEventStatus.SUCCESS)
    # Create or update entry based on existence
    if node_id not in datasets:
        _create_dataset_info(
            datasets,
            node_id,
            dataset_name,
            size,
            status_enum,
        )
    else:
        _update_dataset_info(
            datasets,
            node_id,
            dataset_name,
            size,
            status_enum,
            overwrite_size,
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
    traceback_message = event.get("traceback", "")

    # Update dataset status if dataset name is provided
    if dataset_name:
        dataset_id = _hash_input_output(dataset_name)
        dataset_error_info = DatasetErrorInfo(
            message=error_message,
            error_node=node_name,
            error_operation=event.get("operation", ""),
            traceback=traceback_message,
        )

        if dataset_id in datasets:
            datasets[dataset_id].status = RunEventStatus.FAILED
            datasets[dataset_id].error = dataset_error_info
        else:
            datasets[dataset_id] = DatasetInfo(
                name=dataset_name,
                status=RunEventStatus.FAILED,
                error=dataset_error_info,
            )

    # Update node status
    node_error_info = NodeErrorInfo(
        message=error_message,
        traceback=traceback_message,
    )

    if node_id in nodes:
        nodes[node_id].status = RunEventStatus.FAILED
        nodes[node_id].error = node_error_info

    # Update pipeline error status if not already set
    if not pipeline_info.error:
        pipeline_info.status = RunEventStatus.FAILED
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
    node_durations = {node_id: node.duration for node_id, node in nodes.items()}
    pipeline_info.duration = calculate_pipeline_duration(
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

    # Update pipeline metadata first
    _update_pipeline_info(events, pipeline)

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
            return RunStatusAPIResponse()

        pipeline_events_file_path = PIPELINE_EVENT_FULL_PATH

        if not pipeline_events_file_path.exists():
            logger.warning(
                f"Run events file {pipeline_events_file_path} not found. It may be due to missing `kedro run`"
            )
            return RunStatusAPIResponse()

        with pipeline_events_file_path.open("r", encoding="utf8") as file:
            try:
                events = json.load(file)
            except json.JSONDecodeError as exc:
                logger.error(
                    f"Invalid JSON in run events file '{pipeline_events_file_path}': {exc}"
                )
                return RunStatusAPIResponse()

        return transform_events_to_structured_format(events)

    except (OSError, IOError) as exc:
        logger.error(f"Error reading run events file: {exc}")
        return RunStatusAPIResponse()
    except Exception as exc:
        logger.exception(f"Unexpected error loading run events: {exc}")
        return RunStatusAPIResponse()
