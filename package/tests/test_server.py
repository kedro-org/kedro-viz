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
import json
from unittest import mock

import pytest
from pydantic import BaseModel

from kedro_viz.server import run_server


class ExampleAPIResponse(BaseModel):
    content: str


@pytest.fixture(autouse=True)
def patched_uvicorn_run(mocker):
    yield mocker.patch("uvicorn.run")


@pytest.fixture(autouse=True)
def patched_data_access_manager(mocker):
    yield mocker.patch("kedro_viz.server.data_access_manager")


@pytest.fixture(autouse=True)
def patched_create_api_app_from_project(mocker):
    yield mocker.patch("kedro_viz.api.apps.create_api_app_from_project")


@pytest.fixture
def patched_create_api_app_from_file(mocker):
    yield mocker.patch("kedro_viz.api.apps.create_api_app_from_file")


@pytest.fixture(autouse=True)
def patched_load_data(
    mocker, example_catalog, example_pipelines, example_session_store_location
):
    yield mocker.patch(
        "kedro_viz.server.kedro_data_loader.load_data",
        return_value=(
            example_catalog,
            example_pipelines,
            example_session_store_location,
        ),
    )


class TestServer:
    def test_run_server_from_project(
        self,
        patched_create_api_app_from_project,
        patched_data_access_manager,
        patched_uvicorn_run,
        example_catalog,
        example_pipelines,
        example_session_store_location,
    ):
        run_server()
        # assert that when running server, data are added correctly to the data access manager
        patched_data_access_manager.add_catalog.assert_called_once_with(example_catalog)
        patched_data_access_manager.add_pipelines.assert_called_once_with(
            example_pipelines
        )

        # correct api app is created
        patched_create_api_app_from_project.assert_called_once()

        # an uvicorn server is launched
        patched_uvicorn_run.assert_called_once()

    def test_specific_pipeline(
        self,
        patched_data_access_manager,
        example_pipelines,
    ):
        run_server(pipeline_name="data_science")

        # assert that when running server, data are added correctly to the data access manager
        patched_data_access_manager.add_pipelines.assert_called_once_with(
            {"data_science": example_pipelines["data_science"]}
        )

    def test_load_file(self, patched_create_api_app_from_file):
        load_file = "test.json"
        run_server(load_file=load_file)
        patched_create_api_app_from_file.assert_called_once_with(load_file)

    def test_save_file(self, tmp_path, mocker):
        mocker.patch(
            "kedro_viz.server.responses.get_default_response",
            return_value=ExampleAPIResponse(content="test"),
        )
        save_file = tmp_path / "save.json"
        run_server(save_file=save_file)
        with open(save_file, "r") as f:
            assert json.load(f) == {"content": "test"}

    @pytest.mark.parametrize(
        "browser,ip,should_browser_open",
        [
            (True, "0.0.0.0", True),
            (True, "127.0.0.1", True),
            (True, "localhost", True),
            (False, "127.0.0.1", False),
            (True, "8.8.8.8", False),
        ],
    )
    @mock.patch("kedro_viz.server.webbrowser")
    def test_browser_open(
        self,
        webbrowser,
        browser,
        ip,
        should_browser_open,
        mocker,
    ):
        run_server(browser=browser, host=ip)
        if should_browser_open:
            webbrowser.open_new.assert_called_once()
        else:
            webbrowser.open_new.assert_not_called()
