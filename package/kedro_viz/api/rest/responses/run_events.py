"""Response for run events API endpoint."""

import json
import logging
from pathlib import Path
from typing import Dict, List, Optional, Any, Union

from pydantic import BaseModel, Field

from kedro_viz.constants import VIZ_METADATA_ARGS
from kedro_viz.launchers.utils import _find_kedro_project

logger = logging.getLogger(__name__)

class RunEventAPIResponse(BaseModel):
    """Format for run event endpoint response."""
    events: List[Dict[str, Any]] = Field(default_factory=list, description="List of run events")


def get_run_events_response() -> Union[RunEventAPIResponse, Dict[str, List]]:
    """Get run events data for API endpoint.
    
    Returns:
        API response with run events data or an empty list if not available
    """

    try:
        kedro_project_path = _find_kedro_project(Path.cwd())

        if not kedro_project_path:
            logger.warning("Could not find a Kedro project to load kedro pipeline events file")
            return {"events": []}

        pipeline_events_file_path = Path(
            f"{kedro_project_path}/{VIZ_METADATA_ARGS['path']}/kedro_pipeline_events.json"
        )

        if not pipeline_events_file_path.exists():
            logger.warning(f"Run events file {pipeline_events_file_path} not found")
            return {"events": []}        


        with pipeline_events_file_path.open("r", encoding="utf8") as file:
            events = json.load(file)
        return {"events": events}    
    except Exception as exc:  # pragma: no cover
        logger.exception(f"Error loading run events: {exc}")     
        return {"events": []} 
    
    