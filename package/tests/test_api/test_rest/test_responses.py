# pylint: disable=too-many-lines
import operator
from pathlib import Path
from typing import Any, Dict, Iterable, List
from unittest import mock
from unittest.mock import Mock, call, patch

import pytest
from fastapi.testclient import TestClient

from kedro_viz.api import apps
from kedro_viz.api.rest.responses import (
    EnhancedORJSONResponse,
    get_package_compatibilities_response,
    save_api_main_response_to_fs,
    save_api_node_response_to_fs,
    save_api_pipeline_response_to_fs,
    save_api_responses_to_fs,
    write_api_response_to_fs,
)
from kedro_viz.models.flowchart import TaskNode


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
        {"source": "f2e4bf0e", "target": "0ecea0de"},
        {"source": "13399a82", "target": "f2e4bf0e"},
        {"source": "f1f1425b", "target": "7b140b3f"},
        {"source": "0ecea0de", "target": "7b140b3f"},
        {"source": "f0ebef01", "target": "f2e4bf0e"},
        {"source": "13399a82", "target": "uk.data_processing"},
        {"source": "uk.data_processing", "target": "0ecea0de"},
        {"source": "f0ebef01", "target": "uk.data_processing"},
        {"source": "f1f1425b", "target": "uk"},
        {"source": "13399a82", "target": "uk"},
        {"source": "f1f1425b", "target": "uk.data_science"},
        {"source": "f0ebef01", "target": "uk"},
        {"source": "uk.data_science", "target": "d5a8b994"},
        {"source": "0ecea0de", "target": "uk.data_science"},
        {"source": "uk", "target": "d5a8b994"},
        {"source": "uk", "target": "0ecea0de"},
    ]
    assert_dict_list_equal(
        response_data.pop("edges"), expected_edges, sort_keys=("source", "target")
    )
    # compare nodes
    expected_nodes = [
        {
            "id": "f2e4bf0e",
            "name": "process_data",
            "tags": ["split"],
            "pipelines": ["__default__", "data_processing"],
            "modular_pipelines": ["uk", "uk.data_processing"],
            "type": "task",
            "parameters": {"uk.data_processing.train_test_split": 0.1},
        },
        {
            "id": "13399a82",
            "name": "uk.data_processing.raw_data",
            "tags": ["split"],
            "pipelines": ["__default__", "data_processing"],
            "modular_pipelines": ["uk", "uk.data_processing"],
            "type": "data",
            "layer": "raw",
            "dataset_type": "pandas.csv_dataset.CSVDataset",
            "stats": None,
        },
        {
            "id": "f0ebef01",
            "name": "params:uk.data_processing.train_test_split",
            "tags": ["split"],
            "pipelines": ["__default__", "data_processing"],
            "modular_pipelines": ["uk", "uk.data_processing"],
            "type": "parameters",
            "layer": None,
            "dataset_type": None,
            "stats": None,
        },
        {
            "id": "0ecea0de",
            "name": "model_inputs",
            "tags": ["train", "split"],
            "pipelines": ["__default__", "data_science", "data_processing"],
            "modular_pipelines": [],
            "type": "data",
            "layer": "model_inputs",
            "dataset_type": "pandas.csv_dataset.CSVDataset",
            "stats": {"columns": 12, "rows": 29768},
        },
        {
            "id": "7b140b3f",
            "name": "train_model",
            "tags": ["train"],
            "pipelines": ["__default__", "data_science"],
            "modular_pipelines": ["uk", "uk.data_science"],
            "type": "task",
            "parameters": {
                "train_test_split": 0.1,
                "num_epochs": 1000,
            },
        },
        {
            "id": "f1f1425b",
            "name": "parameters",
            "tags": ["train"],
            "pipelines": ["__default__", "data_science"],
            "modular_pipelines": [],
            "type": "parameters",
            "layer": None,
            "dataset_type": None,
            "stats": None,
        },
        {
            "id": "d5a8b994",
            "name": "uk.data_science.model",
            "tags": ["train"],
            "pipelines": ["__default__", "data_science"],
            "modular_pipelines": ["uk", "uk.data_science"],
            "type": "data",
            "layer": None,
            "dataset_type": "io.memory_dataset.MemoryDataset",
            "stats": None,
        },
        {
            "id": "uk.data_processing",
            "name": "uk.data_processing",
            "tags": [],
            "pipelines": ["__default__"],
            "type": "modularPipeline",
            "modular_pipelines": None,
            "layer": None,
            "dataset_type": None,
            "stats": None,
        },
        {
            "id": "uk.data_science",
            "name": "uk.data_science",
            "tags": [],
            "pipelines": ["__default__"],
            "type": "modularPipeline",
            "modular_pipelines": None,
            "layer": None,
            "dataset_type": None,
            "stats": None,
        },
        {
            "id": "uk",
            "name": "uk",
            "tags": [],
            "pipelines": ["__default__"],
            "type": "modularPipeline",
            "modular_pipelines": None,
            "layer": None,
            "dataset_type": None,
            "stats": None,
        },
    ]
    assert_nodes_equal(response_data.pop("nodes"), expected_nodes)

    # compare modular pipelines
    expected_modular_pipelines = {
        "__root__": {
            "children": [
                {"id": "0ecea0de", "type": "data"},
                {"id": "f1f1425b", "type": "parameters"},
                {"id": "f0ebef01", "type": "parameters"},
                {"id": "uk", "type": "modularPipeline"},
            ],
            "id": "__root__",
            "inputs": [],
            "name": "__root__",
            "outputs": [],
        },
        "uk": {
            "children": [
                {"id": "uk.data_science", "type": "modularPipeline"},
                {"id": "uk.data_processing", "type": "modularPipeline"},
            ],
            "id": "uk",
            "inputs": ["f0ebef01", "13399a82", "f1f1425b", "0ecea0de"],
            "name": "uk",
            "outputs": ["d5a8b994", "0ecea0de"],
        },
        "uk.data_processing": {
            "children": [
                {"id": "13399a82", "type": "data"},
                {"id": "f2e4bf0e", "type": "task"},
            ],
            "id": "uk.data_processing",
            "inputs": ["f0ebef01", "13399a82"],
            "name": "uk.data_processing",
            "outputs": ["0ecea0de"],
        },
        "uk.data_science": {
            "children": [
                {"id": "7b140b3f", "type": "task"},
                {"id": "d5a8b994", "type": "data"},
            ],
            "id": "uk.data_science",
            "inputs": ["0ecea0de", "f1f1425b"],
            "name": "uk.data_science",
            "outputs": ["d5a8b994"],
        },
    }
    assert_modular_pipelines_tree_equal(
        response_data.pop("modular_pipelines"), expected_modular_pipelines
    )

    # compare the rest
    assert response_data == {
        "tags": [{"id": "split", "name": "split"}, {"id": "train", "name": "train"}],
        "layers": ["raw", "model_inputs"],
        "pipelines": [
            {"id": "__default__", "name": "__default__"},
            {"id": "data_science", "name": "data_science"},
            {"id": "data_processing", "name": "data_processing"},
        ],
        "selected_pipeline": "__default__",
    }


def assert_example_data_from_file(response_data):
    """Assert graph response for the `example_pipelines` and `example_catalog` fixtures."""
    expected_edges = [
        {"source": "7b140b3f", "target": "d5a8b994"},
        {"source": "f2e4bf0e", "target": "0ecea0de"},
        {"source": "13399a82", "target": "f2e4bf0e"},
        {"source": "f1f1425b", "target": "7b140b3f"},
        {"source": "0ecea0de", "target": "7b140b3f"},
        {"source": "f0ebef01", "target": "f2e4bf0e"},
        {"source": "13399a82", "target": "uk.data_processing"},
        {"source": "uk.data_processing", "target": "0ecea0de"},
        {"source": "f0ebef01", "target": "uk.data_processing"},
        {"source": "f1f1425b", "target": "uk"},
        {"source": "13399a82", "target": "uk"},
        {"source": "f1f1425b", "target": "uk.data_science"},
        {"source": "f0ebef01", "target": "uk"},
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
            "id": "f2e4bf0e",
            "name": "process_data",
            "tags": ["split"],
            "pipelines": ["__default__", "data_processing"],
            "modular_pipelines": ["uk", "uk.data_processing"],
            "type": "task",
            "parameters": {"uk.data_processing.train_test_split": 0.1},
        },
        {
            "id": "13399a82",
            "name": "uk.data_processing.raw_data",
            "tags": ["split"],
            "pipelines": ["__default__", "data_processing"],
            "modular_pipelines": ["uk", "uk.data_processing"],
            "type": "data",
            "layer": "raw",
            "dataset_type": "pandas.csv_dataset.CSVDataset",
        },
        {
            "id": "f0ebef01",
            "name": "params:uk.data_processing.train_test_split",
            "tags": ["split"],
            "pipelines": ["__default__", "data_processing"],
            "modular_pipelines": ["uk", "uk.data_processing"],
            "type": "parameters",
            "layer": None,
            "dataset_type": None,
        },
        {
            "id": "0ecea0de",
            "name": "model_inputs",
            "tags": ["train", "split"],
            "pipelines": ["__default__", "data_science", "data_processing"],
            "modular_pipelines": [],
            "type": "data",
            "layer": "model_inputs",
            "dataset_type": "pandas.csv_dataset.CSVDataset",
        },
        {
            "id": "7b140b3f",
            "name": "train_model",
            "tags": ["train"],
            "pipelines": ["__default__", "data_science"],
            "modular_pipelines": ["uk", "uk.data_science"],
            "type": "task",
            "parameters": {
                "train_test_split": 0.1,
                "num_epochs": 1000,
            },
        },
        {
            "id": "f1f1425b",
            "name": "parameters",
            "tags": ["train"],
            "pipelines": ["__default__", "data_science"],
            "modular_pipelines": [],
            "type": "parameters",
            "layer": None,
            "dataset_type": None,
        },
        {
            "id": "d5a8b994",
            "name": "uk.data_science.model",
            "tags": ["train"],
            "pipelines": ["__default__", "data_science"],
            "modular_pipelines": ["uk", "uk.data_science"],
            "type": "data",
            "layer": None,
            "dataset_type": "io.memory_dataset.MemoryDataset",
        },
        {
            "id": "uk.data_processing",
            "name": "uk.data_processing",
            "tags": [],
            "pipelines": ["__default__"],
            "type": "modularPipeline",
            "modular_pipelines": None,
            "layer": None,
            "dataset_type": None,
        },
        {
            "id": "uk.data_science",
            "name": "uk.data_science",
            "tags": [],
            "pipelines": ["__default__"],
            "type": "modularPipeline",
            "modular_pipelines": None,
            "layer": None,
            "dataset_type": None,
        },
        {
            "id": "uk",
            "name": "uk",
            "tags": [],
            "pipelines": ["__default__"],
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
                {"id": "uk", "type": "modularPipeline"},
            ],
            "id": "__root__",
            "inputs": [],
            "name": "__root__",
            "outputs": [],
        },
        "uk": {
            "children": [
                {"id": "uk.data_science", "type": "modularPipeline"},
                {"id": "uk.data_processing", "type": "modularPipeline"},
            ],
            "id": "uk",
            "inputs": ["f0ebef01", "13399a82", "f1f1425b"],
            "name": "uk",
            "outputs": ["d5a8b994"],
        },
        "uk.data_processing": {
            "children": [
                {"id": "13399a82", "type": "data"},
                {"id": "f2e4bf0e", "type": "task"},
            ],
            "id": "uk.data_processing",
            "inputs": ["f0ebef01", "13399a82"],
            "name": "uk.data_processing",
            "outputs": ["0ecea0de"],
        },
        "uk.data_science": {
            "children": [
                {"id": "7b140b3f", "type": "task"},
                {"id": "d5a8b994", "type": "data"},
            ],
            "id": "uk.data_science",
            "inputs": ["0ecea0de", "f1f1425b"],
            "name": "uk.data_science",
            "outputs": ["d5a8b994"],
        },
    }
    assert_modular_pipelines_tree_equal(
        response_data.pop("modular_pipelines"), expected_modular_pipelines
    )

    # compare the rest
    assert response_data == {
        "tags": [{"id": "split", "name": "split"}, {"id": "train", "name": "train"}],
        "layers": ["raw", "model_inputs"],
        "pipelines": [
            {"id": "__default__", "name": "__default__"},
            {"id": "data_science", "name": "data_science"},
            {"id": "data_processing", "name": "data_processing"},
        ],
        "selected_pipeline": "__default__",
    }


def assert_example_transcoded_data(response_data):
    """Assert graph response for the `example_transcoded_pipelines`
    and `example_transcoded_catalog` fixtures."""
    expected_edges = [
        {"source": "f1f1425b", "target": "2302ea78"},
        {"source": "f0ebef01", "target": "2a1abe98"},
        {"source": "7c58d8e6", "target": "2a1abe98"},
        {"source": "2a1abe98", "target": "0ecea0de"},
        {"source": "2302ea78", "target": "1d06a0d7"},
        {"source": "0ecea0de", "target": "2302ea78"},
    ]
    assert_dict_list_equal(
        response_data.pop("edges"), expected_edges, sort_keys=("source", "target")
    )
    # compare nodes
    expected_nodes = [
        {
            "id": "2a1abe98",
            "name": "process_data",
            "tags": ["split"],
            "pipelines": ["data_processing", "__default__"],
            "type": "task",
            "modular_pipelines": [],
            "parameters": {"uk.data_processing.train_test_split": 0.1},
        },
        {
            "id": "7c58d8e6",
            "name": "raw_data",
            "tags": ["split"],
            "pipelines": ["data_processing", "__default__"],
            "type": "data",
            "modular_pipelines": [],
            "layer": None,
            "dataset_type": "io.memory_dataset.MemoryDataset",
            "stats": None,
        },
        {
            "id": "f0ebef01",
            "name": "params:uk.data_processing.train_test_split",
            "tags": ["split"],
            "pipelines": ["data_processing", "__default__"],
            "type": "parameters",
            "modular_pipelines": ["uk", "uk.data_processing"],
            "layer": None,
            "dataset_type": None,
            "stats": None,
        },
        {
            "id": "0ecea0de",
            "name": "model_inputs",
            "tags": ["train", "split"],
            "pipelines": ["data_processing", "__default__"],
            "type": "data",
            "modular_pipelines": [],
            "layer": None,
            "dataset_type": None,
            "stats": None,
        },
        {
            "id": "2302ea78",
            "name": "train_model",
            "tags": ["train"],
            "pipelines": ["data_processing", "__default__"],
            "type": "task",
            "modular_pipelines": [],
            "parameters": {"train_test_split": 0.1, "num_epochs": 1000},
        },
        {
            "id": "f1f1425b",
            "name": "parameters",
            "tags": ["train"],
            "pipelines": ["data_processing", "__default__"],
            "type": "parameters",
            "modular_pipelines": [],
            "layer": None,
            "dataset_type": None,
            "stats": None,
        },
        {
            "id": "1d06a0d7",
            "name": "model",
            "tags": ["train"],
            "pipelines": ["data_processing", "__default__"],
            "type": "data",
            "modular_pipelines": [],
            "layer": None,
            "dataset_type": "io.memory_dataset.MemoryDataset",
            "stats": None,
        },
    ]

    assert_nodes_equal(response_data.pop("nodes"), expected_nodes)


class TestMainEndpoint:
    """Test a viz API created from a Kedro project."""

    def test_endpoint_main(self, client):
        response = client.get("/api/main")
        assert_example_data(response.json())

    def test_endpoint_main_no_default_pipeline(self, example_api_no_default_pipeline):
        client = TestClient(example_api_no_default_pipeline)
        response = client.get("/api/main")
        assert len(response.json()["nodes"]) == 6
        assert len(response.json()["edges"]) == 9
        assert response.json()["pipelines"] == [
            {"id": "data_science", "name": "data_science"},
            {"id": "data_processing", "name": "data_processing"},
        ]


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
            "original_type": "pandas.csv_dataset.CSVDataset",
            "transcoded_types": [
                "pandas.parquet_dataset.ParquetDataset",
            ],
            "run_command": "kedro run --to-outputs=model_inputs@pandas2",
        }


class TestNodeMetadataEndpoint:
    def test_node_not_exist(self, client):
        response = client.get("/api/nodes/foo")
        assert response.status_code == 404

    def test_task_node_metadata(self, client):
        response = client.get("/api/nodes/f2e4bf0e")
        metadata = response.json()
        assert (
            metadata["code"].lstrip()
            == "def process_data(raw_data, train_test_split):\n        ...\n"
        )
        assert metadata["parameters"] == {"uk.data_processing.train_test_split": 0.1}
        assert metadata["inputs"] == [
            "uk.data_processing.raw_data",
            "params:uk.data_processing.train_test_split",
        ]
        assert metadata["outputs"] == ["model_inputs"]
        assert (
            metadata["run_command"]
            == "kedro run --to-nodes=uk.data_processing.process_data"
        )
        assert str(Path("package/tests/conftest.py")) in metadata["filepath"]

    def test_data_node_metadata(self, client):
        response = client.get("/api/nodes/0ecea0de")
        assert response.json() == {
            "filepath": "model_inputs.csv",
            "type": "pandas.csv_dataset.CSVDataset",
            "run_command": "kedro run --to-outputs=model_inputs",
            "stats": {"columns": 12, "rows": 29768},
        }

    def test_data_node_metadata_for_free_input(self, client):
        response = client.get("/api/nodes/13399a82")
        assert response.json() == {
            "filepath": "raw_data.csv",
            "type": "pandas.csv_dataset.CSVDataset",
        }

    def test_parameters_node_metadata(self, client):
        response = client.get("/api/nodes/f1f1425b")
        assert response.json() == {
            "parameters": {"train_test_split": 0.1, "num_epochs": 1000}
        }

    def test_single_parameter_node_metadata(self, client):
        response = client.get("/api/nodes/f0ebef01")
        assert response.json() == {
            "parameters": {"uk.data_processing.train_test_split": 0.1}
        }

    def test_no_metadata(self, client):
        with mock.patch.object(TaskNode, "has_metadata", return_value=False):
            response = client.get("/api/nodes/f2e4bf0e")
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
                "name": "model_inputs",
                "tags": ["train", "split"],
                "pipelines": ["__default__", "data_science", "data_processing"],
                "modular_pipelines": [],
                "type": "data",
                "layer": "model_inputs",
                "dataset_type": "pandas.csv_dataset.CSVDataset",
                "stats": {"columns": 12, "rows": 29768},
            },
            {
                "id": "7b140b3f",
                "name": "train_model",
                "tags": ["train"],
                "pipelines": ["__default__", "data_science"],
                "modular_pipelines": ["uk", "uk.data_science"],
                "type": "task",
                "parameters": {
                    "train_test_split": 0.1,
                    "num_epochs": 1000,
                },
            },
            {
                "id": "f1f1425b",
                "name": "parameters",
                "tags": ["train"],
                "pipelines": ["__default__", "data_science"],
                "modular_pipelines": [],
                "type": "parameters",
                "layer": None,
                "dataset_type": None,
                "stats": None,
            },
            {
                "id": "d5a8b994",
                "name": "uk.data_science.model",
                "tags": ["train"],
                "pipelines": ["__default__", "data_science"],
                "modular_pipelines": ["uk", "uk.data_science"],
                "type": "data",
                "layer": None,
                "dataset_type": "io.memory_dataset.MemoryDataset",
                "stats": None,
            },
            {
                "id": "uk",
                "name": "uk",
                "tags": [],
                "pipelines": ["data_science"],
                "type": "modularPipeline",
                "modular_pipelines": None,
                "layer": None,
                "dataset_type": None,
                "stats": None,
            },
            {
                "id": "uk.data_science",
                "name": "uk.data_science",
                "tags": [],
                "pipelines": ["data_science"],
                "type": "modularPipeline",
                "modular_pipelines": None,
                "layer": None,
                "dataset_type": None,
                "stats": None,
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
                "name": "__root__",
                "outputs": [],
            },
            "uk": {
                "children": [
                    {"id": "uk.data_science", "type": "modularPipeline"},
                ],
                "id": "uk",
                "inputs": ["0ecea0de", "f1f1425b"],
                "name": "uk",
                "outputs": ["d5a8b994"],
            },
            "uk.data_science": {
                "children": [
                    {"id": "d5a8b994", "type": "data"},
                    {"id": "7b140b3f", "type": "task"},
                ],
                "id": "uk.data_science",
                "inputs": ["0ecea0de", "f1f1425b"],
                "name": "uk.data_science",
                "outputs": ["d5a8b994"],
            },
        }

        assert_modular_pipelines_tree_equal(
            response_data.pop("modular_pipelines"),
            expected_modular_pipelines,
        )
        assert response_data == {
            "tags": [
                {"id": "split", "name": "split"},
                {"id": "train", "name": "train"},
            ],
            "layers": ["model_inputs", "raw"],
            "pipelines": [
                {"id": "__default__", "name": "__default__"},
                {"id": "data_science", "name": "data_science"},
                {"id": "data_processing", "name": "data_processing"},
            ],
            "selected_pipeline": "data_science",
        }

    def test_get_non_existing_pipeline(self, client):
        response = client.get("/api/pipelines/foo")
        assert response.status_code == 404


class TestAPIAppFromFile:
    def test_api_app_from_json_file_main_api(self):
        filepath = str(Path(__file__).parent.parent)
        api_app = apps.create_api_app_from_file(filepath)
        client = TestClient(api_app)
        response = client.get("/api/main")
        assert_example_data_from_file(response.json())

    def test_api_app_from_json_file_index(self):
        filepath = str(Path(__file__).parent.parent)
        api_app = apps.create_api_app_from_file(filepath)
        client = TestClient(api_app)
        response = client.get("/")
        assert response.status_code == 200


class TestPackageCompatibilities:
    @pytest.mark.parametrize(
        "expected_version, expected_compatibility",
        [
            ("2023.9.1", True),
            ("2023.8.1", False),
        ],
    )
    def test_get_package_compatibilities_response(
        self, expected_version, expected_compatibility, mocker
    ):
        mocker.patch(
            "kedro_viz.api.rest.responses.get_package_version",
            return_value=expected_version,
        )
        response = get_package_compatibilities_response()
        assert response.package_name == "fsspec"
        assert response.package_version == expected_version
        assert response.is_compatible is expected_compatibility


class TestEnhancedORJSONResponse:
    @pytest.mark.parametrize(
        "content, expected",
        [
            (
                {"key1": "value1", "key2": "value2"},
                b'{\n  "key1": "value1",\n  "key2": "value2"\n}',
            ),
            (["item1", "item2"], b'[\n  "item1",\n  "item2"\n]'),
        ],
    )
    def test_encode_to_human_readable(self, content, expected):
        result = EnhancedORJSONResponse.encode_to_human_readable(content)
        assert result == expected

    @pytest.mark.parametrize(
        "file_path, response, encoded_response",
        [
            (
                "test_output.json",
                {"key1": "value1", "key2": "value2"},
                b'{"key1": "value1", "key2": "value2"}',
            ),
        ],
    )
    def test_write_api_response_to_fs(
        self, file_path, response, encoded_response, mocker
    ):
        mock_encode_to_human_readable = mocker.patch(
            "kedro_viz.api.rest.responses.EnhancedORJSONResponse.encode_to_human_readable",
            return_value=encoded_response,
        )
        with patch("kedro_viz.api.rest.responses.fsspec.filesystem") as mock_filesystem:
            mockremote_fs = mock_filesystem.return_value
            mockremote_fs.open.return_value.__enter__.return_value = Mock()
            write_api_response_to_fs(file_path, response, mockremote_fs)
            mockremote_fs.open.assert_called_once_with(file_path, "wb")
            mock_encode_to_human_readable.assert_called_once()

    def test_save_api_main_response_to_fs(self, mocker):
        expected_default_response = {"test": "json"}
        main_path = "/main"

        mock_get_default_response = mocker.patch(
            "kedro_viz.api.rest.responses.get_default_response",
            return_value=expected_default_response,
        )
        mock_write_api_response_to_fs = mocker.patch(
            "kedro_viz.api.rest.responses.write_api_response_to_fs"
        )

        remote_fs = Mock()

        save_api_main_response_to_fs(main_path, remote_fs)

        mock_get_default_response.assert_called_once()
        mock_write_api_response_to_fs.assert_called_once_with(
            main_path, mock_get_default_response.return_value, remote_fs
        )

    def test_save_api_node_response_to_fs(self, mocker):
        nodes_path = "/nodes"
        nodeIds = ["01f456", "01f457"]
        expected_metadata_response = {"test": "json"}

        mock_get_node_metadata_response = mocker.patch(
            "kedro_viz.api.rest.responses.get_node_metadata_response",
            return_value=expected_metadata_response,
        )
        mock_write_api_response_to_fs = mocker.patch(
            "kedro_viz.api.rest.responses.write_api_response_to_fs"
        )
        mocker.patch(
            "kedro_viz.api.rest.responses.data_access_manager.nodes.get_node_ids",
            return_value=nodeIds,
        )
        remote_fs = Mock()

        save_api_node_response_to_fs(nodes_path, remote_fs)

        assert mock_write_api_response_to_fs.call_count == len(nodeIds)
        assert mock_get_node_metadata_response.call_count == len(nodeIds)

        expected_calls = [
            call(
                f"{nodes_path}/{nodeId}",
                mock_get_node_metadata_response.return_value,
                remote_fs,
            )
            for nodeId in nodeIds
        ]
        mock_write_api_response_to_fs.assert_has_calls(expected_calls, any_order=True)

    def test_save_api_pipeline_response_to_fs(self, mocker):
        pipelines_path = "/pipelines"
        pipelineIds = ["01f456", "01f457"]
        expected_selected_pipeline_response = {"test": "json"}

        mock_get_selected_pipeline_response = mocker.patch(
            "kedro_viz.api.rest.responses.get_selected_pipeline_response",
            return_value=expected_selected_pipeline_response,
        )
        mock_write_api_response_to_fs = mocker.patch(
            "kedro_viz.api.rest.responses.write_api_response_to_fs"
        )

        mocker.patch(
            "kedro_viz.api.rest.responses.data_access_manager."
            "registered_pipelines.get_pipeline_ids",
            return_value=pipelineIds,
        )

        remote_fs = Mock()

        save_api_pipeline_response_to_fs(pipelines_path, remote_fs)

        assert mock_write_api_response_to_fs.call_count == len(pipelineIds)
        assert mock_get_selected_pipeline_response.call_count == len(pipelineIds)

        expected_calls = [
            call(
                f"{pipelines_path}/{pipelineId}",
                mock_get_selected_pipeline_response.return_value,
                remote_fs,
            )
            for pipelineId in pipelineIds
        ]
        mock_write_api_response_to_fs.assert_has_calls(expected_calls, any_order=True)

    @pytest.mark.parametrize(
        "file_path, protocol, path",
        [
            ("s3://shareableviz", "s3", "shareableviz"),
            ("shareableviz", "file", "shareableviz"),
        ],
    )
    def test_save_api_responses_to_fs(self, file_path, protocol, path, mocker):
        mock_api_main_response_to_fs = mocker.patch(
            "kedro_viz.api.rest.responses.save_api_main_response_to_fs"
        )
        mock_api_node_response_to_fs = mocker.patch(
            "kedro_viz.api.rest.responses.save_api_node_response_to_fs"
        )
        mock_api_pipeline_response_to_fs = mocker.patch(
            "kedro_viz.api.rest.responses.save_api_pipeline_response_to_fs"
        )
        mock_get_protocol_and_path = mocker.patch(
            "kedro_viz.api.rest.responses.get_protocol_and_path",
            return_value=(protocol, path),
        )
        mockremote_fs = mocker.patch(
            "kedro_viz.api.rest.responses.fsspec.filesystem", return_value=Mock()
        )

        save_api_responses_to_fs(file_path)

        mockremote_fs.assert_called_once_with(protocol)
        mock_get_protocol_and_path.assert_called_once_with(file_path)
        mock_api_main_response_to_fs.assert_called_once_with(
            f"{path}/api/main", mockremote_fs.return_value
        )
        mock_api_node_response_to_fs.assert_called_once_with(
            f"{path}/api/nodes", mockremote_fs.return_value
        )
        mock_api_pipeline_response_to_fs.assert_called_once_with(
            f"{path}/api/pipelines", mockremote_fs.return_value
        )
