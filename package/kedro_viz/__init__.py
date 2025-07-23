"""Kedro plugin for visualising a Kedro pipeline"""

import sys
import warnings

from packaging.version import Version

from kedro_viz.constants import KEDRO_VERSION

__version__ = "12.0.0"


class KedroVizPythonVersionWarning(UserWarning):
    """Custom class for warnings about incompatibilities with Python versions."""


if sys.version_info >= (3, 14):
    warnings.warn(
        """Please be advised that Kedro Viz is not yet fully
        compatible with the Python version you are currently using.""",
        KedroVizPythonVersionWarning,
    )


if KEDRO_VERSION < Version("1.0.0"):  # pragma: no cover
    raise RuntimeError(  # pragma: no cover
        """Kedro-Viz 12.0.0+ is incompatible with Kedro versions below 1.0.0.
            Please either upgrade Kedro to 1.0.0 or higher, or downgrade Kedro-Viz to 11.1.0 or earlier."""
    )
