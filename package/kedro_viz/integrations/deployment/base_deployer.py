"""`kedro_viz.integrations.deployment.base_deployer` defines
an abstract class for all deployers"""

import abc
import json
import logging
import tempfile
from datetime import datetime
from pathlib import Path

from jinja2 import Environment, FileSystemLoader
from packaging.version import parse

from kedro_viz import __version__
from kedro_viz.api.rest.responses.save_responses import save_api_responses_to_fs
from kedro_viz.integrations.kedro import telemetry as kedro_telemetry

_HTML_DIR = Path(__file__).parent.parent.parent.absolute() / "html"
_METADATA_PATH = "api/deploy-viz-metadata"

logger = logging.getLogger(__name__)


class BaseDeployer(abc.ABC):
    """A class to handle the creation of Kedro-viz build.

    Attributes:
        _path (str): build path name.
        _fs (fsspec.filesystem): Filesystem for local/remote protocol.
    """

    def __init__(self):
        self._path = None
        self._fs = None

    def _upload_api_responses(self, is_all_previews_enabled: bool):
        """Write API responses to the build."""
        save_api_responses_to_fs(self._path, self._fs, is_all_previews_enabled)

    def _ingest_heap_analytics(self):
        """Ingest heap analytics to index file in the build."""
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

        self._write_heap_injected_index(html_content)

    def _write_heap_injected_index(self, html_content):
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_file_path = f"{temp_dir}/index.html"

            with open(temp_file_path, "w", encoding="utf-8") as temp_index_file:
                temp_index_file.write(html_content)

            self._fs.put(temp_file_path, f"{self._path}/", content_type="text/html")

    def _upload_static_files(self, html_dir: Path):
        """Upload static HTML files to Build."""
        logger.debug("Uploading static html files to %s.", self._path)
        try:
            self._fs.put(f"{str(html_dir)}/*", str(self._path), recursive=True)
            self._ingest_heap_analytics()
        except Exception as exc:  # pragma: no cover
            logger.exception("Upload failed: %s ", exc)
            raise exc

    def _upload_deploy_viz_metadata_file(self):
        """Create and write metadta file to api folder"""

        logger.debug(
            "Creating and Uploading deploy viz metadata file to %s.",
            self._path,
        )

        try:
            metadata = {
                "timestamp": datetime.utcnow().strftime("%d.%m.%Y %H:%M:%S"),
                "version": str(parse(__version__)),
            }
            with self._fs.open(f"{self._path}/{_METADATA_PATH}", "w") as metadata_file:
                metadata_file.write(json.dumps(metadata))
        except Exception as exc:  # pragma: no cover
            logger.exception("Upload failed: %s ", exc)
            raise exc

    def deploy(self, is_all_previews_enabled: bool = False):
        """Create and deploy all static files to local/remote file system"""

        self._upload_api_responses(is_all_previews_enabled)
        self._upload_static_files(_HTML_DIR)
        self._upload_deploy_viz_metadata_file()
