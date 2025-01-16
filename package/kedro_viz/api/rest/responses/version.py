"""`kedro_viz.api.rest.responses.version` contains response classes
and utility functions for the `/version` REST endpoint"""

from kedro_viz import __version__
from pydantic import BaseModel, ConfigDict
from kedro_viz.api.rest.responses.base import BaseAPIResponse

class VersionAPIResponse(BaseAPIResponse):
    """
    VersionAPIResponse is a subclass of BaseAPIResponse that represents the response structure for version API.

    Attributes:
        installed (str): The installed version of the Kedro Viz package.
        isOutdated (bool): Whether the installed version is outdated.
        latest (str): The latest available version of the Kedro Viz package.
    """

    installed: str
    isOutdated: bool
    latest: str
    model_config = ConfigDict(
        json_schema_extra={
            "installed": __version__,
            "isOutdated": False,  
            "latest": "0.5.0" # how do i check the latest version?
        }
    )

def get_version_response():
    """API response for `/api/version`."""
    installed_version = __version__
    latest_version = "0.5.0"  # how do i check the latest version?
    is_outdated = installed_version != latest_version 

    return VersionAPIResponse(
        installed=installed_version,
        isOutdated=is_outdated,
        latest=latest_version
    )