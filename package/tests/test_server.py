# Copyright 2021 QuantumBlack Visual Analytics Limited
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
# http://www.apache.org/licenses/LICENSE-2.0
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
#     or use the QuantumBlack Trademarks in any other manner that might cause
# confusion in the marketplace, including but not limited to in advertising,
# on websites, or on software.
#
# See the License for the specific language governing permissions and
# limitations under the License.
import json
from pathlib import Path
from typing import Dict
from unittest import mock

from kedro.io import DataCatalog
from kedro.pipeline import Pipeline

from kedro_viz.server import run_server


class TestServer:
    @mock.patch("uvicorn.run")
    @mock.patch("webbrowser.open_new")
    @mock.patch("kedro_viz.server.data_access_manager")
    @mock.patch("kedro_viz.server.apps.create_api_app_from_project")
    def test_run_server_from_project(
        self,
        create_api_app_from_project,
        data_access_manager,
        webbrowser_open,
        uvicorn_run,
        example_catalog,
        example_pipelines,
    ):
        with mock.patch(
            "kedro_viz.server.kedro_data_loader.load_data",
            return_value=(example_catalog, example_pipelines),
        ):
            run_server(browser=True)

            # assert that when running server, data are added correctly to the data access manager
            data_access_manager.add_catalog.assert_called_once_with(example_catalog)
            data_access_manager.add_pipelines.assert_called_once_with(example_pipelines)

            # correct api app is created
            create_api_app_from_project.assert_called_once()

            # webbrowser is launched
            webbrowser_open.assert_called_once_with("http://0.0.0.0:4141/")

            # an uvicorn server is launched
            uvicorn_run.assert_called_once()

    @mock.patch("uvicorn.run")
    @mock.patch("kedro_viz.server.data_access_manager")
    @mock.patch("kedro_viz.server.apps.create_api_app_from_file")
    def test_run_server_from_file(
        self, create_api_app_from_file, data_access_manager, uvicorn_run,
    ):
        with mock.patch("kedro_viz.server.kedro_data_loader.load_data"):
            load_file = "test.json"
            run_server(load_file=load_file)
            create_api_app_from_file.assert_called_once_with(load_file)
            uvicorn_run.assert_called_once()

    @mock.patch("uvicorn.run")
    @mock.patch("kedro_viz.server.apps.create_api_app_from_project")
    def test_save_file(
        self,
        uvicorn_run,
        create_api_app_from_project,
        example_catalog,
        example_pipelines,
        assert_example_data,
        tmp_path,
    ):
        with mock.patch(
            "kedro_viz.server.kedro_data_loader.load_data",
            return_value=(example_catalog, example_pipelines),
        ):
            save_file = tmp_path / "save.json"
            run_server(save_file=save_file)
            with open(save_file, "r") as saved_pipelines:
                assert_example_data(json.load(saved_pipelines))
