"""`kedro_viz.integrations.deployment.azure_deployer` defines
deployment class for Azure Blob Storage"""
import glob
import logging
import mimetypes
from pathlib import Path

from kedro_viz.integrations.deployment.base_deployer import BaseDeployer

try:
    from azure.storage.blob import ContentSettings
except ImportError:  # pragma: no cover
    pass

import fsspec

from kedro_viz import __version__

_AZ_PROTOCOL = "abfs"
logger = logging.getLogger(__name__)


class AzureDeployer(BaseDeployer):
    """A class to handle the deployment of Kedro-viz to AzureBlobStorage.

    Attributes:
        _endpoint (str): Azure endpoint of the hosted site.
        _bucket_name (str): Name of the AzureBlobStorage account.
        _path (str): Container path for the AzureBlobStorage account.
        _fs (fsspec.filesystem): Filesystem for Azure protocol.
    """

    def __init__(self, endpoint, bucket_name):
        """Initialize AzureBlobStorage with endpoint and bucket name.

        Args:
            endpoint (str): Azure endpoint of the hosted site.
            bucket_name (str): Name of the AzureBlobStorage account.
        """
        super().__init__()
        self._endpoint = endpoint
        self._bucket_name = bucket_name
        self._path = f"{_AZ_PROTOCOL}://$web"
        self._fs = fsspec.filesystem(_AZ_PROTOCOL, **{"account_name": bucket_name})

    def _write_heap_injected_index(self, html_content):
        self._fs.write_bytes(
            path=f"{self._path}/index.html",
            value=html_content,
            overwrite=True,
            **{"content_settings": ContentSettings(content_type="text/html")},
        )

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
                    overwrite=True,
                    **{"content_settings": ContentSettings(content_type=content_type)},
                )

            self._ingest_heap_analytics()

        except Exception as exc:  # pragma: no cover
            logger.exception("Upload failed: %s ", exc)
            raise exc
