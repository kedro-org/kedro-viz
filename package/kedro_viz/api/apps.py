# Copyright 2021 QuantumBlack Visual Analytics Limited
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
# EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
# OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND
# NONINFRINGEMENT. IN NO EVENT WILL THE LICENSOR OR OTHER CONTRIBUTORS
# BE LIABLE FOR ANY CLAIM, DAMAGES, OR OTHER LIABILITY, WHETHER IN AN
# ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF, OR IN
# CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
#
# The QuantumBlack Visual Analytics Limited ("QuantumBlack") name and logo
# (either separately or in combination, "QuantumBlack Trademarks") are
# trademarks of QuantumBlack. The License does not grant you any right or
# license to the QuantumBlack Trademarks. You may not use the QuantumBlack
# Trademarks or any confusingly similar mark as a trademark for your product,
# or use the QuantumBlack Trademarks in any other manner that might cause
# confusion in the marketplace, including but not limited to in advertising,
# on websites, or on software.
#
# See the License for the specific language governing permissions and
# limitations under the License.
"""`kedro_viz.api.app` defines the FastAPI app to serve Kedro data in a RESTful API.
This data could either come from a real Kedro project or a file.
"""
import json
from pathlib import Path

from fastapi import FastAPI
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from jinja2 import Environment, FileSystemLoader

from kedro_viz import __version__
from kedro_viz.integrations.kedro import telemetry as kedro_telemetry

from .router import router

_HTML_DIR = Path(__file__).parent.parent.absolute() / "html"


def _create_base_api_app() -> FastAPI:
    return FastAPI(
        title="Kedro-Viz API", description="REST API for Kedro Viz", version=__version__
    )


def create_api_app_from_project(project_path: Path) -> FastAPI:
    """Create an API from a real Kedro project by adding the router to the FastAPI app."""
    app = _create_base_api_app()
    app.include_router(router)
    app.mount("/static", StaticFiles(directory=_HTML_DIR / "static"), name="static")

    @app.get("/")
    async def index():
        heap_app_id = kedro_telemetry.get_heap_app_id(project_path)
        heap_user_identity = kedro_telemetry.get_heap_identity()
        should_add_telemetry = bool(heap_app_id) and bool(heap_user_identity)
        html_content = (_HTML_DIR / "index.html").read_text(encoding="utf-8")
        if should_add_telemetry:
            env = Environment(loader=FileSystemLoader(_HTML_DIR))
            telemetry_content = env.get_template("telemetry.html").render(
                heap_app_id=heap_app_id, heap_user_identity=heap_user_identity
            )
            html_content = html_content.replace("</head>", telemetry_content)
        return HTMLResponse(html_content)

    return app


def create_api_app_from_file(filepath: str) -> FastAPI:
    """Create an API from a json file."""
    app = _create_base_api_app()

    @app.get("/api/main", response_class=JSONResponse)
    async def main():
        return json.loads(Path(filepath).read_text())

    return app
