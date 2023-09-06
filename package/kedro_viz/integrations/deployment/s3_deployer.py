"""`kedro_viz.integrations.deployment.s3_deployer` defines
deployment class for S3"""

import logging
from pathlib import Path

import fsspec
from kedro.io.core import get_protocol_and_path

from kedro_viz.api.rest.responses import save_api_responses_to_fs

_HTML_DIR = Path(__file__).parent.parent.parent.absolute() / "html"

logger = logging.getLogger(__name__)


class S3Deployer:
    """Deployer class for AWS S3"""

    def __init__(self, region, bucket_name):
        self._region = region
        self._bucket_name = bucket_name
        self._protocol, self._path = get_protocol_and_path(bucket_name)
        self._remote_fs = fsspec.filesystem(self._protocol)

    def _upload_api_responses(self):
        save_api_responses_to_fs(self._bucket_name)

    def _upload_static_files(self):
        logger.debug("""Uploading static html files to %s.""", self._bucket_name)
        try:
            self._remote_fs.put(
                f"{str(_HTML_DIR)}/*", self._bucket_name, recursive=True
            )
        except Exception as exc:
            logger.exception("Upload failed: %s ", exc)
            raise exc

    def _deploy(self):
        self._upload_api_responses()
        self._upload_static_files()

    def get_deployed_url(self):
        """Returns an S3 URL where Kedro viz is deployed"""
        self._deploy()
        return f"http://{self._path}.s3-website.{self._region}.amazonaws.com"
