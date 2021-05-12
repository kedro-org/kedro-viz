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

"""
This file contains the fixtures that are reusable by any tests within
this directory. You don't need to import the fixtures as pytest will
discover them automatically. More info here:
https://docs.pytest.org/en/latest/fixture.html
"""
import pytest
from kedro.extras.datasets.pandas import CSVDataSet
from kedro.io import DataCatalog
from kedro.pipeline import Pipeline, node
from kedro.pipeline.modular_pipeline import pipeline

from kedro_viz.data_access import DataAccessManager


@pytest.fixture
def data_access_manager():
    yield DataAccessManager()


@pytest.fixture
def example_pipelines():
    def process_data(raw_data, train_test_split):
        ...

    def train_model(model_inputs, parameters):
        ...

    data_processing_pipeline = pipeline(
        Pipeline(
            [
                node(
                    process_data,
                    inputs=["raw_data", "params:train_test_split"],
                    outputs="model_inputs",
                    name="process_data",
                    tags=["split"],
                )
            ]
        ),
        namespace="uk.data_processing",
        outputs="model_inputs",
    )
    data_science_pipeline = pipeline(
        Pipeline(
            [
                node(
                    train_model,
                    inputs=["model_inputs", "parameters"],
                    outputs="model",
                    name="train_model",
                    tags=["train"],
                )
            ]
        ),
        namespace="uk.data_science",
        inputs="model_inputs",
    )
    yield {
        "__default__": data_processing_pipeline + data_science_pipeline,
        "data_science": data_science_pipeline,
        "data_processing": data_processing_pipeline,
    }


@pytest.fixture
def example_catalog():
    yield DataCatalog(
        data_sets={
            "raw_data": CSVDataSet(filepath="raw_data.csv"),
            "model_inputs": CSVDataSet(filepath="model_inputs.csv"),
        },
        feed_dict={
            "parameters": {"train_test_split": 0.1, "num_epochs": 1000},
            "params:train_test_split": 0.1,
        },
        layers={"raw": {"raw_data",}, "model_inputs": {"model_inputs",}},
    )


def assert_nodes_equal(response_nodes, expected_nodes):
    node_sort_key = lambda x: x["id"]
    for response_node, expected_node in zip(
        sorted(response_nodes, key=node_sort_key),
        sorted(expected_nodes, key=node_sort_key),
    ):
        response_node_tags = response_node.pop("tags")
        expected_node_tags = expected_node.pop("tags")
        assert sorted(response_node_tags) == sorted(expected_node_tags)
        assert response_node == expected_node


def assert_edges_equal(response_edges, expected_edges):
    edge_sort_key = lambda x: x["source"]
    assert sorted(response_edges, key=edge_sort_key) == sorted(
        expected_edges, key=edge_sort_key
    )


@pytest.fixture
def assert_example_data():
    """Assert a json response against the example pipelines data above"""

    def _assert_graph_response(response_data):
        """Assert graph response for the `example_pipelines` and `example_catalog`
        fixtures."""
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
                "layer": None,
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
            "tags": ["split", "train"],
            "layers": [],
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

    yield _assert_graph_response
