"""Kedro plugin for visualising a Kedro pipeline"""

import sys
import warnings

__version__ = "11.1.0"


class KedroVizPythonVersionWarning(UserWarning):
    """Custom class for warnings about incompatibilities with Python versions."""


if sys.version_info >= (3, 14):
    warnings.warn(
        """Please be advised that Kedro Viz is not yet fully
        compatible with the Python version you are currently using.""",
        KedroVizPythonVersionWarning,
    )


# Kedro version check
try:
    from kedro import __version__ as kedro_version_str
    from packaging.version import Version

    KEDRO_VERSION = Version(kedro_version_str)

    if KEDRO_VERSION < Version("1.0.0"):
        raise RuntimeError(
            "Kedro Viz 12.0.0+ is incompatible with Kedro versions below 1.0.0. "
            "Please upgrade Kedro."
        )
except ImportError as err:
    raise RuntimeError("Kedro must be installed to use Kedro Viz.") from err
