"""`kedro_viz.api.rest.utils` contains utility functions used in the `kedro_viz.api.rest` package"""

import logging
from importlib.metadata import PackageNotFoundError
from typing import List

import packaging

from kedro_viz.constants import PACKAGE_REQUIREMENTS
from kedro_viz.models.metadata import PackageCompatibility

try:
    from importlib.metadata import version
except ImportError:  # pragma: no cover
    from importlib_metadata import version

logger = logging.getLogger(__name__)


def get_package_version(package_name: str):
    """Returns the version of the given package."""
    return version(package_name)  # pragma: no cover


def get_package_compatibilities() -> List[PackageCompatibility]:
    """Returns the package compatibilities information
    for the current python env."""
    package_compatibilities: List[PackageCompatibility] = []

    for package_name, package_info in PACKAGE_REQUIREMENTS.items():
        compatible_version = package_info["min_compatible_version"]
        try:
            package_version = get_package_version(package_name)
        except PackageNotFoundError:
            logger.warning(package_info["warning_message"])
            package_version = "0.0.0"

        is_compatible = packaging.version.parse(
            package_version
        ) >= packaging.version.parse(compatible_version)

        package_compatibilities.append(
            PackageCompatibility(
                package_name=package_name,
                package_version=package_version,
                is_compatible=is_compatible,
            )
        )
    return package_compatibilities
