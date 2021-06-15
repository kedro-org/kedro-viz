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
"""`kedro_viz.server` provides utilities to launch a webserver for Kedro pipeline visualisation."""
import webbrowser
from pathlib import Path
from typing import Dict

import uvicorn
from kedro.io import DataCatalog
from kedro.pipeline import Pipeline

from kedro_viz.api import apps, responses
from kedro_viz.data_access import DataAccessManager, data_access_manager
from kedro_viz.integrations.kedro import data_loader as kedro_data_loader
from kedro_viz.services import layers_services

_DEFAULT_HOST = "0.0.0.0"
_DEFAULT_PORT = 4141


def populate_data(
    data_access_manager: DataAccessManager,
    catalog: DataCatalog,
    pipelines: Dict[str, Pipeline],
):  # pylint: disable=redefined-outer-name
    """Populate data repositories. Should be called once on application start
    if creatinge an api app from project.
    """
    data_access_manager.add_catalog(catalog)
    data_access_manager.add_pipelines(pipelines)
    data_access_manager.set_layers(
        layers_services.sort_layers(
            data_access_manager.nodes.as_dict(),
            data_access_manager.node_dependencies,
        )
    )


def run_server(
    host: str = _DEFAULT_HOST,
    port: int = _DEFAULT_PORT,
    browser: bool = None,
    load_file: str = None,
    save_file: str = None,
    pipeline_name: str = None,
    env: str = None,
    project_path: str = None,
):
    """Run a uvicorn server with a FastAPI app that either launches API response data from a file
    or from reading data from a real Kedro project.

    Args:
        host: the host to launch the webserver
        port: the port to launch the webserver
        browser: whether to open the default browser automatically
        load_file: if a valid JSON containing API response data is provided,
            the API of the server is created from the JSON.
        save_file: if provided, the data returned by the API will be saved to a file.
        pipeline_name: the optional name of the pipeline to visualise.
        env: the optional environment of the pipeline to visualise.
            If not provided, it will use Kedro's default, which is "local".
        project_path: the optional path of the Kedro project that contains the pipelines
            to visualise. If not supplied, the current working directory will be used.
    """
    if load_file is None:
        path = Path(project_path) if project_path else Path.cwd()
        catalog, pipelines = kedro_data_loader.load_data(path, env)
        pipelines = (
            pipelines
            if pipeline_name is None
            else {pipeline_name: pipelines[pipeline_name]}
        )
        populate_data(data_access_manager, catalog, pipelines)
        if save_file:
            res = responses.get_default_response()
            Path(save_file).write_text(res.json(indent=4, sort_keys=True))

        app = apps.create_api_app_from_project(path)
    else:
        app = apps.create_api_app_from_file(load_file)

    is_localhost = host in ("127.0.0.1", "localhost", "0.0.0.0")
    if browser and is_localhost:
        webbrowser.open_new(f"http://{host}:{port}/")
    uvicorn.run(app, host=host, port=port)


if __name__ == "__main__":  # pragma: no cover
    import argparse

    from kedro.framework.startup import bootstrap_project

    parser = argparse.ArgumentParser(description="Launch a development viz server")
    parser.add_argument("project_path", help="Path to a Kedro project")
    parser.add_argument(
        "--host", help="The host of the development server", default=_DEFAULT_HOST
    )
    parser.add_argument(
        "--port", help="The port of the development server", default=4142
    )
    args = parser.parse_args()

    source_dir = bootstrap_project(args.project_path)
    run_server(host=args.host, port=args.port, project_path=args.project_path)
