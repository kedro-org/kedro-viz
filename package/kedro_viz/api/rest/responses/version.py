"""`kedro_viz.api.rest.responses.version` contains response classes
and utility functions for the `/version` REST endpoint"""

from pydantic import ConfigDict

from kedro_viz import __version__
from kedro_viz.api.rest.responses.base import BaseAPIResponse
from kedro_viz.integrations.pypi import get_latest_version, is_running_outdated_version


class VersionAPIResponse(BaseAPIResponse):
    """
    VersionAPIResponse is a subclass of BaseAPIResponse that represents the response structure for version API.

    Attributes:
        installed (str): The installed version of the Kedro Viz package.
        is_outdated (bool): Whether the installed version is outdated.
        latest (str): The latest available version of the Kedro Viz package.
    """

    installed: str
    is_outdated: bool
    latest: str
    model_config = ConfigDict(
        json_schema_extra={
            "installed": __version__,
            "is_outdated": False,
            "latest": "0.0.0",
        }
    )


def get_version_response():
    """API response for `/api/version`."""
    installed_version = str(__version__)
    latest_version = str(get_latest_version())
    is_outdated = is_running_outdated_version(installed_version, latest_version)

    return VersionAPIResponse(
        installed=installed_version,
        is_outdated=is_outdated,
        latest=latest_version,
    )
