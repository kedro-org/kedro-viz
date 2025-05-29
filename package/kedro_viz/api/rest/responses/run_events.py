"""Response for run events API endpoint."""

import json
import logging
import uuid
from enum import Enum
from pathlib import Path
from typing import Any, Dict, List, Optional, Union

from pydantic import BaseModel, Field

from kedro_viz.constants import VIZ_METADATA_ARGS
from kedro_viz.launchers.utils import _find_kedro_project
from kedro_viz.utils import _hash_input_output, safe_int, convert_status_to_enum, calculate_pipeline_duration

logger = logging.getLogger(__name__)


class NodeStatus(str, Enum):
    """Enum representing the possible statuses of a node."""
    SUCCESS = "Success"
    FAIL = "Fail"


class DatasetStatus(str, Enum):
    """Enum representing the possible statuses of a dataset."""
    AVAILABLE = "Available"
    MISSING = "Missing"


class NodeInfo(BaseModel):
    """Information about a node."""
    status: NodeStatus = NodeStatus.SUCCESS
    duration_sec: float = 0.0
    error: Optional[str] = None


class DatasetErrorInfo(BaseModel):
    """Information about a dataset error."""
    message: str
    error_node: Optional[str] = None
    error_operation: Optional[str] = None


class DatasetInfo(BaseModel):
    """Information about a dataset."""
    name: str
    size_bytes: int = 0
    status: DatasetStatus = DatasetStatus.AVAILABLE
    error: Optional[Union[str, DatasetErrorInfo]] = None


class PipelineInfo(BaseModel):
    """Information about the pipeline run."""
    run_id: str = "default-run-id"
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    total_duration_sec: float = 0.0
    status: str = "completed"
    error: Optional[str] = None


class StructuredRunEventAPIResponse(BaseModel):
    """Format for structured run event endpoint response."""
    nodes: Dict[str, NodeInfo] = Field(default_factory=dict)
    datasets: Dict[str, DatasetInfo] = Field(default_factory=dict)
    pipeline: PipelineInfo = Field(default_factory=PipelineInfo)


def _update_dataset_info(
    datasets: Dict[str, DatasetInfo],
    node_id: str,
    dataset_name: str,
    size_bytes: Optional[int],
    status: str,
    overwrite: bool = False
) -> None:
    """Create or update DatasetInfo, controlling size overwrite."""
    status_enum = convert_status_to_enum(status, DatasetStatus.AVAILABLE)
    info = datasets.get(node_id)
    if not info:
        # Create new entry if missing
        datasets[node_id] = DatasetInfo(
            name=dataset_name,
            size_bytes=size_bytes or 0,
            status=status_enum
        )
    else:
        # Update name if empty
        if not info.name and dataset_name:
            info.name = dataset_name
        # Overwrite size if flagged or not set
        if size_bytes is not None and (overwrite or info.size_bytes == 0):
            info.size_bytes = size_bytes
        info.status = status_enum


def _extract_pipeline_metadata(events: List[Dict[str, Any]], info: PipelineInfo) -> None:
    """Populate PipelineInfo.start_time, end_time, status, and error."""
    # Find start
    start = next(
        (e for e in events if e.get("event") == "before_pipeline_run" and e.get("timestamp")),
        None
    )
    if start:
        info.start_time = start["timestamp"]
    # Find last pipeline event
    final = next(
        (e for e in reversed(events) if e.get("event") in {"after_pipeline_run", "on_pipeline_error"}),
        None
    )
    if final and "timestamp" in final:
        info.end_time = final["timestamp"]
    if final and final.get("event") == "on_pipeline_error":
        info.status = "failed"
        info.error = final.get("error")
    else:
        info.status = "completed"


def transform_events_to_structured_format(events: List[Dict[str, Any]]) -> StructuredRunEventAPIResponse:
    """Convert raw run events into structured API response."""
    nodes: Dict[str, NodeInfo] = {}
    datasets: Dict[str, DatasetInfo] = {}
    pipeline = PipelineInfo()

    _extract_pipeline_metadata(events, pipeline)

    # Process each event by type
    for event in events:
        event_type = event.get("event")
        node_id = event.get("node_id")
        if event_type == "after_node_run" and node_id:
            status = event.get("status", "Success")
            nodes[node_id] = NodeInfo(
                status=convert_status_to_enum(status, NodeStatus.SUCCESS),
                duration_sec=float(event.get("duration_sec", 0.0))
            )
        elif event_type == "on_node_error" and node_id:
            error_msg = event.get("error", "Unknown error")
            node = nodes.get(node_id)
            if node:
                node.status = NodeStatus.FAIL
                node.error = error_msg
            else:
                nodes[node_id] = NodeInfo(status=NodeStatus.FAIL, error=error_msg)
        elif event_type in {"after_dataset_loaded", "after_dataset_saved"} and node_id:
            size = safe_int(event.get("size_bytes", 0))
            _update_dataset_info(
                datasets,
                node_id,
                event.get("dataset", ""),
                size,
                event.get("status", "Available"),
                overwrite=(event_type == "after_dataset_saved")
            )
        elif event_type == "on_dataset_error":
            _process_dataset_error_event(datasets, nodes, event, pipeline)
        elif event_type == "on_pipeline_error":
            # Also process pipeline errors that contain dataset information as dataset errors
            if "dataset" in event:
                _process_dataset_error_event(datasets, nodes, event, pipeline)
            # If not already handled in metadata, mark failure
            elif not pipeline.error:
                pipeline.status = "failed"
                pipeline.error = event.get("error")

    # Assign unique run_id if default
    if pipeline.run_id == "default-run-id":
        pipeline.run_id = str(uuid.uuid4())
    # Compute total duration
    nodes_durations = {node_id: node.duration_sec for node_id, node in nodes.items()}
    pipeline.total_duration_sec = calculate_pipeline_duration(
        pipeline.start_time, 
        pipeline.end_time, 
        nodes_durations
    )

    return StructuredRunEventAPIResponse(nodes=nodes, datasets=datasets, pipeline=pipeline)


def _process_dataset_error_event(
    datasets: Dict[str, DatasetInfo], 
    nodes: Dict[str, NodeInfo],
    event: Dict[str, Any], 
    pipeline_info: PipelineInfo
) -> None:
    """Process on_dataset_error event.
    
    Args:
        datasets: Dictionary of dataset info objects
        nodes: Dictionary of node info objects
        event: Event data
        pipeline_info: Pipeline info object
    """
    dataset_name = event.get("dataset", "")
    node_id = event.get("node_id", "")
    node_name = event.get("node", "")
    
    # Update dataset status
    if dataset_name:
        dataset_id = _hash_input_output(dataset_name)
        error_message = event.get("error", "Dataset error")
        error_info = DatasetErrorInfo(
            message=error_message,
            error_node=node_name,
            error_operation=event.get("operation", "")
        )
        
        if dataset_id in datasets:
            datasets[dataset_id].status = DatasetStatus.MISSING
            datasets[dataset_id].error = error_info
        else:
            # Create a new dataset entry if it doesn't exist
            datasets[dataset_id] = DatasetInfo(
                name=dataset_name,
                status=DatasetStatus.MISSING,
                error=error_info
            )
    
    # Update node status if provided and found
    if node_id and node_id in nodes:
        nodes[node_id].status = NodeStatus.FAIL
        nodes[node_id].error = event.get("error", "Dataset error")
    elif node_name:
        # Try to find the node by name if node_id is not provided or not found
        for nid, node in nodes.items():
            if nid.endswith(node_name):
                node.status = NodeStatus.FAIL
                node.error = event.get("error", "Dataset error")
                break
    
    # Only set the main error information in pipeline info if not already set
    if not pipeline_info.error:
        pipeline_info.status = "failed"
        pipeline_info.error = event.get("error", "Dataset error")


def get_run_events_response() -> StructuredRunEventAPIResponse:
    """Get run events data for API endpoint in structured format.
    
    Returns:
        Structured API response object
    """
    try:
        kedro_project_path = _find_kedro_project(Path.cwd())
        if not kedro_project_path:
            logger.warning("Could not find a Kedro project to load kedro pipeline events file")
            return StructuredRunEventAPIResponse()
            
        pipeline_events_file_path = Path(
            f"{kedro_project_path}/{VIZ_METADATA_ARGS['path']}/kedro_pipeline_events.json"
        )
        if not pipeline_events_file_path.exists():
            logger.warning(f"Run events file {pipeline_events_file_path} not found")
            return StructuredRunEventAPIResponse()
            
        with pipeline_events_file_path.open("r", encoding="utf8") as file:
            events = json.load(file)
            
        return transform_events_to_structured_format(events)
    except Exception as exc:  # pragma: no cover
        logger.exception(f"Error loading run events: {exc}")
        return StructuredRunEventAPIResponse()