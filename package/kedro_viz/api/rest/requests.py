"""`kedro_viz.api.rest.requests` defines REST request types."""

from pydantic import BaseModel


class DeployerConfiguration(BaseModel):
    """Credentials for Deployers."""

    platform: str
    preview: bool
    endpoint: str
    bucket_name: str
