"""Kedro plugin for visualising a Kedro pipeline"""

import sys
import warnings

__version__ = "10.0.0"


class KedroVizPythonVersionWarning(UserWarning):
    """Custom class for warnings about incompatibilities with Python versions."""


<<<<<<< HEAD
if sys.version_info >= (3, 14):
=======
if sys.version_info >= (3, 13):
>>>>>>> e91d156e6b37bd6f38aa4ce2bfd08095a4134239
    warnings.warn(
        """Please be advised that Kedro Viz is not yet fully
        compatible with the Python version you are currently using.""",
        KedroVizPythonVersionWarning,
    )
