"""`kedro_viz.integrations.deployment.s3_deployer` defines
deployment class for S3"""

import logging
import os
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
            # Iterate through the local directory and its subdirectories
            for root, _, files in os.walk(_HTML_DIR):
                for file_name in files:
                    file_path = os.path.join(root, file_name)
                    rel_path = os.path.relpath(file_path, _HTML_DIR)

                    # Skip .map files
                    if file_name.endswith(".map"):
                        continue

                    # Determine the S3 key (object key) based on the prefix and relative path
                    s3_key = os.path.join(self._bucket_name, rel_path).replace(
                        os.path.sep, "/"
                    )

                    # Create S3 directories if they don't exist
                    s3_dir = os.path.dirname(s3_key)
                    if not self._remote_fs.exists(s3_dir):
                        self._remote_fs.mkdir(s3_dir)

                    # Upload the file to S3
                    self._remote_fs.put(file_path, s3_key)

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
