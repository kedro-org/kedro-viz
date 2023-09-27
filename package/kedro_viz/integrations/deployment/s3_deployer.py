"""`kedro_viz.integrations.deployment.s3_deployer` defines
deployment class for AWS S3"""

import json
import logging
from datetime import datetime
from pathlib import Path

import fsspec
from semver import VersionInfo

from kedro_viz import __version__
from kedro_viz.api.rest.responses import save_api_responses_to_fs

_HTML_DIR = Path(__file__).parent.parent.parent.absolute() / "html"
_METADATA_PATH = "api/deploy-viz-metadata"
_S3_PROTOCOL = "s3"

logger = logging.getLogger(__name__)


class S3Deployer:
    """A class to handle the deployment of Kedro-viz to AWS S3.

    Attributes:
        _region (str): AWS region to deploy to.
        _bucket_name (str): Name of the S3 bucket.
        _bucket_path (str): S3 protocol with bucket name.
        _remote_fs (fsspec.filesystem): Filesystem for S3 protocol.

    Methods:
        deploy_and_get_url(): Deploy Kedro-viz to S3 and return its URL.
    """

    def __init__(self, region, bucket_name):
        """Initialize S3Deployer with region and bucket name.

        Args:
            region (str): AWS region to deploy to.
            bucket_name (str): Name of the S3 bucket.
        """
        self._region = region
        self._bucket_name = bucket_name
        self._bucket_path = f"{_S3_PROTOCOL}://{bucket_name}"
        self._remote_fs = fsspec.filesystem(_S3_PROTOCOL)

    def _upload_api_responses(self):
        """Upload API responses to S3."""
        save_api_responses_to_fs(self._bucket_path)

    def _upload_static_files(self, html_dir: Path):
        """Upload static HTML files to S3."""
        logger.debug("Uploading static html files to %s.", self._bucket_path)
        try:
            self._remote_fs.put(f"{str(html_dir)}/*", self._bucket_path, recursive=True)
        except Exception as exc:  # pragma: no cover
            logger.exception("Upload failed: %s ", exc)
            raise exc

    def _upload_deploy_viz_metadata_file(self):
        logger.debug(
            "Creating and Uploading deploy viz metadata file to %s.",
            self._bucket_path,
        )

        try:
            metadata = {
                "timestamp": datetime.now().strftime("%d.%m.%Y %H:%M:%S"),
                "version": str(VersionInfo.parse(__version__)),
            }
            with self._remote_fs.open(
                f"{self._bucket_path}/{_METADATA_PATH}", "w"
            ) as metadata_file:
                metadata_file.write(json.dumps(metadata))
        except Exception as exc:  # pragma: no cover
            logger.exception("Upload failed: %s ", exc)
            raise exc

    def _deploy(self):
        self._upload_api_responses()
        self._upload_static_files(_HTML_DIR)
        self._upload_deploy_viz_metadata_file()

    def deploy_and_get_url(self):
        """Deploy Kedro-viz to S3 and return its URL."""
        self._deploy()
        return f"http://{self._bucket_name}.s3-website.{self._region}.amazonaws.com"
