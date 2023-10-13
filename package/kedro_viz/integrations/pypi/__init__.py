"""`kedro_viz.integrations.pypi` provides an interface to integrate Kedro-Viz with PyPI."""
import logging
from typing import Optional, Union

import click
import requests
from packaging.version import Version, parse

from kedro_viz import __version__

# PyPI endpoint to query latest Kedro-Viz version available
_PYPI_ENDPOINT = "https://pypi.python.org/pypi/kedro-viz/json"
logger = logging.getLogger(__name__)


def get_latest_version() -> Optional[Version]:
    """Get latest Kedro-Viz version available on PyPI."""
    logger.info("Checking for update...")
    try:
        pypi_response = requests.get(_PYPI_ENDPOINT, timeout=30).json()
    except requests.exceptions.RequestException:
        return None
    return parse(pypi_response["info"]["version"])


def is_running_outdated_version(
    installed_version: Version, latest_version: Optional[Version]
) -> bool:
    """Check if the user is running the latest version of Viz."""

    return latest_version is not None and installed_version < latest_version
