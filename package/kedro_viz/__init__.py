"""Kedro plugin for visualising a Kedro pipeline"""
import sys
import warnings

__version__ = "6.4.0"

class KedroVizPythonVersionWarning(UserWarning):
    """Custom class for warnings about incompatibilities with Python versions."""

    pass


if not sys.warnoptions:
    warnings.simplefilter("error", KedroVizPythonVersionWarning)

if sys.version_info >= (3, 11):
    warnings.warn(
        """Please be advised that Kedro Viz is not yet fully compatible with the Python version you are currently using.""",
        KedroVizPythonVersionWarning,
    )