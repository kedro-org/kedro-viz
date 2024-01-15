"""`kedro_viz.api.rest.requests` defines REST request types."""
from pydantic import BaseModel


class AWSDeployerConfiguration(BaseModel):
    """Credentials for AWS Deployer."""

    region: str
    bucket_name: str
