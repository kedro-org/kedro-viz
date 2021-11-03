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
import operator
from pathlib import Path
from typing import Any, Dict, Iterable, List
from unittest import mock

import pytest
from fastapi.testclient import TestClient

from kedro_viz.api import apps
from kedro_viz.models.graph import TaskNode


def assert_nodes_equal(response_nodes, expected_nodes):
    node_sort_keys = operator.itemgetter("id")
    for response_node, expected_node in zip(
        sorted(response_nodes, key=node_sort_keys),
        sorted(expected_nodes, key=node_sort_keys),
    ):
        # since tags and pipelines are Sets, which are unordered,
        # to assert them, we have to sort first
        response_node_tags = response_node.pop("tags")
        expected_node_tags = expected_node.pop("tags")
        assert sorted(response_node_tags) == sorted(expected_node_tags)

        response_node_pipelines = response_node.pop("pipelines")
        expected_node_pipelines = expected_node.pop("pipelines")
        assert sorted(response_node_pipelines) == sorted(expected_node_pipelines)

        assert response_node == expected_node


def _is_dict_list(collection: Any) -> bool:
    if isinstance(collection, list):
        return isinstance(collection[0], dict) if len(collection) > 0 else True
    return False


def assert_dict_list_equal(
    response: List[Dict], expected: List[Dict], sort_keys: Iterable[str]
):
    """Assert two list of dictionaries with undeterministic order
    to be equal by sorting them first based on a sort key.
    """
    if len(response) == 0:
        assert len(expected) == 0
        return

    assert sorted(response, key=operator.itemgetter(*sort_keys)) == sorted(
        expected, key=operator.itemgetter(*sort_keys)
    )


def assert_modular_pipelines_tree_equal(response: Dict, expected: Dict):
    """Assert if modular pipelines tree are equal."""
    # first assert that they have the same set of keys
    assert sorted(response.keys()) == sorted(expected.keys())

    # then compare the dictionary at each key recursively
    for key in response:
        if isinstance(response[key], dict):
            assert_modular_pipelines_tree_equal(response[key], expected[key])
        elif _is_dict_list(response[key]):
            assert_dict_list_equal(response[key], expected[key], sort_keys=("id",))
        elif isinstance(response[key], list):
            assert sorted(response[key]) == sorted(expected[key])
        else:
            assert response[key] == expected[key]


def assert_example_data(response_data):
    """Assert graph response for the `example_pipelines` and `example_catalog` fixtures."""
    expected_edges = [
        {"source": "7b140b3f", "target": "d5a8b994"},
        {"source": "56118ad8", "target": "0ecea0de"},
        {"source": "13399a82", "target": "56118ad8"},
        {"source": "f1f1425b", "target": "7b140b3f"},
        {"source": "0ecea0de", "target": "7b140b3f"},
        {"source": "c506f374", "target": "56118ad8"},
        {"source": "13399a82", "target": "uk.data_processing"},
        {"source": "uk.data_processing", "target": "0ecea0de"},
        {"source": "c506f374", "target": "uk.data_processing"},
        {"source": "f1f1425b", "target": "uk"},
        {"source": "13399a82", "target": "uk"},
        {"source": "f1f1425b", "target": "uk.data_science"},
        {"source": "c506f374", "target": "uk"},
        {"source": "uk.data_science", "target": "d5a8b994"},
        {"source": "0ecea0de", "target": "uk.data_science"},
        {"source": "uk", "target": "d5a8b994"},
    ]
    assert_dict_list_equal(
        response_data.pop("edges"), expected_edges, sort_keys=("source", "target")
    )
    # compare nodes
    expected_nodes = [
        {
            "id": "56118ad8",
            "name": "Process Data",
            "full_name": "process_data",
            "tags": ["split"],
            "pipelines": ["__default__", "data_processing"],
            "modular_pipelines": ["uk", "uk.data_processing"],
            "type": "task",
            "parameters": {"train_test_split": 0.1},
        },
        {
            "id": "13399a82",
            "name": "Raw Data",
            "full_name": "uk.data_processing.raw_data",
            "tags": ["split"],
            "pipelines": ["__default__", "data_processing"],
            "modular_pipelines": ["uk", "uk.data_processing"],
            "type": "data",
            "layer": "raw",
            "dataset_type": "kedro.extras.datasets.pandas.csv_dataset.CSVDataSet",
        },
        {
            "id": "c506f374",
            "name": "Params: Train Test Split",
            "full_name": "params:train_test_split",
            "tags": ["split"],
            "pipelines": ["__default__", "data_processing"],
            "modular_pipelines": [],
            "type": "parameters",
            "layer": None,
            "dataset_type": None,
        },
        {
            "id": "0ecea0de",
            "name": "Model Inputs",
            "full_name": "model_inputs",
            "tags": ["train", "split"],
            "pipelines": ["__default__", "data_science", "data_processing"],
            "modular_pipelines": [],
            "type": "data",
            "layer": "model_inputs",
            "dataset_type": "kedro.extras.datasets.pandas.csv_dataset.CSVDataSet",
        },
        {
            "id": "7b140b3f",
            "name": "Train Model",
            "full_name": "train_model",
            "tags": ["train"],
            "pipelines": ["__default__", "data_science"],
            "modular_pipelines": ["uk", "uk.data_science"],
            "type": "task",
            "parameters": {"train_test_split": 0.1, "num_epochs": 1000},
        },
        {
            "id": "f1f1425b",
            "name": "Parameters",
            "full_name": "parameters",
            "tags": ["train"],
            "pipelines": ["__default__", "data_science"],
            "modular_pipelines": [],
            "type": "parameters",
            "layer": None,
            "dataset_type": None,
        },
        {
            "id": "d5a8b994",
            "name": "Model",
            "full_name": "uk.data_science.model",
            "tags": ["train"],
            "pipelines": ["__default__", "data_science"],
            "modular_pipelines": ["uk", "uk.data_science"],
            "type": "data",
            "layer": None,
            "dataset_type": "kedro.io.memory_data_set.MemoryDataSet",
        },
        {
            "id": "uk.data_processing",
            "name": "Data Processing",
            "full_name": "uk.data_processing",
            "tags": [],
            "pipelines": ["__default__", "data_processing"],
            "type": "modularPipeline",
            "modular_pipelines": None,
            "layer": None,
            "dataset_type": None,
        },
        {
            "id": "uk.data_science",
            "name": "Data Science",
            "full_name": "uk.data_science",
            "tags": [],
            "pipelines": ["__default__", "data_science"],
            "type": "modularPipeline",
            "modular_pipelines": None,
            "layer": None,
            "dataset_type": None,
        },
        {
            "id": "uk",
            "name": "Uk",
            "full_name": "uk",
            "tags": [],
            "pipelines": ["__default__", "data_processing", "data_science"],
            "type": "modularPipeline",
            "modular_pipelines": None,
            "layer": None,
            "dataset_type": None,
        },
    ]
    assert_nodes_equal(response_data.pop("nodes"), expected_nodes)

    # compare modular pipelines
    expected_modular_pipelines = {
        "__root__": {
            "children": [
                {"id": "0ecea0de", "type": "data"},
                {"id": "f1f1425b", "type": "parameters"},
                {"id": "c506f374", "type": "parameters"},
                {"id": "uk", "type": "modularPipeline"},
            ],
            "id": "__root__",
            "inputs": [],
            "name": "Root",
            "outputs": [],
        },
        "uk": {
            "children": [
                {"id": "uk.data_science", "type": "modularPipeline"},
                {"id": "uk.data_processing", "type": "modularPipeline"},
            ],
            "id": "uk",
            "inputs": ["c506f374", "13399a82", "f1f1425b"],
            "name": "Uk",
            "outputs": ["d5a8b994"],
        },
        "uk.data_processing": {
            "children": [
                {"id": "13399a82", "type": "data"},
                {"id": "56118ad8", "type": "task"},
            ],
            "id": "uk.data_processing",
            "inputs": ["c506f374", "13399a82"],
            "name": "Data Processing",
            "outputs": ["0ecea0de"],
        },
        "uk.data_science": {
            "children": [
                {"id": "7b140b3f", "type": "task"},
                {"id": "d5a8b994", "type": "data"},
            ],
            "id": "uk.data_science",
            "inputs": ["0ecea0de", "f1f1425b"],
            "name": "Data Science",
            "outputs": ["d5a8b994"],
        },
    }
    assert_modular_pipelines_tree_equal(
        response_data.pop("modular_pipelines"), expected_modular_pipelines
    )

    # compare the rest
    assert response_data == {
        "tags": [{"id": "split", "name": "Split"}, {"id": "train", "name": "Train"}],
        "layers": ["raw", "model_inputs"],
        "pipelines": [
            {"id": "__default__", "name": "Default"},
            {"id": "data_science", "name": "Data Science"},
            {"id": "data_processing", "name": "Data Processing"},
        ],
        "selected_pipeline": "__default__",
    }


def assert_example_transcoded_data(response_data):
    """Assert graph response for the `example_transcoded_pipelines`
    and `example_transcoded_catalog` fixtures."""
    expected_edges = [
        {"source": "f1f1425b", "target": "2302ea78"},
        {"source": "dbad7c24", "target": "0ecea0de"},
        {"source": "c506f374", "target": "dbad7c24"},
        {"source": "7c58d8e6", "target": "dbad7c24"},
        {"source": "2302ea78", "target": "1d06a0d7"},
        {"source": "0ecea0de", "target": "2302ea78"},
    ]
    assert_dict_list_equal(
        response_data.pop("edges"), expected_edges, sort_keys=("source", "target")
    )
    # compare nodes
    expected_nodes = [
        {
            "id": "dbad7c24",
            "name": "Process Data",
            "full_name": "process_data",
            "tags": ["split"],
            "pipelines": ["__default__", "data_processing"],
            "modular_pipelines": [],
            "type": "task",
            "parameters": {"train_test_split": 0.1},
        },
        {
            "id": "7c58d8e6",
            "name": "Raw Data",
            "full_name": "raw_data",
            "tags": ["split"],
            "pipelines": ["__default__", "data_processing"],
            "modular_pipelines": [],
            "type": "data",
            "layer": None,
            "dataset_type": None,
        },
        {
            "id": "c506f374",
            "name": "Params: Train Test Split",
            "full_name": "params:train_test_split",
            "tags": ["split"],
            "pipelines": ["__default__", "data_processing"],
            "modular_pipelines": [],
            "type": "parameters",
            "layer": None,
            "dataset_type": None,
        },
        {
            "id": "0ecea0de",
            "name": "Model Inputs",
            "full_name": "model_inputs",
            "tags": ["train", "split"],
            "pipelines": ["__default__", "data_processing"],
            "modular_pipelines": [],
            "type": "data",
            "layer": None,
            "dataset_type": None,
        },
        {
            "id": "2302ea78",
            "name": "Train Model",
            "full_name": "train_model",
            "tags": ["train"],
            "pipelines": ["__default__", "data_processing"],
            "modular_pipelines": [],
            "type": "task",
            "parameters": {"train_test_split": 0.1, "num_epochs": 1000},
        },
        {
            "id": "f1f1425b",
            "name": "Parameters",
            "full_name": "parameters",
            "tags": ["train"],
            "pipelines": ["__default__", "data_processing"],
            "modular_pipelines": [],
            "type": "parameters",
            "layer": None,
            "dataset_type": None,
        },
        {
            "id": "1d06a0d7",
            "name": "Model",
            "full_name": "model",
            "tags": ["train"],
            "pipelines": ["__default__", "data_processing"],
            "modular_pipelines": [],
            "type": "data",
            "layer": None,
            "dataset_type": None,
        },
    ]

    assert_nodes_equal(response_data.pop("nodes"), expected_nodes)


class TestIndexEndpoint:
    def test_index(self, client):
        response = client.get("/")
        assert response.status_code == 200
        assert "heap" not in response.text
        assert "checkReloadStatus" not in response.text

    @mock.patch("kedro_viz.integrations.kedro.telemetry.get_heap_app_id")
    @mock.patch("kedro_viz.integrations.kedro.telemetry.get_heap_identity")
    def test_heap_enabled(
        self, mock_get_heap_identity, mock_get_heap_app_id, client, tmpdir
    ):
        mock_get_heap_app_id.return_value = "my_heap_app"
        mock_get_heap_identity.return_value = "my_heap_identity"
        response = client.get("/")
        assert response.status_code == 200
        assert 'heap.load("my_heap_app")' in response.text
        assert 'heap.identify("my_heap_identity")' in response.text


@pytest.fixture
def example_autoreload_api():
    yield apps.create_api_app_from_project(mock.MagicMock(), autoreload=True)


class TestReloadEndpoint:
    def test_autoreload_script_added_to_index(self, example_autoreload_api):
        client = TestClient(example_autoreload_api)
        response = client.get("/")
        assert response.status_code == 200
        assert "checkReloadStatus" in response.text

    def test_reload_endpoint_return_400_when_header_not_set(
        self, example_autoreload_api
    ):
        client = TestClient(example_autoreload_api)
        response = client.get("/api/reload")
        assert response.status_code == 400

    @mock.patch("kedro_viz.api.apps._create_etag")
    def test_reload_endpoint_return_304_when_content_has_not_changed(
        self, patched_create_etag
    ):
        patched_create_etag.return_value = "old etag"
        api = apps.create_api_app_from_project(mock.MagicMock(), autoreload=True)

        client = TestClient(api)

        # if the client sends an If-None-Match header with the same value as the etag value
        # on the server, the server should return a 304
        response = client.get("/api/reload", headers={"If-None-Match": "old etag"})
        assert response.status_code == 304

        # when the etag has changed, the server will return a 200
        response = client.get("/api/reload", headers={"If-None-Match": "new etag"})
        assert response.status_code == 200


class TestMainEndpoint:
    """Test a viz API created from a Kedro project."""

    def test_endpoint_main(self, client):
        response = client.get("/api/main")
        assert response.status_code == 200
        assert_example_data(response.json())

    def test_endpoint_main_no_session_store(self, example_api_no_session_store):
        client = TestClient(example_api_no_session_store)
        response = client.get("/api/main")
        assert response.status_code == 200
        assert_example_data(response.json())


class TestTranscodedDataset:
    """Test a viz API created from a Kedro project."""

    def test_endpoint_main(self, example_transcoded_api):
        client = TestClient(example_transcoded_api)
        response = client.get("/api/main")
        assert response.status_code == 200
        assert_example_transcoded_data(response.json())

    def test_transcoded_data_node_metadata(self, example_transcoded_api):
        client = TestClient(example_transcoded_api)
        response = client.get("/api/nodes/0ecea0de")
        assert response.json() == {
            "filepath": "model_inputs.csv",
            "original_type": "kedro.extras.datasets.spark.spark_dataset.SparkDataSet",
            "transcoded_types": [
                "kedro.extras.datasets.pandas.parquet_dataset.ParquetDataSet"
            ],
            "run_command": 'kedro run --to-outputs="model_inputs@spark"',
        }


class TestNodeMetadataEndpoint:
    def test_node_not_exist(self, client):
        response = client.get("/api/nodes/foo")
        assert response.status_code == 404

    def test_task_node_metadata(self, client):
        response = client.get("/api/nodes/56118ad8")
        metadata = response.json()
        assert (
            metadata["code"].lstrip()
            == "def process_data(raw_data, train_test_split):\n        ...\n"
        )
        assert metadata["parameters"] == {"train_test_split": 0.1}
        assert metadata["inputs"] == ["Raw Data", "Params: Train Test Split"]
        assert metadata["outputs"] == ["Model Inputs"]
        assert metadata["run_command"] == 'kedro run --to-nodes="process_data"'
        assert str(Path("package/tests/conftest.py")) in metadata["filepath"]

    def test_data_node_metadata(self, client):
        response = client.get("/api/nodes/0ecea0de")
        assert response.json() == {
            "filepath": "model_inputs.csv",
            "type": "kedro.extras.datasets.pandas.csv_dataset.CSVDataSet",
            "run_command": 'kedro run --to-outputs="model_inputs"',
        }

    def test_data_node_metadata_for_free_input(self, client):
        response = client.get("/api/nodes/13399a82")
        assert response.json() == {
            "filepath": "raw_data.csv",
            "type": "kedro.extras.datasets.pandas.csv_dataset.CSVDataSet",
        }

    def test_parameters_node_metadata(self, client):
        response = client.get("/api/nodes/f1f1425b")
        assert response.json() == {
            "parameters": {"train_test_split": 0.1, "num_epochs": 1000}
        }

    def test_single_parameter_node_metadata(self, client):
        response = client.get("/api/nodes/c506f374")
        assert response.json() == {"parameters": {"train_test_split": 0.1}}

    def test_no_metadata(self, client):
        with mock.patch.object(TaskNode, "has_metadata", return_value=False):
            response = client.get("/api/nodes/56118ad8")
        assert response.json() == {}


class TestSinglePipelineEndpoint:
    def test_get_pipeline(self, client):
        response = client.get("/api/pipelines/data_science")
        assert response.status_code == 200
        response_data = response.json()
        expected_edges = [
            {"source": "7b140b3f", "target": "d5a8b994"},
            {"source": "f1f1425b", "target": "uk.data_science"},
            {"source": "f1f1425b", "target": "7b140b3f"},
            {"source": "uk.data_science", "target": "d5a8b994"},
            {"source": "uk", "target": "d5a8b994"},
            {"source": "0ecea0de", "target": "uk"},
            {"source": "0ecea0de", "target": "uk.data_science"},
            {"source": "f1f1425b", "target": "uk"},
            {"source": "0ecea0de", "target": "7b140b3f"},
        ]
        assert_dict_list_equal(
            response_data.pop("edges"), expected_edges, sort_keys=("source", "target")
        )
        expected_nodes = [
            {
                "id": "0ecea0de",
                "name": "Model Inputs",
                "full_name": "model_inputs",
                "tags": ["train", "split"],
                "pipelines": ["__default__", "data_science", "data_processing"],
                "modular_pipelines": [],
                "type": "data",
                "layer": "model_inputs",
                "dataset_type": "kedro.extras.datasets.pandas.csv_dataset.CSVDataSet",
            },
            {
                "id": "7b140b3f",
                "name": "Train Model",
                "full_name": "train_model",
                "tags": ["train"],
                "pipelines": ["__default__", "data_science"],
                "modular_pipelines": ["uk", "uk.data_science"],
                "type": "task",
                "parameters": {"train_test_split": 0.1, "num_epochs": 1000},
            },
            {
                "id": "f1f1425b",
                "name": "Parameters",
                "full_name": "parameters",
                "tags": ["train"],
                "pipelines": ["__default__", "data_science"],
                "modular_pipelines": [],
                "type": "parameters",
                "layer": None,
                "dataset_type": None,
            },
            {
                "id": "d5a8b994",
                "name": "Model",
                "full_name": "uk.data_science.model",
                "tags": ["train"],
                "pipelines": ["__default__", "data_science"],
                "modular_pipelines": ["uk", "uk.data_science"],
                "type": "data",
                "layer": None,
                "dataset_type": "kedro.io.memory_data_set.MemoryDataSet",
            },
            {
                "id": "uk",
                "name": "Uk",
                "full_name": "uk",
                "tags": [],
                "pipelines": ["data_science", "__default__"],
                "type": "modularPipeline",
                "modular_pipelines": None,
                "layer": None,
                "dataset_type": None,
            },
            {
                "id": "uk.data_science",
                "name": "Data Science",
                "full_name": "uk.data_science",
                "tags": [],
                "pipelines": ["data_science", "__default__"],
                "type": "modularPipeline",
                "modular_pipelines": None,
                "layer": None,
                "dataset_type": None,
            },
        ]
        assert_nodes_equal(response_data.pop("nodes"), expected_nodes)

        expected_modular_pipelines = {
            "__root__": {
                "children": [
                    {"id": "f1f1425b", "type": "parameters"},
                    {"id": "0ecea0de", "type": "data"},
                    {"id": "uk", "type": "modularPipeline"},
                ],
                "id": "__root__",
                "inputs": [],
                "name": "Root",
                "outputs": [],
            },
            "uk": {
                "children": [
                    {"id": "uk.data_science", "type": "modularPipeline"},
                ],
                "id": "uk",
                "inputs": ["0ecea0de", "f1f1425b"],
                "name": "Uk",
                "outputs": ["d5a8b994"],
            },
            "uk.data_science": {
                "children": [
                    {"id": "d5a8b994", "type": "data"},
                    {"id": "7b140b3f", "type": "task"},
                ],
                "id": "uk.data_science",
                "inputs": ["0ecea0de", "f1f1425b"],
                "name": "Data Science",
                "outputs": ["d5a8b994"],
            },
        }

        assert_modular_pipelines_tree_equal(
            response_data.pop("modular_pipelines"),
            expected_modular_pipelines,
        )
        assert response_data == {
            "tags": [
                {"id": "split", "name": "Split"},
                {"id": "train", "name": "Train"},
            ],
            "layers": ["model_inputs", "raw"],
            "pipelines": [
                {"id": "__default__", "name": "Default"},
                {"id": "data_science", "name": "Data Science"},
                {"id": "data_processing", "name": "Data Processing"},
            ],
            "selected_pipeline": "data_science",
        }

    def test_get_non_existing_pipeline(self, client):
        response = client.get("/api/pipelines/foo")
        assert response.status_code == 404


class TestAPIAppFromFile:
    def test_api_app_from_json_file_main_api(self):
        filepath = str(Path(__file__).parent.parent / "example_pipelines.json")
        api_app = apps.create_api_app_from_file(filepath)
        client = TestClient(api_app)
        response = client.get("/api/main")
        assert_example_data(response.json())

    def test_api_app_from_json_file_index(self):
        filepath = str(Path(__file__).parent.parent / "example_pipelines.json")
        api_app = apps.create_api_app_from_file(filepath)
        client = TestClient(api_app)
        response = client.get("/")
        assert response.status_code == 200
