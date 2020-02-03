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
from kedro_viz.utils import WaitForException

EXPECTED_PIPELINE_DATA = {
    "edges": [
        {"target": "01a6a5cb", "source": "7366ec9f"},
        {"target": "01a6a5cb", "source": "f1f1425b"},
        {"target": "60e68b8e", "source": "01a6a5cb"},
        {"target": "de8434b7", "source": "afffac5f"},
        {"target": "de8434b7", "source": "f1f1425b"},
        {"target": "37316e3a", "source": "de8434b7"},
    ],
    "nodes": [
        {
            "name": "Func1",
            "type": "task",
            "id": "01a6a5cb",
            "full_name": "func1",
            "tags": [],
        },
        {
            "name": "my_node",
            "type": "task",
            "id": "de8434b7",
            "full_name": "func2",
            "tags": ["bob"],
        },
        {
            "name": "Bob In",
            "tags": [],
            "id": "7366ec9f",
            "full_name": "bob_in",
            "type": "data",
        },
        {
            "name": "Bob Out",
            "tags": [],
            "id": "60e68b8e",
            "full_name": "bob_out",
            "type": "data",
        },
        {
            "name": "Fred In",
            "tags": ["bob"],
            "id": "afffac5f",
            "full_name": "fred_in",
            "type": "data",
        },
        {
            "name": "Fred Out",
            "tags": ["bob"],
            "id": "37316e3a",
            "full_name": "fred_out",
            "type": "data",
        },
        {
            "name": "Parameters",
            "tags": ["bob"],
            "id": "f1f1425b",
            "full_name": "parameters",
            "type": "parameters",
        },
    ],
    "tags": [{"name": "Bob", "id": "bob"}],
}


def create_pipeline():
    def func1(a, b):  # pylint: disable=unused-argument
        return a

    def func2(a, b):  # pylint: disable=unused-argument
        return a

    return Pipeline(
        [
            # unnamed node with no tags and basic io
            node(func1, ["bob_in", "parameters"], ["bob_out"]),
            # named node with tags and transcoding
            node(
                func2,
                ["fred_in@pandas", "parameters"],
                ["fred_out@pandas"],
                name="my_node",
                tags=["bob"],
            ),
        ]
    )


def get_project_context(key):
    return {"create_pipeline": create_pipeline, "create_catalog": lambda x: None}[key]


def setup_function():
    mock.patch("kedro_viz.server.webbrowser").start()
    mock.patch("kedro_viz.server.app.run").start()


def teardown_function():
    mock.patch.stopall()


@pytest.fixture
def patched_get_project_context():
    mock.patch("kedro_viz.server.get_project_context", new=get_project_context).start()


@pytest.fixture
def client():
    """Create Flask test client as a test fixture."""
    client = server.app.test_client()
    return client


@pytest.mark.usefixtures("patched_get_project_context")
def test_set_port(cli_runner,):
    """Check that port argument is correctly handled."""
    result = cli_runner.invoke(server.commands, ["viz", "--port", "8000"])
    assert result.exit_code == 0, result.output
    server.app.run.assert_called_with(host="127.0.0.1", port=8000)
    assert server.webbrowser.open_new.called_with("http://127.0.0.1:8000/")


@pytest.mark.usefixtures("patched_get_project_context")
def test_set_ip(cli_runner):
    """Check that host argument is correctly handled."""
    result = cli_runner.invoke(server.commands, ["viz", "--host", "0.0.0.0"])
    assert result.exit_code == 0, result.output
    server.app.run.assert_called_with(host="0.0.0.0", port=4141)
    assert server.webbrowser.open_new.called_with("http://127.0.0.1:4141/")


@pytest.mark.usefixtures("patched_get_project_context")
def test_no_browser(cli_runner):
    """Check that call to open browser is not performed when `--no-browser`
    argument is specified.
    """
    result = cli_runner.invoke(server.commands, ["viz", "--no-browser"])
    assert result.exit_code == 0, result.output
    assert not server.webbrowser.open_new.called
    result = cli_runner.invoke(server.commands, ["viz"])
    assert result.exit_code == 0, result.output
    assert server.webbrowser.open_new.called


def test_load_file_outside_kedro_project(cli_runner, tmp_path):
    """Check that running viz with `--load-file` flag works outside of a Kedro project.
    """
    filepath_json = str(tmp_path / "test.json")
    data = {"nodes": None, "edges": None, "tags": None}
    with open(filepath_json, "w") as f:
        json.dump(data, f)

    result = cli_runner.invoke(server.commands, ["viz", "--load-file", filepath_json])
    assert result.exit_code == 0, result.output


@pytest.mark.usefixtures("patched_get_project_context")
def test_save_file(cli_runner, tmp_path):
    """Check that running with `--save-file` flag saves pipeline JSON file in a specified path.
    """
    save_path = str(tmp_path / "test.json")

    result = cli_runner.invoke(server.commands, ["viz", "--save-file", save_path])
    assert result.exit_code == 0, result.output

    with open(save_path, "r") as f:
        json_data = json.load(f)
    assert json_data == EXPECTED_PIPELINE_DATA


def test_load_file_no_top_level_key(cli_runner, tmp_path):
    """Check that top level keys are properly checked."""
    filepath_json = str(tmp_path / "test.json")
    data = {"fake": "fake"}
    with open(filepath_json, "w") as f:
        json.dump(data, f)

    result = cli_runner.invoke(server.commands, ["viz", "--load-file", filepath_json])
    assert result.output == "Invalid file, top level key 'nodes' not found.\n"


def test_no_load_file(cli_runner):
    """Check that running viz without `--load-file` flag should fail outside of a Kedro project.
    """
    result = cli_runner.invoke(server.commands, ["viz"])
    assert result.exit_code == 1
    assert "Could not find a Kedro project root." in result.output


def test_root_endpoint(client):
    """Test `/` endoint is functional."""
    response = client.get("/")
    assert response.status_code == 200
    assert "Kedro Viz" in response.data.decode()


@pytest.mark.usefixtures("patched_get_project_context")
def test_nodes_endpoint(cli_runner, client):
    """Test `/api/nodes.json` endoint is functional and returns a valid JSON."""
    cli_runner.invoke(server.commands, ["viz", "--port", "8000"])
    response = client.get("/api/nodes.json")
    assert response.status_code == 200
    data = json.loads(response.data.decode())
    assert data == EXPECTED_PIPELINE_DATA


@pytest.fixture(autouse=True)
def clean_up():
    # pylint: disable=protected-access
    server._VIZ_PROCESSES.clear()


def test_wait_for():
    def _sum(x, y):
        return x + y

    assert not server.wait_for(_sum, 3, x=1, y=2)

    unexpected_result_error = r"didn\'t return 0 within specified timeout"
    with pytest.raises(WaitForException, match=unexpected_result_error):
        server.wait_for(_sum, 0, x=1, y=2, timeout_=1)

    # Non-callable should fail
    non_callable = 1
    non_callable_error = r"didn\'t return True within specified timeout"
    with pytest.raises(WaitForException, match=non_callable_error):
        server.wait_for(non_callable, timeout_=1)


@pytest.fixture
def mocked_process(mocker):
    mocker.patch("kedro_viz.server.wait_for")
    return mocker.patch("kedro_viz.server.multiprocessing.Process")


class TestRunViz:
    default_port = 4141

    def test_call_once(self, mocked_process):
        """Test inline magic function"""
        server.run_viz()
        # pylint: disable=protected-access
        mocked_process.assert_called_once_with(
            target=server._call_viz, kwargs={"port": self.default_port}, daemon=True
        )

    def test_call_twice_with_same_port(self, mocked_process):
        """Running run_viz with the same port should trigger another process."""
        server.run_viz()
        server.run_viz()
        # pylint: disable=protected-access
        mocked_process.assert_called_with(
            target=server._call_viz, kwargs={"port": self.default_port}, daemon=True
        )
        assert mocked_process.call_count == 2

    def test_call_twice_with_different_port(self, mocked_process):
        """Running run_viz with a different port should start another process."""
        server.run_viz()
        # pylint: disable=protected-access
        mocked_process.assert_called_with(
            target=server._call_viz, kwargs={"port": self.default_port}, daemon=True
        )
        server.run_viz(port=8000)
        # pylint: disable=protected-access
        mocked_process.assert_called_with(
            target=server._call_viz, kwargs={"port": 8000}, daemon=True
        )
        assert mocked_process.call_count == 2

    def test_check_viz_up(self, requests_mock):
        """Test the helper function which checks if HTTP GET status code is 200."""
        requests_mock.get(
            "http://127.0.0.1:8000/", content=b"some output", status_code=200
        )
        assert server._check_viz_up(8000)  # pylint: disable=protected-access

    def test_check_viz_up_invalid(self):
        """Test should catch the request connection error and returns False."""
        assert not server._check_viz_up(8888)  # pylint: disable=protected-access
