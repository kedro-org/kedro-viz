import os
import logging

from pydantic import ConfigDict
from kedro_viz.api.rest.responses.base import BaseAPIResponse
from kedro_viz.data_access import data_access_manager

logger = logging.getLogger(__name__)

class EnvironmentAPIResponse(BaseAPIResponse):
    """Response model for the /env endpoint."""
    env: str
    model_config = ConfigDict(
    json_schema_extra={
        "example": {
            "env": "local"
        }
    }
)
    
def get_env_response() -> EnvironmentAPIResponse:
    try:
        env = data_access_manager.env
    except Exception as e:
        logger.error("Error getting environment: %s", e)

        # Fallback to read the environment variable
        env = os.environ.get("KEDRO_ENV", "local")

    return EnvironmentAPIResponse(env=env)