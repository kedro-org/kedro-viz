"""`kedro_viz.integrations.deployment.s3_deployer` defines
deployment class for AWS S3"""

import logging

import fsspec

from kedro_viz import __version__
from kedro_viz.integrations.deployment.base_deployer import BaseDeployer

_S3_PROTOCOL = "s3"

logger = logging.getLogger(__name__)


class S3Deployer(BaseDeployer):
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
        super().__init__()
        self._region = region
        self._bucket_name = bucket_name
        self._path = f"{_S3_PROTOCOL}://{bucket_name}"
        self._fs = fsspec.filesystem(_S3_PROTOCOL)

    def deploy_and_get_url(self):
        """Deploy Kedro-viz to S3 and return its URL."""
        self.deploy()
        return f"http://{self._bucket_name}.s3-website.{self._region}.amazonaws.com"
