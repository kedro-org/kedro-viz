"""Response for run events API endpoint."""

import json
import logging
import re
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Any, Union, Set, Tuple

from pydantic import BaseModel, Field

from kedro_viz.constants import VIZ_METADATA_ARGS
from kedro_viz.launchers.utils import _find_kedro_project

logger = logging.getLogger(__name__)

class NodeInfo(BaseModel):
    """Information about a node."""
    status: str = "success"
    duration_sec: float = 0.0
    error: Optional[str] = None


class DatasetInfo(BaseModel):
    """Information about a dataset."""
    name: str
    size_bytes: int = 0
    status: str = "success"
    error: Optional[str] = None


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


def transform_events_to_structured_format(events: List[Dict[str, Any]]) -> StructuredRunEventAPIResponse:
    """Transform raw events list to structured node-ID grouped format.
    
    Args:
        events: List of raw events
    
    Returns:
        Structured data grouped by node IDs
    """
    nodes = {}
    datasets = {}
    pipeline_info = PipelineInfo()
    
    # Find pipeline start time
    start_events = [e for e in events if e.get("event") == "before_pipeline_run"]
    if start_events and "timestamp" in start_events[0]:
        pipeline_info.start_time = start_events[0].get("timestamp")
    
    # Find pipeline end time
    pipeline_events = [e for e in events if e.get("event") in ["after_pipeline_run", "on_pipeline_error"]]
    
    # If we have pipeline events, set the end time from the last one
    if pipeline_events:
        last_event = pipeline_events[-1]
        if "timestamp" in last_event:
            pipeline_info.end_time = last_event.get("timestamp")
            
            # Set status based on the event type
            if last_event.get("event") == "on_pipeline_error":
                pipeline_info.status = "failed"
                pipeline_info.error = last_event.get("error")
                
            else:
                pipeline_info.status = "completed"
    
    # Process all events to build the structured data
    for event in events:
        event_type = event.get("event")
        
        # Process node events
        if event_type == "after_node_run":
            node_id = event.get("node_id")
            if not node_id:  # Skip if missing node_id
                continue
                
            duration = float(event.get("duration_sec", 0.0))
            status = event.get("status", "success")
            
            nodes[node_id] = NodeInfo(
                status=status,
                duration_sec=duration,
                error=None
            )
        
        elif event_type == "on_node_error":
            node_id = event.get("node_id")
            if not node_id:  # Skip if missing node_id
                continue
                
            error = event.get("error", "Unknown error")
            
            if node_id in nodes:
                nodes[node_id].status = "failed"
                nodes[node_id].error = error
            else:
                nodes[node_id] = NodeInfo(
                    status="failed",
                    error=error
                )
        
        # Process dataset events
        elif event_type == "after_dataset_loaded":
            node_id = event.get("node_id")
            if not node_id:  # Skip if missing node_id
                continue
                
            dataset_name = event.get("dataset", "")
            try:
                size_bytes = int(event.get("size_bytes", 0))
            except (TypeError, ValueError):
                size_bytes = 0
            
            if node_id not in datasets:
                datasets[node_id] = DatasetInfo(
                    name=dataset_name,
                    size_bytes=size_bytes,
                    status="success"
                )
            else:
                # Make sure the object has the name set
                if not datasets[node_id].name and dataset_name:
                    datasets[node_id].name = dataset_name
                
                # Keep existing size_bytes if it's from a save event (which would be non-zero)
                if datasets[node_id].size_bytes == 0:
                    datasets[node_id].size_bytes = size_bytes
        
        elif event_type == "after_dataset_saved":
            node_id = event.get("node_id")
            if not node_id:  # Skip if missing node_id
                continue
                
            dataset_name = event.get("dataset", "")
            try:
                size_bytes = int(event.get("size_bytes", 0))
            except (TypeError, ValueError):
                size_bytes = 0
            
            if node_id not in datasets:
                datasets[node_id] = DatasetInfo(
                    name=dataset_name,
                    size_bytes=size_bytes
                )
            else:
                # Make sure the object has the name set
                if not datasets[node_id].name and dataset_name:
                    datasets[node_id].name = dataset_name
                
                # For save events, we always use the size_bytes (overriding load size)
                if size_bytes > 0:
                    datasets[node_id].size_bytes = size_bytes
    
    # Generate a unique run ID if not already set
    if not pipeline_info.run_id or pipeline_info.run_id == "default-run-id":
        import uuid
        pipeline_info.run_id = str(uuid.uuid4())
    
    if pipeline_info.start_time and pipeline_info.end_time:
        try:
            # Calculate directly from the timestamps
            start_dt = datetime.fromisoformat(pipeline_info.start_time)
            end_dt = datetime.fromisoformat(pipeline_info.end_time)
            pipeline_info.total_duration_sec = (end_dt - start_dt).total_seconds()
            
            # Log the calculation for verification
            logger.info(f"Duration calculated from timestamps: {pipeline_info.total_duration_sec} seconds")
        except (ValueError, TypeError) as e:
            logger.warning(f"Error calculating pipeline duration: {e}")
            # Fallback only if there's an actual error parsing timestamps
            pipeline_info.total_duration_sec = sum(node.duration_sec for node in nodes.values())
    else:
        # Fallback to sum of node durations if timestamps are not available
        pipeline_info.total_duration_sec = sum(node.duration_sec for node in nodes.values())
    
    return StructuredRunEventAPIResponse(
        nodes=nodes,
        datasets=datasets,
        pipeline=pipeline_info
    )


def get_run_events_response() -> StructuredRunEventAPIResponse:
    """Get run events data for API endpoint in structured format.
    
    Returns:
        API response with run events data in structured format
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

        # Load raw events from file
        with pipeline_events_file_path.open("r", encoding="utf8") as file:
            events = json.load(file)
        
        # Transform raw events to structured format
        return transform_events_to_structured_format(events)
            
    except Exception as exc:  # pragma: no cover
        logger.exception(f"Error loading run events: {exc}")
        return StructuredRunEventAPIResponse() 
    
    