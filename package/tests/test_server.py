# Copyright 2020 QuantumBlack Visual Analytics Limited
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
# pylint: disable=protected-access
"""
Tests for Kedro-Viz server
"""

import inspect
import json
import re
from collections import namedtuple
from functools import partial
from pathlib import Path

import pytest
from kedro.extras.datasets.pickle import PickleDataSet
from kedro.io import DataCatalog, DataSetNotFoundError, MemoryDataSet
from kedro.pipeline import Pipeline, node
from toposort import CircularDependencyError

import kedro_viz
from kedro_viz import server
from kedro_viz.server import _allocate_port, _hash, _sort_layers, format_pipelines_data
from kedro_viz.utils import WaitForException

input_json_path = (
    Path(__file__).parents[2] / "src" / "utils" / "data" / "animals.mock.json"
)

EXPECTED_PIPELINE_DATA = json.loads(input_json_path.read_text())

MockedProjectMedata = namedtuple("MockedProjectMedata", ["package_name", "settings"])


def shark(input1, input2, input3, input4):
    return input1, input3


def salmon(dog, rabbit, parameters, cat):
    """docstring
    """
    return dog, rabbit


def trout(pig, sheep):
    return pig


def get_pipelines():
    return {
        "de": de_pipeline(),
        "ds": ds_pipeline(),
        "__default__": create_pipeline(),
        "empty": Pipeline([]),
    }


def get_pipeline(name: str = None):
    name = name or "__default__"
    pipelines = get_pipelines()

    try:
        return pipelines[name]
    except Exception:
        raise KeyError("Failed to find the pipeline.")


def ds_pipeline():
    ds_pipeline = Pipeline(
        [node(trout, inputs=["pig", "sheep"], outputs=["whale"], name="trout")]
    )
    return ds_pipeline


def de_pipeline():
    de_pipeline = Pipeline(
        [
            node(
                shark,
                inputs=["cat", "weasel", "elephant", "bear"],
                outputs=["pig", "giraffe"],
                name="shark",
                tags=["medium", "large"],
            ),
            node(
                salmon,
                inputs=["dog@pandas", "params:rabbit", "parameters", "cat"],
                outputs=["sheep", "horse"],
                name="salmon",
                tags=["small"],
            ),
        ]
    )
    return de_pipeline


def create_pipeline():
    return de_pipeline() + ds_pipeline()


@pytest.fixture
def dummy_layers():
    return {
        "raw": {"elephant", "bear", "weasel", "cat", "dog"},
        "primary": {"sheep"},
        "feature": {"pig"},
        "model output": {"horse", "giraffe", "whale"},
    }


@pytest.fixture(autouse=True)
def start_server(mocker):
    mocker.patch("kedro_viz.server.webbrowser")
    mocker.patch("kedro_viz.server.app.run")


@pytest.fixture(autouse=True)
def patched_get_project_metadata(mocker):
    mocked_metadata = MockedProjectMedata(package_name="test", settings=mocker.Mock())
    mocker.patch(
        "kedro.framework.startup._get_project_metadata", return_value=mocked_metadata
    )


@pytest.fixture
def patched_create_session(mocker, tmp_path, dummy_layers):
    class DummyDataCatalog:
        def __init__(self, layers):
            self._data_sets = {
                "cat": PickleDataSet(filepath=str(tmp_path)),
                "parameters": MemoryDataSet({"name": "value"}),
                "params:rabbit": MemoryDataSet("value"),
            }
            self.layers = layers

        def _describe(self):
            return {"filepath": str(tmp_path)}

        def _get_dataset(self, data_set_name):  # pylint: disable=unused-argument
            if data_set_name not in self._data_sets:
                raise DataSetNotFoundError
            return self._data_sets[data_set_name]

        def exists(self, name):
            dataset = self._get_dataset(name)
            return dataset.exists()

    def load_context():
        mocked_context = mocker.Mock()
        mocked_context.pipelines = get_pipelines()
        mocked_context._get_pipeline = get_pipeline  # pylint: disable=protected-access
        dummy_data_catalog = DummyDataCatalog(dummy_layers)
        mocked_context.catalog = dummy_data_catalog
        mocked_context.pipeline = create_pipeline()
        return mocked_context

    mocked_session = mocker.Mock()
    mocked_session.load_context = load_context
    mocker.patch("kedro.framework.project.configure_project")
    return mocker.patch(
        "kedro.framework.session.KedroSession.create", return_value=mocked_session
    )


@pytest.fixture
def client():
    """Create Flask test client as a test fixture."""
    client = server.app.test_client()
    return client


_USE_PATCHED_CONTEXT = pytest.mark.usefixtures("patched_create_session")


@_USE_PATCHED_CONTEXT
def test_set_port(cli_runner,):
    """Check that port argument is correctly handled."""
    result = cli_runner.invoke(server.commands, ["viz", "--port", "8000"])
    assert result.exit_code == 0, result.output
    server.app.run.assert_called_with(host="127.0.0.1", port=8000)
    server.webbrowser.open_new.assert_called_with("http://127.0.0.1:8000/")


@_USE_PATCHED_CONTEXT
def test_set_ip(cli_runner):
    """Check that host argument is correctly handled."""
    result = cli_runner.invoke(server.commands, ["viz", "--host", "0.0.0.0"])
    assert result.exit_code == 0, result.output
    server.app.run.assert_called_with(host="0.0.0.0", port=4141)
    server.webbrowser.open_new.assert_called_with("http://0.0.0.0:4141/")


@_USE_PATCHED_CONTEXT
def test_no_browser(cli_runner):
    """Check that call to open browser is not performed when `--no-browser`
    argument is specified.
    """
    result = cli_runner.invoke(server.commands, ["viz", "--no-browser"])
    assert result.exit_code == 0, result.output
    assert not server.webbrowser.open_new.called
    result = cli_runner.invoke(server.commands, ["viz"])
    assert result.exit_code == 0, result.output
    assert server.webbrowser.open_new.call_count == 1


def test_viz_does_not_need_to_specify_project_path(cli_runner, patched_create_session):
    cli_runner.invoke(server.commands, ["viz", "--no-browser"])
    patched_create_session.assert_called_once_with(
        package_name="test", project_path=Path.cwd(), env=None, save_on_close=False,
    )


@_USE_PATCHED_CONTEXT
def test_no_browser_if_not_localhost(cli_runner):
    """Check that call to open browser is not performed when host
    is not the local host.
    """
    result = cli_runner.invoke(
        server.commands, ["viz", "--browser", "--host", "123.1.2.3"]
    )
    assert result.exit_code == 0, result.output
    assert not server.webbrowser.open_new.called
    result = cli_runner.invoke(server.commands, ["viz", "--host", "123.1.2.3"])
    assert result.exit_code == 0, result.output
    assert not server.webbrowser.open_new.call_count


def test_load_file_outside_kedro_project(cli_runner, tmp_path):
    """Check that running viz with `--load-file` flag works outside of a Kedro project.
    """
    filepath_json = str(tmp_path / "test.json")
    data = {
        "nodes": None,
        "edges": None,
        "tags": None,
        "layers": None,
        "pipelines": None,
    }
    with open(filepath_json, "w") as f:
        json.dump(data, f)

    result = cli_runner.invoke(server.commands, ["viz", "--load-file", filepath_json])
    assert result.exit_code == 0, result.output


@_USE_PATCHED_CONTEXT
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
    assert "Invalid file, top level key 'nodes' not found." in result.output


def test_no_load_file(cli_runner):
    """Check that running viz without `--load-file` flag should fail outside of a Kedro project.
    """
    result = cli_runner.invoke(server.commands, ["viz"])
    assert result.exit_code == 1


def test_root_endpoint(client):
    """Test `/` endpoint is functional."""
    response = client.get("/")
    assert response.status_code == 200
    assert "Kedro Viz" in response.data.decode()


@_USE_PATCHED_CONTEXT
def test_nodes_endpoint(cli_runner, client):
    """Test `/api/main` endpoint is functional and returns a valid JSON."""
    cli_runner.invoke(server.commands, ["viz", "--port", "8000"])
    response = client.get("/api/main")
    assert response.status_code == 200
    data = json.loads(response.data.decode())
    assert data == EXPECTED_PIPELINE_DATA


@_USE_PATCHED_CONTEXT
def test_pipelines_endpoint(cli_runner, client):
    """Test `/api/pipelines` endpoint is functional and returns a valid JSON."""
    cli_runner.invoke(server.commands, ["viz", "--port", "8000"])
    selected_pipeline_id = "ds"
    response = client.get(f"/api/pipelines/{selected_pipeline_id}")
    assert response.status_code == 200
    data = json.loads(response.data.decode())

    # make sure the list of all pipelines are returned
    assert data["pipelines"] == EXPECTED_PIPELINE_DATA["pipelines"]
    assert data["selected_pipeline"] == selected_pipeline_id

    # make sure all returned nodes belong to the correct pipelines
    for n in data["nodes"]:
        assert selected_pipeline_id in n["pipelines"]

    # make sure only edges in the selected pipelines are returned

    assert data["edges"] == [
        {"source": "2cd4ba93", "target": "e27376a9"},
        {"source": "6525f2e6", "target": "e27376a9"},
        {"source": "e27376a9", "target": "1769e230"},
    ]

    # make sure all tags are returned
    assert data["tags"] == EXPECTED_PIPELINE_DATA["tags"]


@_USE_PATCHED_CONTEXT
def test_pipelines_endpoint_invalid_pipeline_id(cli_runner, client):
    """Test `/api/pipelines/invalid_id` endpoint returns an empty JSON."""
    cli_runner.invoke(server.commands, ["viz", "--port", "8000"])
    response = client.get(f"/api/pipelines/invalid")
    assert response.status_code == 404
    data = json.loads(response.data.decode())
    assert data["error"] == "404 Not Found: Invalid pipeline ID."


@_USE_PATCHED_CONTEXT
def test_node_metadata_endpoint_task(cli_runner, client, mocker, tmp_path):
    """Test `/api/nodes/task_id` endpoint is functional and returns a valid JSON."""
    project_root = "project_root"
    filepath = "filepath"
    mocker.patch.object(
        kedro_viz.server.Path, "cwd", return_value=tmp_path / project_root
    )
    mocker.patch.object(
        kedro_viz.server.Path,
        "resolve",
        return_value=tmp_path / project_root / filepath,
    )
    cli_runner.invoke(server.commands, ["viz", "--port", "8000"])
    task_id = "443cf06a"
    response = client.get(f"/api/nodes/{task_id}")
    assert response.status_code == 200
    data = json.loads(response.data.decode())

    assert data["code"] == inspect.getsource(salmon)
    assert data["filepath"] == str(Path(project_root) / filepath)
    assert data["docstring"] == inspect.getdoc(salmon)
    assert data["parameters"] == {"name": "value"}


@_USE_PATCHED_CONTEXT
def test_node_metadata_endpoint_task_missing_docstring(
    cli_runner, client, mocker, tmp_path
):
    """Test `/api/nodes/task_id` endpoint is functional and returns a valid JSON,
    but docstring is missing."""
    project_root = "project_root"
    filepath = "filepath"
    mocker.patch.object(
        kedro_viz.server.Path, "cwd", return_value=tmp_path / project_root
    )
    mocker.patch.object(
        kedro_viz.server.Path,
        "resolve",
        return_value=tmp_path / project_root / filepath,
    )
    cli_runner.invoke(server.commands, ["viz", "--port", "8000"])
    task_id = "e27376a9"
    response = client.get(f"/api/nodes/{task_id}")
    assert response.status_code == 200
    data = json.loads(response.data.decode())
    assert data["code"] == inspect.getsource(trout)
    assert data["filepath"] == str(Path(project_root) / filepath)
    assert "docstring" not in data


@_USE_PATCHED_CONTEXT
def test_node_metadata_endpoint_data_input(cli_runner, client, tmp_path):
    """Test `/api/nodes/data_id` endpoint is functional and returns a valid JSON."""
    cli_runner.invoke(server.commands, ["viz", "--port", "8000"])
    response = client.get(f"/api/nodes/{ _hash('cat')}")
    assert response.status_code == 200
    data = json.loads(response.data.decode())
    assert data["filepath"] == str(tmp_path)
    assert data["type"] == f"{PickleDataSet.__module__}.{PickleDataSet.__qualname__}"


@_USE_PATCHED_CONTEXT
def test_node_metadata_endpoint_data_output(cli_runner, client, tmp_path):
    """Test `/api/nodes/data_id` endpoint is functional and returns a valid empty JSON."""
    cli_runner.invoke(server.commands, ["viz", "--port", "8000"])
    # 'bob_out' is not stored in DummyDataCatalog
    response = client.get(f"/api/nodes/{_hash('pig')}")
    assert response.status_code == 200
    data = json.loads(response.data.decode())
    assert not data


@_USE_PATCHED_CONTEXT
def test_node_metadata_endpoint_parameters(cli_runner, client):
    """Test `/api/nodes/param_id` endpoint is functional and returns an empty JSON."""
    cli_runner.invoke(server.commands, ["viz", "--port", "8000"])
    param_id = "f1f1425b"
    response = client.get(f"/api/nodes/{param_id}")
    assert response.status_code == 200
    data = json.loads(response.data.decode())
    assert data == {"parameters": {"name": "value"}}


@_USE_PATCHED_CONTEXT
def test_node_metadata_endpoint_param_prefix(cli_runner, client):
    """Test `/api/nodes/param_id` with param prefix endpoint is functional
    and returns an empty JSON.
    """
    cli_runner.invoke(server.commands, ["viz", "--port", "8000"])
    param_id = "c38d4c6a"
    response = client.get(f"/api/nodes/{param_id}")
    assert response.status_code == 200
    data = json.loads(response.data.decode())
    assert data == {"parameters": {"rabbit": "value"}}


@_USE_PATCHED_CONTEXT
def test_node_metadata_endpoint_invalid(cli_runner, client):
    """Test `/api/nodes/invalid_id` endpoint returns an empty JSON."""
    cli_runner.invoke(server.commands, ["viz", "--port", "8000"])
    param_id = "invalid"
    response = client.get(f"/api/nodes/{param_id}")
    assert response.status_code == 404
    data = json.loads(response.data.decode())
    assert data["error"] == "404 Not Found: Invalid node ID."


@_USE_PATCHED_CONTEXT
def test_pipeline_flag(cli_runner, client):
    """Test that running viz with `--pipeline` flag will return a correct pipeline."""
    cli_runner.invoke(server.commands, ["viz", "--pipeline", "ds"])
    response = client.get("/api/main")
    assert response.status_code == 200
    data = json.loads(response.data.decode())

    assert data == {
        "edges": [
            {"source": "2cd4ba93", "target": "e27376a9"},
            {"source": "6525f2e6", "target": "e27376a9"},
            {"source": "e27376a9", "target": "1769e230"},
        ],
        "layers": ["feature", "primary", "model output"],
        "nodes": [
            {
                "full_name": "trout",
                "id": "e27376a9",
                "name": "trout",
                "pipelines": ["ds"],
                "tags": [],
                "type": "task",
            },
            {
                "full_name": "pig",
                "id": "2cd4ba93",
                "layer": "feature",
                "name": "Pig",
                "pipelines": ["ds"],
                "tags": [],
                "type": "data",
            },
            {
                "full_name": "sheep",
                "id": "6525f2e6",
                "layer": "primary",
                "name": "Sheep",
                "pipelines": ["ds"],
                "tags": [],
                "type": "data",
            },
            {
                "full_name": "whale",
                "id": "1769e230",
                "layer": "model output",
                "name": "Whale",
                "pipelines": ["ds"],
                "tags": [],
                "type": "data",
            },
        ],
        "pipelines": [{"id": "ds", "name": "Ds"}],
        "selected_pipeline": "ds",
        "tags": [],
    }


@_USE_PATCHED_CONTEXT
def test_pipeline_flag_non_existent(cli_runner):
    """Test that running viz with `--pipeline` flag but the pipeline does not exist."""
    result = cli_runner.invoke(server.commands, ["viz", "--pipeline", "nonexistent"])
    assert "Failed to find the pipeline." in result.output


def test_viz_stacktrace(mocker, cli_runner):
    """Test that in the case of a generic exception,
    the stacktrace is printed."""
    mocker.patch("kedro_viz.server._call_viz", side_effect=ValueError)
    result = cli_runner.invoke(server.commands, "viz")

    assert "Traceback (most recent call last):" in result.output
    assert "ValueError" in result.output


@pytest.fixture(autouse=True)
def clean_up():
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


class TestCallViz:
    def test_call_viz_without_project_path(self, patched_create_session):
        server._call_viz()
        patched_create_session.assert_called_once_with(
            package_name="test", project_path=Path.cwd(), env=None, save_on_close=False,
        )

    def test_call_viz_with_project_path(self, patched_create_session):
        mocked_project_path = Path("/tmp")
        server._call_viz(project_path=mocked_project_path)
        patched_create_session.assert_called_once_with(
            package_name="test",
            project_path=mocked_project_path,
            env=None,
            save_on_close=False,
        )


class TestRunViz:
    default_port = 4141

    def test_call_once(self, mocked_process):
        """Test inline magic function"""
        server.run_viz()
        mocked_process.assert_called_once_with(
            target=server._call_viz, kwargs={"port": self.default_port}, daemon=True
        )

    def test_call_twice_with_same_port(self, mocked_process):
        """Running run_viz with the same port should trigger another process."""
        server.run_viz()
        server.run_viz()
        mocked_process.assert_called_with(
            target=server._call_viz, kwargs={"port": self.default_port}, daemon=True
        )
        assert mocked_process.call_count == 2

    def test_call_twice_with_different_port(self, mocked_process):
        """Running run_viz with a different port should start another process."""
        server.run_viz()
        mocked_process.assert_called_with(
            target=server._call_viz, kwargs={"port": self.default_port}, daemon=True
        )
        server.run_viz(port=8000)
        mocked_process.assert_called_with(
            target=server._call_viz, kwargs={"port": 8000}, daemon=True
        )
        assert mocked_process.call_count == 2

    def test_check_viz_up(self, requests_mock):
        """Test the helper function which checks if HTTP GET status code is 200."""
        requests_mock.get(
            "http://127.0.0.1:8000/", content=b"some output", status_code=200
        )
        assert server._check_viz_up(8000)

    def test_check_viz_up_invalid(self):
        """Test should catch the request connection error and returns False."""
        assert not server._check_viz_up(8888)

    def test_call_with_local_ns(self, mocked_process):
        mocked_project_path = Path("/tmp")
        mocked_local_ns = {"project_path": mocked_project_path}

        server.run_viz(local_ns=mocked_local_ns)

        # we can't use assert_called_once_with because it doesn't work with functools.partial
        # so we are comparing the call args one by one
        assert (
            len(mocked_process.mock_calls) == 2
        )  # 1 for the constructor, 1 to start the process
        mocked_call_kwargs = mocked_process.call_args_list[0][1]

        expected_target = partial(server._call_viz, project_path=mocked_project_path)
        assert (
            mocked_call_kwargs["target"].func == expected_target.func
            and mocked_call_kwargs["target"].args == expected_target.args
            and mocked_call_kwargs["target"].keywords == expected_target.keywords
        )
        assert mocked_call_kwargs["daemon"] is True


class TestAllocatePort:
    @pytest.mark.parametrize(
        "viz_processes,kwargs,expected_port",
        [
            ([4321], {"start_at": 4141}, 4321),
            ([4140, 4141], {"start_at": 4140}, 4140),
            ([4140, 4141], {"start_at": 4141}, 4141),
            ([4140], {"start_at": 4141}, 4141),
            ([4140, 4141], {"start_at": 1, "end_at": 4141}, 4140),
            ([4140, 4141], {"start_at": 4141, "end_at": 4141}, 4141),
            ([65535], {"start_at": 1}, 65535),
        ],
    )
    def test_allocate_from_viz_processes(
        self, mocker, viz_processes, kwargs, expected_port
    ):
        """Test allocation of the port from the one that was already captured
        in _VIZ_PROCESSES"""
        mocker.patch.dict(
            "kedro_viz.server._VIZ_PROCESSES", {k: None for k in viz_processes}
        )

        allocated_port = _allocate_port(**kwargs)
        assert allocated_port == expected_port

    @pytest.mark.parametrize(
        "kwargs,expected_port",
        [
            ({"start_at": 4141}, 4142),
            ({"start_at": 80}, 80),
            ({"start_at": 82, "end_at": 82}, 82),
            ({"start_at": 83, "end_at": 84}, 84),
        ],
    )
    def test_allocate_from_available_ports(self, mocker, kwargs, expected_port):
        """Test allocation of one of unoccupied ports"""

        def _mock_even_port_available(host_and_port):
            # Mock availability of every even port number
            port = host_and_port[1]
            return 1 - port % 2

        mock_socket = mocker.patch("socket.socket")
        mock_socket.return_value.connect_ex.side_effect = _mock_even_port_available

        allocated_port = _allocate_port(**kwargs)
        assert allocated_port == expected_port

    @pytest.mark.parametrize(
        "kwargs",
        [{"start_at": 5, "end_at": 4}, {"start_at": 65536}, {"start_at": 4141}],
    )
    def test_allocation_error(self, kwargs, mocker):
        """Test an error when no TCP port can be allocated from the given range"""
        mock_socket = mocker.patch("socket.socket")
        mock_socket.return_value.connect_ex.return_value = 0  # any port is unavailable

        pattern = "Cannot allocate an open TCP port for Kedro-Viz"
        with pytest.raises(ValueError, match=re.escape(pattern)):
            _allocate_port(**kwargs)


@pytest.fixture
def pipeline():
    def func1(a, b):  # pylint: disable=unused-argument
        return a

    def func2(a):  # pylint: disable=unused-argument
        return a

    return {
        "__default__": Pipeline(
            [
                node(func1, ["bob_in", "params:key"], "bob_out"),
                node(func2, "bob_out", "result"),
            ]
        )
    }


@pytest.fixture
def new_catalog_with_layers():
    data_sets = {
        "bob_in": PickleDataSet("raw.csv"),
        "params:key": MemoryDataSet("value"),
        "result": PickleDataSet("final.csv"),
    }
    layers = {"raw": {"bob_in"}, "final": {"result"}}

    catalog = DataCatalog(data_sets=data_sets)
    setattr(catalog, "layers", layers)

    return catalog


def test_format_pipelines_data(pipeline, new_catalog_with_layers, mocker):
    mocker.patch("kedro_viz.server._CATALOG", new_catalog_with_layers)
    result = format_pipelines_data(pipeline)
    result_file_path = Path(__file__).parent / "test-format.json"
    json_data = json.loads(result_file_path.read_text())
    assert json_data == result


def test_format_pipelines_data_no_layers(pipeline, new_catalog_with_layers, mocker):
    mocker.patch("kedro_viz.server._CATALOG", new_catalog_with_layers)
    setattr(new_catalog_with_layers, "layers", None)
    result = format_pipelines_data(pipeline)
    assert result["layers"] == []


@pytest.mark.parametrize(
    "graph_schema,nodes,node_dependencies,expected",
    [
        (
            # direct dependency
            "node_1(layer=raw) -> node_2(layer=int)",
            {
                "node_1": {"id": "node_1", "layer": "raw"},
                "node_2": {"id": "node_2", "layer": "int"},
            },
            {"node_1": {"node_2"}, "node_2": set()},
            ["raw", "int"],
        ),
        (
            # more than 1 node in a layer
            "node_1 -> node_2(layer=raw) -> node_3(layer=raw) -> node_4(layer=int)",
            {
                "node_1": {"id": "node_1"},
                "node_2": {"id": "node_2", "layer": "raw"},
                "node_3": {"id": "node_3", "layer": "raw"},
                "node_4": {"id": "node_4", "layer": "int"},
            },
            {
                "node_1": {"node_2"},
                "node_2": {"node_3"},
                "node_3": {"node_4"},
                "node_4": set(),
            },
            ["raw", "int"],
        ),
        (
            # indirect dependency
            "node_1(layer=raw) -> node_2 -> node_3(layer=int)",
            {
                "node_1": {"id": "node_1", "layer": "raw"},
                "node_2": {"id": "node_2"},
                "node_3": {"id": "node_3", "layer": "int"},
            },
            {"node_1": {"node_2"}, "node_2": {"node_3"}, "node_3": set()},
            ["raw", "int"],
        ),
        (
            # fan-in dependency
            """
        node_1(layer=raw) -> node_2 -> node_3(layer=int) -> node_6(layer=feature)
        node_4(layer=int) -> node_5 -----------------------------^
        """,
            {
                "node_1": {"id": "node_1", "layer": "raw"},
                "node_2": {"id": "node_2"},
                "node_3": {"id": "node_3", "layer": "int"},
                "node_4": {"id": "node_4", "layer": "int"},
                "node_5": {"id": "node_5"},
                "node_6": {"id": "node_6", "layer": "feature"},
            },
            {
                "node_1": {"node_2"},
                "node_2": {"node_3"},
                "node_3": {"node_6"},
                "node_4": {"node_5"},
                "node_5": {"node_6"},
                "node_6": set(),
            },
            ["raw", "int", "feature"],
        ),
        (
            # fan-out dependency: note that model_input comes after feature here based on
            # alphabetical order since they have no dependency relationship.
            """
        node_1(layer=raw) -> node_2 -> node_3(layer=int) -> node_6 -> node_7(layer=feature)
                |----------> node_4(layer=int) -> node_5(layer=model_input)
        """,
            {
                "node_1": {"id": "node_1", "layer": "raw"},
                "node_2": {"id": "node_2"},
                "node_3": {"id": "node_3", "layer": "int"},
                "node_4": {"id": "node_4", "layer": "int"},
                "node_5": {"id": "node_5", "layer": "model_input"},
                "node_6": {"id": "node_6"},
                "node_7": {"id": "node_7", "layer": "feature"},
            },
            {
                "node_1": {"node_2"},
                "node_2": {"node_3"},
                "node_3": {"node_6"},
                "node_4": {"node_5"},
                "node_5": set(),
                "node_6": {"node_7"},
                "node_7": set(),
            },
            ["raw", "int", "feature", "model_input"],
        ),
        (
            # fan-out-fan-in dependency
            """
        node_1(layer=raw) -> node_2 -> node_3(layer=int) -> node_6 -> node_7(layer=feature)
                |----------> node_4(layer=int) -> node_5(layer=model_input) --^
        """,
            {
                "node_1": {"id": "node_1", "layer": "raw"},
                "node_2": {"id": "node_2"},
                "node_3": {"id": "node_3", "layer": "int"},
                "node_4": {"id": "node_4", "layer": "int"},
                "node_5": {"id": "node_5", "layer": "model_input"},
                "node_6": {"id": "node_6"},
                "node_7": {"id": "node_7", "layer": "feature"},
            },
            {
                "node_1": {"node_2"},
                "node_2": {"node_3"},
                "node_3": {"node_6"},
                "node_4": {"node_5"},
                "node_5": {"node_7"},
                "node_6": {"node_7"},
                "node_7": set(),
            },
            ["raw", "int", "model_input", "feature"],
        ),
        (
            # disjoint dependency: when two groups of layers have no direct
            # dependencies,their order is determined by topological order first and
            # alphabetical order second, which is the default of the toposort library.
            # In the example below, toposort the layers will give [{c, d}, {b, a}],
            # so it will become [c, d, a, b] when flattened.
            """
            node_1(layer=c) -> node_2(layer=a)
            node_3(layer=d) -> node_4(layer=b)
            """,
            {
                "node_1": {"id": "node_1", "layer": "c"},
                "node_2": {"id": "node_2", "layer": "a"},
                "node_3": {"id": "node_3", "layer": "d"},
                "node_4": {"id": "node_4", "layer": "b"},
            },
            {"node_1": {"node_2"}, "node_2": {}, "node_3": {"node_4"}, "node_4": {}},
            ["c", "d", "a", "b"],
        ),
    ],
)
def test_sort_layers(graph_schema, nodes, node_dependencies, expected):
    assert _sort_layers(nodes, node_dependencies) == expected, graph_schema


def test_sort_layers_should_raise_on_cyclic_layers():
    # node_1(layer=raw) -> node_2(layer=int) -> node_3(layer=raw)
    nodes = {
        "node_1": {"id": "node_1", "layer": "raw"},
        "node_2": {"id": "node_2", "layer": "int"},
        "node_3": {"id": "node_3", "layer": "raw"},
    }
    node_dependencies = {"node_1": {"node_2"}, "node_2": {"node_3"}, "node_3": set()}
    with pytest.raises(
        CircularDependencyError,
        match="Circular dependencies exist among these items: {'int':{'raw'}, 'raw':{'int'}}",
    ):
        _sort_layers(nodes, node_dependencies)
