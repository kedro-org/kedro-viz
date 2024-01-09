"""`kedro_viz.integrations.deployment.base_deployer` defines
creation of Kedro-viz build"""

import click
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
from kedro_viz.server import load_and_populate_data

_HTML_DIR = Path(__file__).parent.parent.parent.absolute() / "html"
_METADATA_FILE_NAME = "deploy-viz-metadata"
_BUILD_PATH = "build"
_FILE_PROTOCOL = "file"

logger = logging.getLogger(__name__)


class BaseDeployer:
    """A class to handle the creation of Kedro-viz build folder.

    Attributes:
        _build_path (str): build path name.
        _local_fs (fsspec.filesystem): Filesystem for local file protocol.

    Methods:
        build(): The creation of Kedro-viz build folder.
    """

    def __init__(self):
        self._build_path = Path(_BUILD_PATH)
        self._local_fs = fsspec.filesystem(_FILE_PROTOCOL)

    def _copy_api_responses_to_build(self):
        """Write API responses to the build folder."""
        save_api_responses_to_fs(self._build_path)

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

            self._local_fs.put(temp_file_path, f"{self._build_path}/")

    def _copy_static_files_to_build(self, html_dir: Path):
        """Copy static files from Kedro-Viz app to the build directory."""
        try:
            # Create the build directory if not present
            build_path = Path(_BUILD_PATH)
            build_path.mkdir(parents=True, exist_ok=True)

            self._local_fs.makedirs(self._build_path, exist_ok=True)
            self._local_fs.cp(str(html_dir / "*"), str(build_path), recursive=True)
            self._ingest_heap_analytics()

        except Exception as exc:  # pragma: no cover
            logger.exception("Copying static files failed: %s ", exc)
            raise exc

    def _copy_deploy_viz_metadata_file_to_build(self):
        """Create and write metadta file to api folder"""

        logger.debug(
            "Creating and writing viz metadata file to %s.",
            self._build_path,
        )

        try:
            metadata = {
                "timestamp": datetime.utcnow().strftime("%d.%m.%Y %H:%M:%S"),
                "version": str(parse(__version__)),
            }

            metadata_dir = self._build_path / "api"
            metadata_dir.mkdir(
                parents=True, exist_ok=True
            )  # Create directory if it doesn't exist

            with self._local_fs.open(
                metadata_dir / _METADATA_FILE_NAME, "w"
            ) as metadata_file:
                metadata_file.write(json.dumps(metadata))

        except Exception as exc:  # pragma: no cover
            logger.exception("Creating metadata file failed: %s ", exc)
            raise exc

    def build(self):
        if not _HTML_DIR.exists():
            click.echo(
                click.style(
                    "ERROR: Directory containing Kedro Viz static files not found.",
                    fg="red",
                ),
            )
            return

        # Loads and populates data from underlying Kedro Project
        load_and_populate_data(Path.cwd(), ignore_plugins=True)

        self._copy_static_files_to_build(_HTML_DIR)
        self._copy_api_responses_to_build()
        self._copy_deploy_viz_metadata_file_to_build()
