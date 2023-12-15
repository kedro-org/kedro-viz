"""`kedro_viz.integrations.deployment.s3_deployer` defines
deployment class for AWS S3"""

import json
import logging
import tempfile
from datetime import datetime
from pathlib import Path

import fsspec
from jinja2 import Environment, FileSystemLoader
from packaging.version import parse

from kedro_viz import __version__
from kedro_viz.api.rest.responses import save_api_responses_to_fs
from kedro_viz.integrations.kedro import telemetry as kedro_telemetry

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

    def _ingest_heap_analytics(self):
        """Ingest heap analytics to index file in the build folder."""
        project_path = Path.cwd().absolute()
        heap_app_id = kedro_telemetry.get_heap_app_id(project_path)
        heap_user_identity = kedro_telemetry.get_heap_identity()
        should_add_telemetry = bool(heap_app_id) and bool(heap_user_identity)
        html_content = (_HTML_DIR / "index.html").read_text(encoding="utf-8")
        injected_head_content = []

        env = Environment(loader=FileSystemLoader(_HTML_DIR))

        if should_add_telemetry:
            logger.debug("Ingesting heap analytics.")
            telemetry_content = env.get_template("telemetry.html").render(
                heap_app_id=heap_app_id, heap_user_identity=heap_user_identity
            )
            injected_head_content.append(telemetry_content)

        injected_head_content.append("</head>")
        html_content = html_content.replace("</head>", "\n".join(injected_head_content))

        with tempfile.TemporaryDirectory() as temp_dir:
            temp_file_path = f"{temp_dir}/index.html"

            with open(temp_file_path, "w", encoding="utf-8") as temp_index_file:
                temp_index_file.write(html_content)

            self._remote_fs.put(temp_file_path, f"{self._bucket_path}/")

    def _upload_static_files(self, html_dir: Path):
        """Upload static HTML files to S3."""
        logger.debug("Uploading static html files to %s.", self._bucket_path)
        try:
            self._remote_fs.put(f"{str(html_dir)}/*", self._bucket_path, recursive=True)
            self._ingest_heap_analytics()
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
                "timestamp": datetime.utcnow().strftime("%d.%m.%Y %H:%M:%S"),
                "version": str(parse(__version__)),
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
