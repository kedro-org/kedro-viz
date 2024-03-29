"""`kedro_viz.integrations.deployment.local_deployer` defines
deployment class for local file system"""

import logging
from pathlib import Path

import fsspec

from kedro_viz import __version__
from kedro_viz.integrations.deployment.base_deployer import BaseDeployer

_BUILD_PATH = "build"
_FILE_PROTOCOL = "file"

logger = logging.getLogger(__name__)


class LocalDeployer(BaseDeployer):
    """A class to handle the creation of Kedro-viz build folder.

    Attributes:
        _build_path (str): build path name.
        _local_fs (fsspec.filesystem): Filesystem for local file protocol.
    """

    def __init__(self):
        super().__init__()
        self._path = Path(_BUILD_PATH)
        self._path.mkdir(parents=True, exist_ok=True)
        self._fs = fsspec.filesystem(_FILE_PROTOCOL)
