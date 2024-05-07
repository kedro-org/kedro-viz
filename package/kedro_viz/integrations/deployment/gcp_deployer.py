"""`kedro_viz.integrations.deployment.gcp_deployer` defines
deployment class for Google Cloud Storage Bucket"""
import glob
import logging
import mimetypes
from pathlib import Path

import fsspec

from kedro_viz import __version__
from kedro_viz.integrations.deployment.base_deployer import BaseDeployer

_GCP_PROTOCOL = "gcs"
logger = logging.getLogger(__name__)


class GCPDeployer(BaseDeployer):
    """A class to handle the deployment of Kedro-viz to Google Cloud Storage Bucket.

    Attributes:
        _endpoint (str): GCP endpoint of the hosted site.
        _bucket_name (str): Name of the GCP storage bucket.
        _path (str): GCP protocol with bucket name.
        _fs (fsspec.filesystem): Filesystem for GCP protocol.
    """

    def __init__(self, endpoint, bucket_name):
        """Initialize GCPDeployer with endpoint and bucket name.

        Args:
            endpoint (str): GCP endpoint of the hosted site.
            bucket_name (str): Name of the GCP storage bucket.
        """
        super().__init__()
        self._endpoint = endpoint
        self._bucket_name = bucket_name
        self._path = f"{_GCP_PROTOCOL}://{bucket_name}"
        self._fs = fsspec.filesystem(_GCP_PROTOCOL)

    def _upload_static_files(self, html_dir: Path):
        logger.debug("Uploading static html files to %s.", self._path)
        try:
            file_list = glob.glob(f"{str(html_dir)}/**/*", recursive=True)

            for local_file_path in file_list:
                content_type, _ = mimetypes.guess_type(local_file_path)

                # ignore directories
                if content_type is None:  # pragma: no cover
                    continue

                relative_path = local_file_path[len(str(html_dir)) + 1 :]
                remote_file_path = f"{self._path}/{relative_path}"

                # Read the contents of the local file
                with open(local_file_path, "rb") as file:
                    content = file.read()

                self._fs.write_bytes(
                    path=remote_file_path,
                    value=content,
                    content_type=content_type,
                )

            self._ingest_heap_analytics()

        except Exception as exc:  # pragma: no cover
            logger.exception("Upload failed: %s ", exc)
            raise exc
