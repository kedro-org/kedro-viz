"""`kedro_viz.api.rest.requests` defines REST request types."""

from pydantic import BaseModel


class DeployerConfiguration(BaseModel):
    """Credentials for Deployers."""

    platform: str
    are_datasets_previewable: bool = False
    endpoint: str
    bucket_name: str
