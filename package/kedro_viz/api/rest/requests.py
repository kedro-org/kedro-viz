"""`kedro_viz.api.rest.requests` defines REST request types."""

from pydantic import BaseModel


class DeployerConfiguration(BaseModel):
    """Credentials for Deployers."""

    platform: str
    is_all_previews_enabled: bool = False
    endpoint: str
    bucket_name: str


class UserPreference(BaseModel):
    """User preferences for Kedro Viz."""

    showDatasetPreviews: bool
