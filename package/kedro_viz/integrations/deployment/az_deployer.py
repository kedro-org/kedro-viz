import glob
import json
import logging
import mimetypes
from datetime import datetime
from pathlib import Path

try:
    from azure.storage.blob import ContentSettings
except ImportError:
    pass

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
        self._region = region
        self._bucket_name = bucket_name
        self._bucket_path = f"{_AZ_PROTOCOL}://$web"

        storage_options = {"account_name": bucket_name}

        self._remote_fs = fsspec.filesystem(_AZ_PROTOCOL, **storage_options)

    def _upload_api_responses(self):
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
        self._remote_fs.write_bytes(
            path=f"{self._bucket_path}/index.html",
            value=html_content,
            overwrite=True,
            **{"content_settings": ContentSettings(content_type="text/html")},
        )

    def _upload_static_files(self, html_dir: Path):
        logger.debug("Uploading static html files to %s.", self._bucket_path)
        try:
            file_list = glob.glob(f"{str(html_dir)}/**/*", recursive=True)

            for local_file_path in file_list:
                content_type, _ = mimetypes.guess_type(local_file_path)

                # ignore directories
                if content_type is None:
                    continue

                relative_path = local_file_path[len(str(html_dir)) + 1 :]
                remote_file_path = f"{self._bucket_path}/{relative_path}"

                # Read the contents of the local file
                with open(local_file_path, "rb") as file:
                    content = file.read()

                self._remote_fs.write_bytes(
                    path=remote_file_path,
                    value=content,
                    overwrite=True,
                    **{"content_settings": ContentSettings(content_type=content_type)},
                )

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
