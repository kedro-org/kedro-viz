"""`kedro_viz.integrations.deployment.base_deployer` defines
creation of Kedro-viz build"""

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

    Methods:
        deploy_and_get_url(): The creation of Kedro-viz build folder.
    """

    def __init__(self):
        super().__init__()
        self._path = Path(_BUILD_PATH)
        self._fs = fsspec.filesystem(_FILE_PROTOCOL)
        self._fs.makedirs(self._path, exist_ok=True)
        self._fs.makedirs(self._path / "html", exist_ok=True)

    def deploy_and_get_url(self):
        """Copy Kedro-viz to local build folder and return its URL."""
        self.deploy()
        return self._path
