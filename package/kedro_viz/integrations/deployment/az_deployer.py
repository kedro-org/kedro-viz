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
_AZ_PROTOCOL = "abfs"

logger = logging.getLogger(__name__)


class AZDeployer:
   
    def __init__(self, region, bucket_name):
        self._region=region
        self._bucket_name = bucket_name
        self._bucket_path = f"{_AZ_PROTOCOL}://$web"
        
        # storage_options = {"connection_string":"DefaultEndpointsProtocol=https;AccountName=shareableviz;AccountKey=+VYLVhjQiW7qC8l5DvjHJ6Af/0cG4w5sju3a1AGNzNpRDLKEXg90xt6J+PkluLAWN2GUNepE46/a+AStAejXqA==;EndpointSuffix=core.windows.net", 
        #                    "account_key":"+VYLVhjQiW7qC8l5DvjHJ6Af/0cG4w5sju3a1AGNzNpRDLKEXg90xt6J+PkluLAWN2GUNepE46/a+AStAejXqA=="}

        storage_options = {
            "account_name": bucket_name
        }

        self._remote_fs = fsspec.filesystem(_AZ_PROTOCOL, **storage_options)
        print(self._remote_fs.info(self._bucket_path))


    def _upload_api_responses(self):
        """Upload API responses to S3."""
        save_api_responses_to_fs(self._bucket_path, self._remote_fs)

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

            self._remote_fs.put(temp_file_path, f"{self._bucket_path}/", overwrite=True)

    def _upload_static_files(self, html_dir: Path):
        """Upload static HTML files to S3."""
        logger.debug("Uploading static html files to %s.", self._bucket_path)
        try:
            self._remote_fs.put(f"{str(html_dir)}/*", self._bucket_path, recursive=True, overwrite=True)
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
        return f"https://{self._bucket_name}.z13.web.core.windows.net/"
        