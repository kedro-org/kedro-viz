"""Response for run events API endpoint."""

import json
import logging
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Any
from enum import Enum

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


def _update_dataset_info(datasets: Dict[str, DatasetInfo], node_id: str, dataset_name: str, size_bytes: Optional[int], status: str, overwrite_size: bool = False):
    """Helper to update or create DatasetInfo in the datasets dict."""
    # Convert status string to DatasetStatus enum
    if status:
        try:
            status_enum = DatasetStatus(status.capitalize())
        except ValueError:
            # Default to AVAILABLE if status is not a valid enum value
            status_enum = DatasetStatus.AVAILABLE
    else:
        status_enum = DatasetStatus.AVAILABLE
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


def transform_events_to_structured_format(events: List[Dict[str, Any]]) -> StructuredRunEventAPIResponse:
    """Transform raw events list to structured node-ID grouped format."""
    nodes: Dict[str, NodeInfo] = {}
    datasets: Dict[str, DatasetInfo] = {}
    pipeline_info = PipelineInfo()

    # Pipeline start and end time
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

    # Process all events
    for event in events:
        event_type = event.get("event")
        node_id = event.get("node_id")
        if event_type == "after_node_run":
            if not node_id:
                continue
            status = event.get("status", "Success").capitalize()
            try:
                node_status = NodeStatus(status)
            except ValueError:
                # Default to SUCCESS if status is not a valid enum value
                node_status = NodeStatus.SUCCESS
                
            nodes[node_id] = NodeInfo(
                status=node_status,
                duration_sec=float(event.get("duration_sec", 0.0)),
                error=None
            )
        elif event_type == "on_node_error":
            if not node_id:
                continue
            error = event.get("error", "Unknown error")
            if node_id in nodes:
                nodes[node_id].status = NodeStatus.FAIL
                nodes[node_id].error = error
            else:
                nodes[node_id] = NodeInfo(status=NodeStatus.FAIL, error=error)
        elif event_type in {"before_dataset_loaded", "before_dataset_saved"}:
            if not node_id:
                continue
            _update_dataset_info(
                datasets,
                node_id,
                event.get("dataset", ""),
                size_bytes=None,
                status=event.get("status", "Available")
            )
        elif event_type in {"after_dataset_loaded", "after_dataset_saved"}:
            if not node_id:
                continue
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

    # Generate a unique run ID if not already set
    if not pipeline_info.run_id or pipeline_info.run_id == "default-run-id":
        import uuid
        pipeline_info.run_id = str(uuid.uuid4())

    # Calculate pipeline duration
    if pipeline_info.start_time and pipeline_info.end_time:
        try:
            start_dt = datetime.fromisoformat(pipeline_info.start_time)
            end_dt = datetime.fromisoformat(pipeline_info.end_time)
            pipeline_info.total_duration_sec = (end_dt - start_dt).total_seconds()
            logger.info(f"Duration calculated from timestamps: {pipeline_info.total_duration_sec} seconds")
        except (ValueError, TypeError) as e:
            logger.warning(f"Error calculating pipeline duration: {e}")
            pipeline_info.total_duration_sec = sum(node.duration_sec for node in nodes.values())
    else:
        pipeline_info.total_duration_sec = sum(node.duration_sec for node in nodes.values())

    return StructuredRunEventAPIResponse(
        nodes=nodes,
        datasets=datasets,
        pipeline=pipeline_info
    )


def get_run_events_response() -> StructuredRunEventAPIResponse:
    """Get run events data for API endpoint in structured format."""
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

