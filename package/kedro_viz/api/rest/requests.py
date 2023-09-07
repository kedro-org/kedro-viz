"""`kedro_viz.api.rest.requests` defines REST request types."""
from pydantic import BaseModel


class S3DeployerCredentials(BaseModel):
    """Credentials for S3 Deployer."""

    region: str
    bucket_name: str
