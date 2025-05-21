"""Response for run events API endpoint."""

import json
import logging
import uuid
from datetime import datetime
from enum import Enum
from pathlib import Path
from typing import Any, Dict, List, Optional, Union

from pydantic import BaseModel, Field

from kedro_viz.constants import VIZ_METADATA_ARGS
from kedro_viz.launchers.utils import _find_kedro_project

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


class DatasetInfo(BaseModel):
    """Information about a dataset."""
    name: str
    size_bytes: int = 0
    status: DatasetStatus = DatasetStatus.AVAILABLE


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


def _convert_status_to_enum(status: Optional[str], default_enum: Union[NodeStatus, DatasetStatus]) -> Union[NodeStatus, DatasetStatus]:
    """Convert a status string to the appropriate enum value.
    
    Args:
        status: The string status to convert
        default_enum: The default enum value to return if conversion fails
        
    Returns:
        The corresponding enum value
    """
    if not status:
        return default_enum
        
    try:
        if isinstance(default_enum, NodeStatus):
            return NodeStatus(status.capitalize())
        else:
            return DatasetStatus(status.capitalize())
    except ValueError:
        return default_enum


def _update_dataset_info(
    datasets: Dict[str, DatasetInfo], 
    node_id: str, 
    dataset_name: str, 
    size_bytes: Optional[int], 
    status: str, 
    overwrite_size: bool = False
) -> None:
    """Helper to update or create DatasetInfo in the datasets dict.
    
    Args:
        datasets: Dictionary of dataset info objects
        node_id: ID of the node to update
        dataset_name: Name of the dataset
        size_bytes: Size of the dataset in bytes
        status: Status of the dataset
        overwrite_size: Whether to overwrite existing size
    """
    status_enum = _convert_status_to_enum(status, DatasetStatus.AVAILABLE)
    
    if node_id not in datasets:
        datasets[node_id] = DatasetInfo(
            name=dataset_name,
            size_bytes=size_bytes or 0,
            status=status_enum
        )
    else:
        if not datasets[node_id].name and dataset_name:
            datasets[node_id].name = dataset_name
        if size_bytes is not None:
            if overwrite_size or datasets[node_id].size_bytes == 0:
                datasets[node_id].size_bytes = size_bytes
        datasets[node_id].status = status_enum


def _process_node_run_event(
    nodes: Dict[str, NodeInfo], 
    node_id: str, 
    event: Dict[str, Any]
) -> None:
    """Process after_node_run event.
    
    Args:
        nodes: Dictionary of node info objects
        node_id: ID of the node
        event: Event data
    """
    status = event.get("status", "Success")
    node_status = _convert_status_to_enum(status, NodeStatus.SUCCESS)
    
    nodes[node_id] = NodeInfo(
        status=node_status,
        duration_sec=float(event.get("duration_sec", 0.0)),
        error=None
    )


def _process_node_error_event(
    nodes: Dict[str, NodeInfo], 
    node_id: str, 
    event: Dict[str, Any]
) -> None:
    """Process on_node_error event.
    
    Args:
        nodes: Dictionary of node info objects
        node_id: ID of the node
        event: Event data
    """
    error = event.get("error", "Unknown error")
    if node_id in nodes:
        nodes[node_id].status = NodeStatus.FAIL
        nodes[node_id].error = error
    else:
        nodes[node_id] = NodeInfo(status=NodeStatus.FAIL, error=error)


def _process_dataset_event(
    datasets: Dict[str, DatasetInfo], 
    node_id: str, 
    event: Dict[str, Any], 
    event_type: str
) -> None:
    """Process dataset events.
    
    Args:
        datasets: Dictionary of dataset info objects
        node_id: ID of the node
        event: Event data
        event_type: Type of the event
    """
    if event_type in {"before_dataset_loaded", "before_dataset_saved"}:
        _update_dataset_info(
            datasets,
            node_id,
            event.get("dataset", ""),
            size_bytes=None,
            status=event.get("status", "Available")
        )
    elif event_type in {"after_dataset_loaded", "after_dataset_saved"}:
        try:
            size_bytes = int(event.get("size_bytes", 0))
        except (TypeError, ValueError):
            size_bytes = 0
        
        overwrite_size = event_type == "after_dataset_saved"
        _update_dataset_info(
            datasets,
            node_id,
            event.get("dataset", ""),
            size_bytes=size_bytes,
            status=event.get("status", "Available"),
            overwrite_size=overwrite_size
        )


def _calculate_pipeline_duration(
    pipeline_info: PipelineInfo,
    nodes: Dict[str, NodeInfo]
) -> float:
    """Calculate pipeline duration from timestamps or node durations.
    
    Args:
        pipeline_info: Pipeline information object
        nodes: Dictionary of node info objects
        
    Returns:
        Total duration in seconds
    """
    if pipeline_info.start_time and pipeline_info.end_time:
        try:
            start_dt = datetime.fromisoformat(pipeline_info.start_time)
            end_dt = datetime.fromisoformat(pipeline_info.end_time)
            duration = (end_dt - start_dt).total_seconds()
            logger.info(f"Duration calculated from timestamps: {duration} seconds")
            return duration
        except (ValueError, TypeError) as e:
            logger.warning(f"Error calculating pipeline duration: {e}")
    
    # Fallback to summing up node durations
    return sum(node.duration_sec for node in nodes.values())


def transform_events_to_structured_format(events: List[Dict[str, Any]]) -> StructuredRunEventAPIResponse:
    """Transform raw events list to structured node-ID grouped format.
    
    Args:
        events: List of event dictionaries
        
    Returns:
        Structured API response object
    """
    nodes: Dict[str, NodeInfo] = {}
    datasets: Dict[str, DatasetInfo] = {}
    pipeline_info = PipelineInfo()

    # Extract pipeline metadata first
    start_event = next((e for e in events if e.get("event") == "before_pipeline_run" and "timestamp" in e), None)
    if start_event:
        pipeline_info.start_time = start_event["timestamp"]

    pipeline_events = [e for e in events if e.get("event") in ["after_pipeline_run", "on_pipeline_error"]]
    if pipeline_events:
        last_event = pipeline_events[-1]
        if "timestamp" in last_event:
            pipeline_info.end_time = last_event["timestamp"]
        if last_event.get("event") == "on_pipeline_error":
            pipeline_info.status = "failed"
            pipeline_info.error = last_event.get("error")
        else:
            pipeline_info.status = "completed"

    # Process all node and dataset events
    for event in events:
        event_type = event.get("event")
        node_id = event.get("node_id")
        
        if not node_id:
            continue
            
        if event_type == "after_node_run":
            _process_node_run_event(nodes, node_id, event)
        elif event_type == "on_node_error":
            _process_node_error_event(nodes, node_id, event)
        elif event_type in {"before_dataset_loaded", "before_dataset_saved", 
                           "after_dataset_loaded", "after_dataset_saved"}:
            _process_dataset_event(datasets, node_id, event, event_type)

    # Generate a unique run ID if not already set
    if not pipeline_info.run_id or pipeline_info.run_id == "default-run-id":
        pipeline_info.run_id = str(uuid.uuid4())

    # Calculate pipeline duration
    pipeline_info.total_duration_sec = _calculate_pipeline_duration(pipeline_info, nodes)

    return StructuredRunEventAPIResponse(
        nodes=nodes,
        datasets=datasets,
        pipeline=pipeline_info
    )


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

