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
from typing import Dict
from unittest import mock

import pytest
from fastapi.testclient import TestClient
from kedro.io import DataCatalog
from kedro.pipeline import Pipeline

from kedro_viz.api import apps
from kedro_viz.data_access.managers import DataAccessManager
from kedro_viz.models.graph import TaskNode
from kedro_viz.server import populate_data


@pytest.fixture
def example_api(
    data_access_manager: DataAccessManager,
    example_pipelines: Dict[str, Pipeline],
    example_catalog: DataCatalog,
):
    api = apps.create_api_app_from_project()
    populate_data(data_access_manager, example_catalog, example_pipelines)
    with mock.patch(
        "kedro_viz.api.responses.data_access_manager", new=data_access_manager
    ), mock.patch("kedro_viz.api.router.data_access_manager", new=data_access_manager):
        yield api


@pytest.fixture
def client(example_api):
    yield TestClient(example_api)


def assert_nodes_equal(response_nodes, expected_nodes):
    node_sort_key = operator.itemgetter("id")
    for response_node, expected_node in zip(
        sorted(response_nodes, key=node_sort_key),
        sorted(expected_nodes, key=node_sort_key),
    ):
        response_node_tags = response_node.pop("tags")
        expected_node_tags = expected_node.pop("tags")
        assert sorted(response_node_tags) == sorted(expected_node_tags)
        assert response_node == expected_node


def assert_edges_equal(response_edges, expected_edges):
    edge_sort_key = operator.itemgetter("source")
    assert sorted(response_edges, key=edge_sort_key) == sorted(
        expected_edges, key=edge_sort_key
    )


def assert_example_data(response_data):
    """Assert graph response for the `example_pipelines` and `example_catalog` fixtures."""
    expected_edges = [
        {"source": "7b140b3f", "target": "d5a8b994"},
        {"source": "56118ad8", "target": "0ecea0de"},
        {"source": "13399a82", "target": "56118ad8"},
        {"source": "f1f1425b", "target": "7b140b3f"},
        {"source": "0ecea0de", "target": "7b140b3f"},
        {"source": "c506f374", "target": "56118ad8"},
    ]
    assert_edges_equal(response_data.pop("edges"), expected_edges)
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
            "name": "Uk.data Processing.raw Data",
            "full_name": "uk.data_processing.raw_data",
            "tags": ["split"],
            "pipelines": ["__default__", "data_processing"],
            "modular_pipelines": ["uk", "uk.data_processing"],
            "type": "data",
            "layer": "raw",
        },
        {
            "id": "c506f374",
            "name": "Params:train Test Split",
            "full_name": "params:train_test_split",
            "tags": ["split"],
            "pipelines": ["__default__", "data_processing"],
            "modular_pipelines": [],
            "type": "parameters",
            "layer": None,
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
        },
        {
            "id": "d5a8b994",
            "name": "Uk.data Science.model",
            "full_name": "uk.data_science.model",
            "tags": ["train"],
            "pipelines": ["__default__", "data_science"],
            "modular_pipelines": ["uk", "uk.data_science"],
            "type": "data",
            "layer": None,
        },
    ]
    assert_nodes_equal(response_data.pop("nodes"), expected_nodes)

    # compare the rest
    assert response_data == {
        "tags": [{"id": "split", "name": "Split"}, {"id": "train", "name": "Train"}],
        "layers": ["raw", "model_inputs"],
        "pipelines": [
            {"id": "__default__", "name": "Default"},
            {"id": "data_science", "name": "Data Science"},
            {"id": "data_processing", "name": "Data Processing"},
        ],
        "modular_pipelines": [
            {"id": "uk", "name": "Uk"},
            {"id": "uk.data_processing", "name": "Data Processing"},
            {"id": "uk.data_science", "name": "Data Science"},
        ],
        "selected_pipeline": "__default__",
    }


class TestIndexEndpoint:
    def test_index(self, client):
        response = client.get("/")
        assert response.status_code == 200


class TestMainEndpoint:
    """Test a viz API created from a Kedro project."""

    def test_endpoint_main(self, client):
        response = client.get("/api/main")
        assert response.status_code == 200
        assert_example_data(response.json())


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
        assert str(Path("package/tests/conftest.py")) in metadata["filepath"]

    def test_data_node_metadata(self, client):
        response = client.get("/api/nodes/0ecea0de")
        assert response.json() == {
            "filepath": "model_inputs.csv",
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
            {"source": "0ecea0de", "target": "7b140b3f"},
            {"source": "7b140b3f", "target": "d5a8b994"},
            {"source": "f1f1425b", "target": "7b140b3f"},
        ]
        assert_edges_equal(response_data.pop("edges"), expected_edges)
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
            },
            {
                "id": "d5a8b994",
                "name": "Uk.data Science.model",
                "full_name": "uk.data_science.model",
                "tags": ["train"],
                "pipelines": ["__default__", "data_science"],
                "modular_pipelines": ["uk", "uk.data_science"],
                "type": "data",
                "layer": None,
            },
        ]
        assert_nodes_equal(response_data.pop("nodes"), expected_nodes)
        assert response_data == {
            "tags": [
                {"id": "split", "name": "Split"},
                {"id": "train", "name": "Train"},
            ],
            "layers": ["raw", "model_inputs"],
            "pipelines": [
                {"id": "__default__", "name": "Default"},
                {"id": "data_science", "name": "Data Science"},
                {"id": "data_processing", "name": "Data Processing"},
            ],
            "modular_pipelines": [
                {"id": "uk", "name": "Uk"},
                {"id": "uk.data_science", "name": "Data Science"},
            ],
            "selected_pipeline": "data_science",
        }

    def test_get_non_existing_pipeline(self, client):
        response = client.get("/api/pipelines/foo")
        assert response.status_code == 404


class TestAPIAppFromFile:
    def test_api_app_from_json_file(self):
        filepath = str(Path(__file__).parent.parent / "example_pipelines.json")
        api_app = apps.create_api_app_from_file(filepath)
        client = TestClient(api_app)
        response = client.get("/api/main")
        assert_example_data(response.json())
