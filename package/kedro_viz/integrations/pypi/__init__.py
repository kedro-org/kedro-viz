"""`kedro_viz.integrations.pypi` provides an interface to integrate Kedro-Viz with PyPI."""
import logging
from typing import Optional, Union

import click
import requests
from semver import VersionInfo

# PyPI endpoint to query latest Kedro-Viz version available
_PYPI_ENDPOINT = "https://pypi.python.org/pypi/kedro-viz/json"
logger = logging.getLogger(__name__)


def get_latest_version() -> VersionInfo:
    """Get latest Kedro-Viz version available on PyPI."""
    logger.info("Checking for update...")
    try:
        pypi_response = requests.get(_PYPI_ENDPOINT, timeout=30).json()
    except requests.exceptions.RequestException:
        return None
    return VersionInfo.parse(pypi_response["info"]["version"])
