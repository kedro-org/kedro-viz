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


from packaging.version import Version
from kedro_viz.constants import KEDRO_VERSION
if KEDRO_VERSION < Version("1.0.0"):
    raise RuntimeError(
        "Kedro Viz 12.0.0+ is incompatible with Kedro versions below 1.0.0. Please upgrade Kedro."
    )
try:  # pragma: no cover
    from kedro import __version__ as kedro_version_str  # pragma: no cover
    from packaging.version import Version  # pragma: no cover

    KEDRO_VERSION = Version(kedro_version_str)  # pragma: no cover

    if KEDRO_VERSION < Version("1.0.0"):  # pragma: no cover
        raise RuntimeError(  # pragma: no cover
            "Kedro Viz 12.0.0+ is incompatible with Kedro versions below 1.0.0. "
            "Please upgrade Kedro."
        )
except ImportError as err:  # pragma: no cover
    raise RuntimeError(
        "Kedro must be installed to use Kedro Viz."
    ) from err  # pragma: no cover
