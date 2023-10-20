"""Kedro plugin for visualising a Kedro pipeline"""
import sys
import warnings

__version__ = "6.6.1"


class KedroVizPythonVersionWarning(UserWarning):
    """Custom class for warnings about incompatibilities with Python versions."""


if sys.version_info >= (3, 12):
    warnings.warn(
        """Please be advised that Kedro Viz is not yet fully
        compatible with the Python version you are currently using.""",
        KedroVizPythonVersionWarning,
    )
