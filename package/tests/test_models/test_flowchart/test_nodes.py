from unittest.mock import call, patch

import pytest
from kedro.io import MemoryDataset
from kedro.pipeline.node import node
from kedro_datasets.pandas import CSVDataset

from kedro_viz.models.flowchart.nodes import (
    DataNode,
    GraphNode,
    ParametersNode,
    TaskNode,
    TranscodedDataNode,
)


def identity(x):
    return x


class TestGraphNodeCreation:
    @pytest.mark.parametrize(
        "namespace,expected_modular_pipelines",
        [
            (None, set()),
            (
                "uk.data_science.model_training",
                set(
                    [
                        "uk",
                        "uk.data_science",
                        "uk.data_science.model_training",
                    ]
                ),
            ),
        ],
    )
    def test_create_task_node(self, namespace, expected_modular_pipelines):
        kedro_node = node(
            identity,
            inputs="x",
            outputs="y",
            name="identity_node",
            tags={"tag"},
            namespace=namespace,
        )
        task_node = GraphNode.create_task_node(
            kedro_node, "identity_node", expected_modular_pipelines
        )
        assert isinstance(task_node, TaskNode)
        assert task_node.kedro_obj is kedro_node
        assert task_node.name == "identity_node"
        assert task_node.tags == {"tag"}
        assert task_node.pipelines == set()
        assert task_node.modular_pipelines == expected_modular_pipelines
        assert task_node.namespace == namespace

    @pytest.mark.parametrize(
        "dataset_name, expected_modular_pipelines",
        [
            ("dataset", set()),
            (
                "uk.data_science.model_training.dataset",
                set(
                    [
                        "uk",
                        "uk.data_science",
                        "uk.data_science.model_training",
                    ]
                ),
            ),
        ],
    )
    def test_create_data_node(self, dataset_name, expected_modular_pipelines):
        kedro_dataset = CSVDataset(filepath="foo.csv")
        data_node = GraphNode.create_data_node(
            dataset_id=dataset_name,
            dataset_name=dataset_name,
            layer="raw",
            tags=set(),
            dataset=kedro_dataset,
            stats={"rows": 10, "columns": 5, "file_size": 1024},
            modular_pipelines=set(expected_modular_pipelines),
        )
        assert isinstance(data_node, DataNode)
        assert data_node.kedro_obj is kedro_dataset
        assert data_node.id == dataset_name
        assert data_node.name == dataset_name
        assert data_node.layer == "raw"
        assert data_node.tags == set()
        assert data_node.pipelines == set()
        assert data_node.modular_pipelines == expected_modular_pipelines
        assert data_node.stats["rows"] == 10
        assert data_node.stats["columns"] == 5
        assert data_node.stats["file_size"] == 1024

    @pytest.mark.parametrize(
        "transcoded_dataset_name, original_name",
        [
            ("dataset@pandas2", "dataset"),
            (
                "uk.data_science.model_training.dataset@pandas2",
                "uk.data_science.model_training.dataset",
            ),
        ],
    )
    def test_create_transcoded_data_node(self, transcoded_dataset_name, original_name):
        kedro_dataset = CSVDataset(filepath="foo.csv")
        data_node = GraphNode.create_data_node(
            dataset_id=original_name,
            dataset_name=transcoded_dataset_name,
            layer="raw",
            tags=set(),
            dataset=kedro_dataset,
            stats={"rows": 10, "columns": 2, "file_size": 1048},
            modular_pipelines=set(),
        )
        assert isinstance(data_node, TranscodedDataNode)
        assert data_node.id == original_name
        assert data_node.name == original_name
        assert data_node.layer == "raw"
        assert data_node.tags == set()
        assert data_node.pipelines == set()
        assert data_node.stats["rows"] == 10
        assert data_node.stats["columns"] == 2
        assert data_node.stats["file_size"] == 1048

    def test_create_parameters_all_parameters(self):
        parameters_dataset = MemoryDataset(
            data={"test_split_ratio": 0.3, "num_epochs": 1000}
        )
        parameters_node = GraphNode.create_parameters_node(
            dataset_id="parameters",
            dataset_name="parameters",
            layer=None,
            tags=set(),
            parameters=parameters_dataset,
            modular_pipelines=set(),
        )
        assert isinstance(parameters_node, ParametersNode)
        assert parameters_node.kedro_obj is parameters_dataset
        assert parameters_node.id == "parameters"
        assert parameters_node.is_all_parameters()
        assert not parameters_node.is_single_parameter()
        assert parameters_node.parameter_value == {
            "test_split_ratio": 0.3,
            "num_epochs": 1000,
        }
        assert not parameters_node.modular_pipelines

    @pytest.mark.parametrize(
        "dataset_name,expected_modular_pipelines",
        [
            ("params:test_split_ratio", set()),
            (
                "params:uk.data_science.model_training.test_split_ratio",
                set(["uk", "uk.data_science", "uk.data_science.model_training"]),
            ),
        ],
    )
    def test_create_parameters_node_single_parameter(
        self, dataset_name, expected_modular_pipelines
    ):
        parameters_dataset = MemoryDataset(data=0.3)
        parameters_node = GraphNode.create_parameters_node(
            dataset_id=dataset_name,
            dataset_name=dataset_name,
            layer=None,
            tags=set(),
            parameters=parameters_dataset,
            modular_pipelines=expected_modular_pipelines,
        )
        assert isinstance(parameters_node, ParametersNode)
        assert parameters_node.kedro_obj is parameters_dataset
        assert not parameters_node.is_all_parameters()
        assert parameters_node.is_single_parameter()
        assert parameters_node.parameter_value == 0.3
        assert parameters_node.modular_pipelines == expected_modular_pipelines

    def test_create_single_parameter_with_complex_type(self):
        parameters_dataset = MemoryDataset(data=object())
        parameters_node = GraphNode.create_parameters_node(
            dataset_id="params:test_split_ratio",
            dataset_name="params:test_split_ratio",
            layer=None,
            tags=set(),
            parameters=parameters_dataset,
            modular_pipelines=set(),
        )
        assert isinstance(parameters_node, ParametersNode)
        assert parameters_node.kedro_obj is parameters_dataset
        assert not parameters_node.is_all_parameters()
        assert parameters_node.is_single_parameter()
        assert isinstance(parameters_node.parameter_value, str)

    def test_create_all_parameters_with_complex_type(self):
        mock_object = object()
        parameters_dataset = MemoryDataset(
            data={
                "test_split_ratio": 0.3,
                "num_epochs": 1000,
                "complex_param": mock_object,
            }
        )
        parameters_node = GraphNode.create_parameters_node(
            dataset_id="parameters",
            dataset_name="parameters",
            layer=None,
            tags=set(),
            parameters=parameters_dataset,
            modular_pipelines=set(),
        )
        assert isinstance(parameters_node, ParametersNode)
        assert parameters_node.kedro_obj is parameters_dataset
        assert parameters_node.id == "parameters"
        assert parameters_node.is_all_parameters()
        assert not parameters_node.is_single_parameter()
        assert isinstance(parameters_node.parameter_value, str)

    def test_create_non_existing_parameter_node(self):
        """Test the case where ``parameters`` is equal to None"""
        parameters_node = GraphNode.create_parameters_node(
            dataset_id="non_existing",
            dataset_name="non_existing",
            layer=None,
            tags=set(),
            parameters=None,
            modular_pipelines=set(),
        )
        assert isinstance(parameters_node, ParametersNode)
        assert parameters_node.parameter_value is None

    @patch("logging.Logger.warning")
    def test_create_non_existing_parameter_node_empty_dataset(self, patched_warning):
        """Test the case where ``parameters`` is equal to a MemoryDataset with no data"""
        parameters_dataset = MemoryDataset()
        parameters_node = GraphNode.create_parameters_node(
            dataset_id="non_existing",
            dataset_name="non_existing",
            layer=None,
            tags=set(),
            parameters=parameters_dataset,
            modular_pipelines=set(),
        )
        assert parameters_node.parameter_value is None
        patched_warning.assert_has_calls(
            [call("Cannot find parameter `%s` in the catalog.", "non_existing")]
        )
