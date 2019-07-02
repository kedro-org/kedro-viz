# Copyright 2018-2019 QuantumBlack Visual Analytics Limited
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
"""
Tests for Kedro-Viz server
"""

import json
from unittest import mock

import pytest
from kedro.pipeline import Pipeline, node

from kedro_viz import server

EXPECTED_PIPELINE_DATA = [
    {
        "name": (
            "split_data([example_iris_data,parameters]) -> "
            "[example_test_x,example_test_y,example_train_x,example_train_y@spark]"
        ),
        "inputs": ["parameters", "example_iris_data"],
        "outputs": [
            "example_train_y",
            "example_train_x",
            "example_test_y",
            "example_test_x",
        ],
        "tags": [],
    },
    {
        "name": (
            "train_model([example_train_x,example_train_y@pandas,parameters]) -> "
            "[example_model]"
        ),
        "inputs": ["example_train_y", "example_train_x", "parameters"],
        "outputs": ["example_model"],
        "tags": [],
    },
    {
        "name": "predict([example_model,example_test_x]) -> [example_predictions]",
        "inputs": ["example_test_x", "example_model"],
        "outputs": ["example_predictions"],
        "tags": [],
    },
    {
        "name": "report_accuracy([example_predictions,example_test_y]) -> None",
        "inputs": ["example_predictions", "example_test_y"],
        "outputs": [],
        "tags": [],
    },
]


def create_pipeline():
    def split_data(a, b):  # pylint: disable=unused-argument
        return 1, 2, 3, 4

    def train_model(a, b, c):  # pylint: disable=unused-argument
        return 1

    def predict(a, b):  # pylint: disable=unused-argument
        return 1

    def report_accuracy(a, b):  # pylint: disable=unused-argument
        return None

    return Pipeline(
        [
            node(
                split_data,
                ["parameters", "example_iris_data"],
                [
                    "example_train_y@spark",
                    "example_train_x",
                    "example_test_y",
                    "example_test_x",
                ],
            ),
            node(
                train_model,
                ["example_train_y@pandas", "example_train_x", "parameters"],
                ["example_model"],
            ),
            node(predict, ["example_test_x", "example_model"], ["example_predictions"]),
            node(report_accuracy, ["example_predictions", "example_test_y"], []),
        ]
    )


def get_project_context(key):
    assert key == "create_pipeline"
    return create_pipeline


def setup_function():
    mock.patch("kedro_viz.server.webbrowser").start()
    mock.patch("kedro_viz.server.app.run").start()
    mock.patch("kedro_viz.server.get_project_context", new=get_project_context).start()


def teardown_function():
    mock.patch.stopall()


@pytest.fixture
def client():
    """Create Flask test client as a test fixture"""
    client = server.app.test_client()
    return client


def test_set_port(cli_runner):
    """Check that port argument is correctly handled"""
    result = cli_runner.invoke(server.commands, ["viz", "--port", "8000"])
    assert result.exit_code == 0, result.output
    server.app.run.assert_called_with(host="127.0.0.1", port=8000)
    assert server.webbrowser.open_new.called_with("http://127.0.0.1:8000/")


def test_set_ip(cli_runner):
    """Check that host argument is correctly handled"""
    result = cli_runner.invoke(server.commands, ["viz", "--host", "0.0.0.0"])
    assert result.exit_code == 0, result.output
    server.app.run.assert_called_with(host="0.0.0.0", port=4141)
    assert server.webbrowser.open_new.called_with("http://127.0.0.1:4141/")


def test_no_browser(cli_runner):
    """
    Check that call to open browser is not performed when `--no-browser`
    argument is specified
    """
    result = cli_runner.invoke(server.commands, ["viz", "--no-browser"])
    assert result.exit_code == 0, result.output
    assert not server.webbrowser.open_new.called
    result = cli_runner.invoke(server.commands, ["viz"])
    assert result.exit_code == 0, result.output
    assert server.webbrowser.open_new.called


# Test endpoints


def test_root_endpoint(client):
    """Test `/` endoint is functional"""
    response = client.get("/")
    assert response.status_code == 200
    assert "Kedro Viz" in response.data.decode()


def test_nodes_endpoint(client):
    """Test `/log/nodes.json` endoint is functional and returns a valid JSON"""
    response = client.get("/logs/nodes.json")
    assert response.status_code == 200
    data = json.loads(response.data.decode())
    assert data == EXPECTED_PIPELINE_DATA
