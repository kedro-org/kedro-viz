"""`kedro_viz.integrations.deployment.aws_deployer` defines
deployment class for AWS S3"""

import logging

import fsspec

from kedro_viz import __version__
from kedro_viz.integrations.deployment.base_deployer import BaseDeployer

_S3_PROTOCOL = "s3"

logger = logging.getLogger(__name__)


class AWSDeployer(BaseDeployer):
    """A class to handle the deployment of Kedro-viz to AWS S3.
    Attributes:
        _endpoint (str): AWS endpoint of the hosted site.
        _bucket_name (str): Name of the S3 bucket.
        _path (str): S3 protocol with bucket name.
        _fs (fsspec.filesystem): Filesystem for S3 protocol.
    """

    def __init__(self, endpoint, bucket_name):
        """Initialize S3Deployer with endpoint and bucket name.
        Args:
            endpoint (str): AWS endpoint of the hosted site.
            bucket_name (str): Name of the S3 bucket.
        """
        super().__init__()
        self._endpoint = endpoint
        self._bucket_name = bucket_name
        self._path = f"{_S3_PROTOCOL}://{bucket_name}"
        self._fs = fsspec.filesystem(_S3_PROTOCOL)
