# pylint: disable=too-many-public-methods
import base64
from functools import partial
from pathlib import Path
from textwrap import dedent
from unittest.mock import call, patch

import pytest
from kedro.io import MemoryDataset
from kedro.pipeline.node import node
from kedro_datasets.pandas import CSVDataset, ParquetDataset
from kedro_datasets.partitions.partitioned_dataset import PartitionedDataset

from kedro_viz.models.flowchart import (
    DataNode,
    DataNodeMetadata,
    GraphNode,
    ParametersNode,
    ParametersNodeMetadata,
    RegisteredPipeline,
    TaskNode,
    TaskNodeMetadata,
    TranscodedDataNode,
    TranscodedDataNodeMetadata,
)


def identity(x):
    return x


def decorator(fun):
    """
    Not the best way to write decorator
    but trying to stay faithful to the bug report here:
    https://github.com/kedro-org/kedro-viz/issues/484
    """

    def _new_fun(*args, **kwargs):
        return fun(*args, **kwargs)

    _new_fun.__name__ = fun.__name__
    return _new_fun


@decorator
def decorated(x):
    return x


# A normal function
def full_func(a, b, c, x):
    return 1000 * a + 100 * b + 10 * c + x


# A partial function that calls f with
# a as 3, b as 1 and c as 4.
partial_func = partial(full_func, 3, 1, 4)


class TestGraphNodeCreation:
    @pytest.mark.parametrize(
        "namespace,expected_modular_pipelines",
        [
            (None, []),
            (
                "uk.data_science.model_training",
                [
                    "uk",
                    "uk.data_science",
                    "uk.data_science.model_training",
                ],
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
        task_node = GraphNode.create_task_node(kedro_node)
        assert isinstance(task_node, TaskNode)
        assert task_node.kedro_obj is kedro_node
        assert task_node.id == GraphNode._hash(str(kedro_node))
        assert task_node.name == "identity_node"
        assert task_node.tags == {"tag"}
        assert task_node.pipelines == set()
        assert task_node.modular_pipelines == expected_modular_pipelines

    @pytest.mark.parametrize(
        "dataset_name, expected_modular_pipelines",
        [
            ("dataset", []),
            (
                "uk.data_science.model_training.dataset",
                [
                    "uk",
                    "uk.data_science",
                    "uk.data_science.model_training",
                ],
            ),
        ],
    )
    def test_create_data_node(self, dataset_name, expected_modular_pipelines):
        kedro_dataset = CSVDataset(filepath="foo.csv")
        data_node = GraphNode.create_data_node(
            dataset_name=dataset_name,
            layer="raw",
            tags=set(),
            dataset=kedro_dataset,
            stats={"rows": 10, "columns": 5, "file_size": 1024},
        )
        assert isinstance(data_node, DataNode)
        assert data_node.kedro_obj is kedro_dataset
        assert data_node.id == GraphNode._hash(dataset_name)
        assert data_node.name == dataset_name
        assert data_node.layer == "raw"
        assert data_node.tags == set()
        assert data_node.pipelines == set()
        assert data_node.modular_pipelines == expected_modular_pipelines
        assert data_node.stats["rows"] == 10
        assert data_node.stats["columns"] == 5
        assert data_node.stats["file_size"] == 1024
        assert not data_node.is_plot_node()
        assert not data_node.is_metric_node()
        assert not data_node.is_image_node()
        assert not data_node.is_json_node()
        assert not data_node.is_tracking_node()

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
            dataset_name=transcoded_dataset_name,
            layer="raw",
            tags=set(),
            dataset=kedro_dataset,
            stats={"rows": 10, "columns": 2, "file_size": 1048},
        )
        assert isinstance(data_node, TranscodedDataNode)
        assert data_node.id == GraphNode._hash(original_name)
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
            dataset_name="parameters",
            layer=None,
            tags=set(),
            parameters=parameters_dataset,
        )
        assert isinstance(parameters_node, ParametersNode)
        assert parameters_node.kedro_obj is parameters_dataset
        assert parameters_node.id == GraphNode._hash("parameters")
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
            ("params:test_split_ratio", []),
            (
                "params:uk.data_science.model_training.test_split_ratio",
                ["uk", "uk.data_science", "uk.data_science.model_training"],
            ),
        ],
    )
    def test_create_parameters_node_single_parameter(
        self, dataset_name, expected_modular_pipelines
    ):
        parameters_dataset = MemoryDataset(data=0.3)
        parameters_node = GraphNode.create_parameters_node(
            dataset_name=dataset_name,
            layer=None,
            tags=set(),
            parameters=parameters_dataset,
        )
        assert isinstance(parameters_node, ParametersNode)
        assert parameters_node.kedro_obj is parameters_dataset
        assert not parameters_node.is_all_parameters()
        assert parameters_node.is_single_parameter()
        assert parameters_node.parameter_value == 0.3
        assert parameters_node.modular_pipelines == expected_modular_pipelines

    def test_create_non_existing_parameter_node(self):
        """Test the case where ``parameters`` is equal to None"""
        parameters_node = GraphNode.create_parameters_node(
            dataset_name="non_existing", layer=None, tags=set(), parameters=None
        )
        assert isinstance(parameters_node, ParametersNode)
        assert parameters_node.parameter_value is None

    @patch("logging.Logger.warning")
    def test_create_non_existing_parameter_node_empty_dataset(self, patched_warning):
        """Test the case where ``parameters`` is equal to a MemoryDataset with no data"""
        parameters_dataset = MemoryDataset()
        parameters_node = GraphNode.create_parameters_node(
            dataset_name="non_existing",
            layer=None,
            tags=set(),
            parameters=parameters_dataset,
        )
        assert parameters_node.parameter_value is None
        patched_warning.assert_has_calls(
            [call("Cannot find parameter `%s` in the catalog.", "non_existing")]
        )


class TestGraphNodePipelines:
    def test_registered_pipeline_name(self):
        pipeline = RegisteredPipeline(id="__default__")
        assert pipeline.name == "__default__"

    def test_modular_pipeline_name(self):
        pipeline = GraphNode.create_modular_pipeline_node("data_engineering")
        assert pipeline.name == "data_engineering"

    def test_add_node_to_pipeline(self):
        default_pipeline = RegisteredPipeline(id="__default__")
        another_pipeline = RegisteredPipeline(id="testing")
        kedro_dataset = CSVDataset(filepath="foo.csv")
        data_node = GraphNode.create_data_node(
            dataset_name="dataset@transcoded",
            layer="raw",
            tags=set(),
            dataset=kedro_dataset,
            stats={"rows": 10, "columns": 2, "file_size": 1048},
        )
        assert data_node.pipelines == set()
        data_node.add_pipeline(default_pipeline.id)
        assert data_node.belongs_to_pipeline(default_pipeline.id)
        assert not data_node.belongs_to_pipeline(another_pipeline.id)


class TestGraphNodeMetadata:
    @pytest.mark.parametrize(
        "dataset,has_metadata", [(MemoryDataset(data=1), True), (None, False)]
    )
    def test_node_has_metadata(self, dataset, has_metadata):
        data_node = GraphNode.create_data_node(
            "test_dataset", layer=None, tags=set(), dataset=dataset, stats=None
        )
        assert data_node.has_metadata() == has_metadata

    def test_task_node_metadata(self):
        kedro_node = node(
            identity,
            inputs="x",
            outputs="y",
            name="identity_node",
            tags={"tag"},
            namespace="namespace",
        )
        task_node = GraphNode.create_task_node(kedro_node)
        task_node_metadata = TaskNodeMetadata(task_node=task_node)
        assert task_node_metadata.code == dedent(
            """\
            def identity(x):
                return x
            """
        )
        assert task_node_metadata.filepath == str(
            Path(__file__).relative_to(Path.cwd().parent).expanduser()
        )
        assert task_node_metadata.parameters == {}
        assert (
            task_node_metadata.run_command
            == "kedro run --to-nodes=namespace.identity_node"
        )

    def test_task_node_metadata_no_namespace(self):
        kedro_node = node(
            identity,
            inputs="x",
            outputs="y",
            name="identity_node",
            tags={"tag"},
        )
        task_node = GraphNode.create_task_node(kedro_node)
        task_node_metadata = TaskNodeMetadata(task_node=task_node)
        assert task_node_metadata.code == dedent(
            """\
            def identity(x):
                return x
            """
        )
        assert task_node_metadata.filepath == str(
            Path(__file__).relative_to(Path.cwd().parent).expanduser()
        )
        assert task_node_metadata.parameters == {}
        assert task_node_metadata.run_command == "kedro run --to-nodes=identity_node"

    def test_task_node_metadata_no_run_command(self):
        kedro_node = node(
            identity,
            inputs="x",
            outputs="y",
            tags={"tag"},
            namespace="namespace",
        )
        task_node = GraphNode.create_task_node(kedro_node)
        task_node_metadata = TaskNodeMetadata(task_node=task_node)
        assert task_node_metadata.run_command is None

    def test_task_node_metadata_with_decorated_func(self):
        kedro_node = node(
            decorated,
            inputs="x",
            outputs="y",
            name="identity_node",
            tags={"tag"},
            namespace="namespace",
        )
        task_node = GraphNode.create_task_node(kedro_node)
        task_node_metadata = TaskNodeMetadata(task_node=task_node)
        assert task_node_metadata.code == dedent(
            """\
            @decorator
            def decorated(x):
                return x
            """
        )
        assert task_node_metadata.filepath == str(
            Path(__file__).relative_to(Path.cwd().parent).expanduser()
        )
        assert task_node_metadata.parameters == {}

    def test_task_node_metadata_with_partial_func(self):
        kedro_node = node(
            partial_func,
            inputs="x",
            outputs="y",
            tags={"tag"},
            namespace="namespace",
        )
        task_node = GraphNode.create_task_node(kedro_node)
        task_node_metadata = TaskNodeMetadata(task_node=task_node)
        assert task_node.name == "<partial>"
        assert task_node_metadata.code is None
        assert task_node_metadata.filepath is None
        assert task_node_metadata.parameters == {}
        assert task_node_metadata.inputs == ["x"]
        assert task_node_metadata.outputs == ["y"]

    def test_data_node_metadata(self):
        dataset = CSVDataset(filepath="/tmp/dataset.csv")
        data_node = GraphNode.create_data_node(
            dataset_name="dataset",
            layer="raw",
            tags=set(),
            dataset=dataset,
            stats={"rows": 10, "columns": 2},
        )
        data_node_metadata = DataNodeMetadata(data_node=data_node)
        assert data_node_metadata.type == "pandas.csv_dataset.CSVDataset"
        assert data_node_metadata.filepath == "/tmp/dataset.csv"
        assert data_node_metadata.run_command == "kedro run --to-outputs=dataset"
        assert data_node_metadata.stats["rows"] == 10
        assert data_node_metadata.stats["columns"] == 2

    def test_preview_args_not_exist(self):
        metadata = {"kedro-viz": {"something": 3}}
        dataset = CSVDataset(filepath="test.csv", metadata=metadata)
        data_node = GraphNode.create_data_node(
            dataset_name="dataset", tags=set(), layer=None, dataset=dataset, stats=None
        )
        assert not data_node.is_preview_node()

    def test_get_preview_args(self):
        metadata = {"kedro-viz": {"preview_args": {"nrows": 3}}}
        dataset = CSVDataset(filepath="test.csv", metadata=metadata)
        data_node = GraphNode.create_data_node(
            dataset_name="dataset", tags=set(), layer=None, dataset=dataset, stats=None
        )
        assert data_node.is_preview_node()
        assert data_node.get_preview_args() == {"nrows": 3}

    def test_preview_data_node_metadata(self, example_data_node, mocker):
        mock_preview_data = {
            "columns": ["id", "company_rating", "company_location"],
            "index": [0, 1, 2],
            "data": [
                [1, "90%", "London"],
                [2, "80%", "Paris"],
                [3, "40%", "Milan"],
            ],
        }

        mocker.patch(
            "kedro_viz.models.flowchart.DataNode.is_plot_node", return_value=False
        )
        mocker.patch(
            "kedro_viz.models.flowchart.DataNode.is_image_node", return_value=False
        )
        mocker.patch(
            "kedro_viz.models.flowchart.DataNode.is_tracking_node", return_value=False
        )
        mocker.patch(
            "kedro_viz.models.flowchart.DataNode.is_preview_node", return_value=True
        )
        mocker.patch(
            "kedro_datasets.pandas.CSVDataset._preview", return_value=mock_preview_data
        )

        preview_node_metadata = DataNodeMetadata(data_node=example_data_node)

        assert preview_node_metadata.preview == mock_preview_data

    def test_preview_data_node_metadata_not_exist(self, example_data_node, mocker):
        mocker.patch(
            "kedro_viz.models.flowchart.DataNode.is_plot_node", return_value=False
        )
        mocker.patch(
            "kedro_viz.models.flowchart.DataNode.is_image_node", return_value=False
        )
        mocker.patch(
            "kedro_viz.models.flowchart.DataNode.is_tracking_node", return_value=False
        )
        mocker.patch(
            "kedro_viz.models.flowchart.DataNode.is_preview_node", return_value=True
        )
        mocker.patch("kedro_datasets.pandas.CSVDataset._preview", return_value=False)

        preview_node_metadata = DataNodeMetadata(data_node=example_data_node)
        assert preview_node_metadata.plot is None

    def test_transcoded_data_node_metadata(self):
        dataset = CSVDataset(filepath="/tmp/dataset.csv")
        transcoded_data_node = GraphNode.create_data_node(
            dataset_name="dataset@pandas2",
            layer="raw",
            tags=set(),
            dataset=dataset,
            stats={"rows": 10, "columns": 2},
        )
        transcoded_data_node.original_name = "dataset"
        transcoded_data_node.original_version = ParquetDataset(filepath="foo.parquet")
        transcoded_data_node.transcoded_versions = [CSVDataset(filepath="foo.csv")]
        transcoded_data_node.is_free_input = True
        transcoded_data_node_metadata = TranscodedDataNodeMetadata(
            transcoded_data_node=transcoded_data_node
        )
        assert (
            transcoded_data_node_metadata.original_type
            == "pandas.parquet_dataset.ParquetDataset"
        )

        assert transcoded_data_node_metadata.transcoded_types == [
            "pandas.csv_dataset.CSVDataset"
        ]
        assert transcoded_data_node_metadata.stats["rows"] == 10
        assert transcoded_data_node_metadata.stats["columns"] == 2

    def test_partitioned_data_node_metadata(self):
        dataset = PartitionedDataset(path="partitioned/", dataset="pandas.CSVDataset")
        data_node = GraphNode.create_data_node(
            dataset_name="dataset",
            layer="raw",
            tags=set(),
            dataset=dataset,
            stats=None,
        )
        data_node_metadata = DataNodeMetadata(data_node=data_node)
        assert data_node_metadata.filepath == "partitioned/"

    # TODO: these test should ideally use a "real" catalog entry to create actual rather
    # than mock DataNode. Or if the loading functionality is tested elsewhere,
    # perhaps they are not needed at all. At the moment they don't actually test much.
    def test_plotly_data_node_metadata(self, example_data_node, mocker):
        mock_plot_data = {
            "data": [
                {
                    "x": ["giraffes", "orangutans", "monkeys"],
                    "y": [20, 14, 23],
                    "type": "bar",
                }
            ]
        }

        mocker.patch(
            "kedro_viz.models.flowchart.DataNode.is_plot_node", return_value=True
        )
        mocker.patch(
            "kedro_viz.models.flowchart.DataNode.is_image_node", return_value=False
        )
        mocker.patch(
            "kedro_viz.models.flowchart.DataNode.is_tracking_node", return_value=False
        )
        mocker.patch(
            "kedro_viz.models.flowchart.DataNode.is_preview_node", return_value=False
        )
        mocker.patch("kedro.io.core.AbstractDataset.load", return_value=mock_plot_data)

        plotly_node_metadata = DataNodeMetadata(data_node=example_data_node)
        assert plotly_node_metadata.plot == mock_plot_data

    def test_plotly_data_node_dataset_not_exist(self, example_data_node, mocker):
        mocker.patch(
            "kedro_viz.models.flowchart.DataNode.is_plot_node", return_value=True
        )
        mocker.patch(
            "kedro_viz.models.flowchart.DataNode.is_image_node", return_value=False
        )
        mocker.patch(
            "kedro_viz.models.flowchart.DataNode.is_tracking_node", return_value=False
        )
        mocker.patch(
            "kedro_viz.models.flowchart.DataNode.is_preview_node", return_value=False
        )
        mocker.patch("kedro.io.core.AbstractDataset.load", return_value=None)

        plotly_node_metadata = DataNodeMetadata(data_node=example_data_node)
        assert plotly_node_metadata.plot is None

    # @patch("base64.b64encode")
    def test_image_data_node_metadata(self, example_data_node, mocker):
        mock_image_data = base64.b64encode(
            b"iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAA"
            b"AAC0lEQVQYV2NgYAAAAAMAAWgmWQ0AAAAASUVORK5CYII="
        )

        mocker.patch(
            "kedro_viz.models.flowchart.DataNode.is_image_node", return_value=True
        )
        mocker.patch(
            "kedro_viz.models.flowchart.DataNode.is_plot_node", return_value=False
        )
        mocker.patch(
            "kedro_viz.models.flowchart.DataNode.is_tracking_node", return_value=False
        )
        mocker.patch(
            "kedro_viz.models.flowchart.DataNode.is_preview_node", return_value=False
        )
        mocker.patch("kedro.io.core.AbstractDataset.load", return_value=mock_image_data)

        image_node_metadata = DataNodeMetadata(data_node=example_data_node)
        assert image_node_metadata.image == mock_image_data

    def test_image_data_node_dataset_not_exist(self, example_data_node, mocker):
        mocker.patch(
            "kedro_viz.models.flowchart.DataNode.is_image_node", return_value=True
        )
        mocker.patch(
            "kedro_viz.models.flowchart.DataNode.is_plot_node", return_value=False
        )
        mocker.patch(
            "kedro_viz.models.flowchart.DataNode.is_tracking_node", return_value=False
        )
        mocker.patch(
            "kedro_viz.models.flowchart.DataNode.is_preview_node", return_value=False
        )
        mocker.patch("kedro.io.core.AbstractDataset.load", return_value=None)

        image_node_metadata = DataNodeMetadata(data_node=example_data_node)
        assert image_node_metadata.image is None

    def test_tracking_data_node_metadata_exist(self, example_data_node, mocker):
        mock_tracking_data = {
            "recommendations": "test string",
            "recommended_controls": False,
            "projected_optimization": 0.0013902,
        }

        mocker.patch(
            "kedro_viz.models.flowchart.DataNode.is_tracking_node", return_value=True
        )
        mocker.patch(
            "kedro_viz.models.flowchart.DataNode.is_image_node", return_value=False
        )
        mocker.patch(
            "kedro_viz.models.flowchart.DataNode.is_plot_node", return_value=False
        )
        mocker.patch(
            "kedro_viz.models.flowchart.DataNode.is_metric_node", return_value=False
        )
        mocker.patch(
            "kedro_viz.models.flowchart.DataNode.is_preview_node", return_value=False
        )
        mocker.patch(
            "kedro.io.core.AbstractDataset.load", return_value=mock_tracking_data
        )

        tracking_node_metadata = DataNodeMetadata(data_node=example_data_node)

        assert tracking_node_metadata.tracking_data == mock_tracking_data
        assert tracking_node_metadata.plot is None

    def test_tracking_data_node_metadata_not_exist(self, example_data_node, mocker):
        mocker.patch(
            "kedro_viz.models.flowchart.DataNode.is_tracking_node", return_value=True
        )
        mocker.patch(
            "kedro_viz.models.flowchart.DataNode.is_image_node", return_value=False
        )
        mocker.patch(
            "kedro_viz.models.flowchart.DataNode.is_plot_node", return_value=False
        )
        mocker.patch(
            "kedro_viz.models.flowchart.DataNode.is_metric_node", return_value=False
        )
        mocker.patch(
            "kedro_viz.models.flowchart.DataNode.is_preview_node", return_value=False
        )
        mocker.patch("kedro.io.core.AbstractDataset.load", return_value=None)

        tracking_node_metadata = DataNodeMetadata(data_node=example_data_node)

        assert tracking_node_metadata.tracking_data is None
        assert tracking_node_metadata.plot is None

    def test_metrics_data_node_metadata_dataset_not_exist(
        self, example_data_node, mocker
    ):
        mocker.patch(
            "kedro_viz.models.flowchart.DataNode.is_metric_node", return_value=True
        )
        mocker.patch(
            "kedro_viz.models.flowchart.DataNode.is_image_node", return_value=False
        )
        mocker.patch(
            "kedro_viz.models.flowchart.DataNode.is_plot_node", return_value=False
        )
        mocker.patch(
            "kedro_viz.models.flowchart.DataNode.is_preview_node", return_value=False
        )
        mocker.patch("kedro.io.core.AbstractDataset.load", return_value=None)

        metrics_node_metadata = DataNodeMetadata(data_node=example_data_node)
        assert metrics_node_metadata.plot is None

    def test_parameters_metadata_all_parameters(self):
        parameters = {"test_split_ratio": 0.3, "num_epochs": 1000}
        parameters_dataset = MemoryDataset(data=parameters)
        parameters_node = GraphNode.create_parameters_node(
            dataset_name="parameters",
            layer=None,
            tags=set(),
            parameters=parameters_dataset,
        )
        parameters_node_metadata = ParametersNodeMetadata(
            parameters_node=parameters_node
        )
        assert parameters_node_metadata.parameters == parameters

    def test_parameters_metadata_single_parameter(self):
        parameters_dataset = MemoryDataset(data=0.3)
        parameters_node = GraphNode.create_parameters_node(
            dataset_name="params:test_split_ratio",
            layer=None,
            tags=set(),
            parameters=parameters_dataset,
        )
        parameters_node_metadata = ParametersNodeMetadata(
            parameters_node=parameters_node
        )
        assert parameters_node_metadata.parameters == {"test_split_ratio": 0.3}
