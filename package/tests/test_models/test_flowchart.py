# pylint: disable=too-many-public-methods
import base64
import datetime
import json
from functools import partial
from pathlib import Path
from textwrap import dedent
from unittest.mock import MagicMock, call, patch

import pandas as pd
import pytest
from kedro.extras.datasets.pandas import CSVDataSet, ParquetDataSet
from kedro.io import MemoryDataSet, PartitionedDataSet
from kedro.pipeline.node import node

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
        assert task_node.name == "Identity Node"
        assert task_node.full_name == "identity_node"
        assert task_node.tags == {"tag"}
        assert task_node.pipelines == set()
        assert task_node.modular_pipelines == expected_modular_pipelines

    def test_task_node_full_name_when_no_given_name(self):
        kedro_node = node(
            identity,
            inputs="x",
            outputs="y",
            tags={"tag"},
        )
        task_node = GraphNode.create_task_node(kedro_node)
        assert task_node.full_name == "identity"

    @pytest.mark.parametrize(
        "dataset_name,pretty_name,expected_modular_pipelines",
        [
            ("dataset", "Dataset", []),
            (
                "uk.data_science.model_training.dataset",
                "Dataset",
                [
                    "uk",
                    "uk.data_science",
                    "uk.data_science.model_training",
                ],
            ),
        ],
    )
    def test_create_data_node(
        self, dataset_name, pretty_name, expected_modular_pipelines
    ):
        kedro_dataset = CSVDataSet(filepath="foo.csv")
        data_node = GraphNode.create_data_node(
            full_name=dataset_name,
            layer="raw",
            tags=set(),
            dataset=kedro_dataset,
        )
        assert isinstance(data_node, DataNode)
        assert data_node.kedro_obj is kedro_dataset
        assert data_node.id == GraphNode._hash(dataset_name)
        assert data_node.name == pretty_name
        assert data_node.layer == "raw"
        assert data_node.tags == set()
        assert data_node.pipelines == set()
        assert data_node.modular_pipelines == expected_modular_pipelines
        assert not data_node.is_plot_node()
        assert not data_node.is_metric_node()
        assert not data_node.is_image_node()
        assert not data_node.is_json_node()
        assert not data_node.is_tracking_node()

    def test_create_transcoded_data_node(self):
        dataset_name = "dataset@pandas2"
        original_name = "dataset"
        pretty_name = "Dataset"
        kedro_dataset = CSVDataSet(filepath="foo.csv")
        data_node = GraphNode.create_data_node(
            full_name=dataset_name,
            layer="raw",
            tags=set(),
            dataset=kedro_dataset,
        )
        assert isinstance(data_node, TranscodedDataNode)
        assert data_node.id == GraphNode._hash(original_name)
        assert data_node.name == pretty_name
        assert data_node.layer == "raw"
        assert data_node.tags == set()
        assert data_node.pipelines == set()

    def test_create_parameters_all_parameters(self):
        parameters_dataset = MemoryDataSet(
            data={"test_split_ratio": 0.3, "num_epochs": 1000}
        )
        parameters_node = GraphNode.create_parameters_node(
            full_name="parameters", layer=None, tags={}, parameters=parameters_dataset
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
        assert parameters_node.modular_pipelines == []

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
        parameters_dataset = MemoryDataSet(data=0.3)
        parameters_node = GraphNode.create_parameters_node(
            full_name=dataset_name, layer=None, tags={}, parameters=parameters_dataset
        )
        assert isinstance(parameters_node, ParametersNode)
        assert parameters_node.kedro_obj is parameters_dataset
        assert not parameters_node.is_all_parameters()
        assert parameters_node.is_single_parameter()
        assert parameters_node.parameter_value == 0.3
        assert parameters_node.modular_pipelines == expected_modular_pipelines

    @patch("logging.Logger.warning")
    def test_create_non_existing_parameter_node(self, patched_warning):
        parameters_node = GraphNode.create_parameters_node(
            full_name="non_existing", layer=None, tags={}, parameters=None
        )
        assert isinstance(parameters_node, ParametersNode)
        assert parameters_node.parameter_value is None
        patched_warning.assert_has_calls(
            [call("Cannot find parameter `%s` in the catalog.", "non_existing")]
        )


class TestGraphNodePipelines:
    def test_registered_pipeline_pretty_name(self):
        pipeline = RegisteredPipeline("__default__")
        assert pipeline.name == "Default"

    def test_modular_pipeline_pretty_name(self):
        pipeline = GraphNode.create_modular_pipeline_node("data_engineering")
        assert pipeline.name == "Data Engineering"

    def test_add_node_to_pipeline(self):
        default_pipeline = RegisteredPipeline("__default__")
        another_pipeline = RegisteredPipeline("testing")
        kedro_dataset = CSVDataSet(filepath="foo.csv")
        data_node = GraphNode.create_data_node(
            full_name="dataset@transcoded",
            layer="raw",
            tags=set(),
            dataset=kedro_dataset,
        )
        assert data_node.pipelines == set()
        data_node.add_pipeline(default_pipeline.id)
        assert data_node.belongs_to_pipeline(default_pipeline.id)
        assert not data_node.belongs_to_pipeline(another_pipeline.id)


class TestGraphNodeMetadata:
    @pytest.mark.parametrize(
        "dataset,has_metadata", [(MemoryDataSet(data=1), True), (None, False)]
    )
    def test_node_has_metadata(self, dataset, has_metadata):
        data_node = GraphNode.create_data_node(
            "test_dataset", layer=None, tags=set(), dataset=dataset
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
        assert task_node_metadata.run_command == 'kedro run --to-nodes="identity_node"'

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
        assert task_node.full_name == "<partial>"
        assert not hasattr(task_node_metadata, "code")
        assert not hasattr(task_node_metadata, "filepath")
        assert task_node_metadata.parameters == {}
        assert task_node_metadata.inputs == ["X"]
        assert task_node_metadata.outputs == ["Y"]

    def test_data_node_metadata(self):
        dataset = CSVDataSet(filepath="/tmp/dataset.csv")
        data_node = GraphNode.create_data_node(
            full_name="dataset",
            layer="raw",
            tags=set(),
            dataset=dataset,
        )
        data_node_metadata = DataNodeMetadata(data_node=data_node)
        assert (
            data_node_metadata.type
            == "kedro.extras.datasets.pandas.csv_dataset.CSVDataSet"
        )
        assert data_node_metadata.filepath == "/tmp/dataset.csv"
        assert data_node_metadata.run_command == 'kedro run --to-outputs="dataset"'

    def test_transcoded_data_node_metadata(self):
        dataset = CSVDataSet(filepath="/tmp/dataset.csv")
        transcoded_data_node = GraphNode.create_data_node(
            full_name="dataset@pandas2",
            layer="raw",
            tags=set(),
            dataset=dataset,
        )
        transcoded_data_node.original_name = "dataset"
        transcoded_data_node.original_version = ParquetDataSet(filepath="foo.parquet")
        transcoded_data_node.transcoded_versions = [CSVDataSet(filepath="foo.csv")]
        transcoded_data_node_metadata = TranscodedDataNodeMetadata(
            transcoded_data_node=transcoded_data_node
        )
        assert (
            transcoded_data_node_metadata.original_type
            == "kedro.extras.datasets.pandas.parquet_dataset.ParquetDataSet"
        )

        assert transcoded_data_node_metadata.transcoded_types == [
            "kedro.extras.datasets.pandas.csv_dataset.CSVDataSet"
        ]

    def test_partitioned_data_node_metadata(self):
        dataset = PartitionedDataSet(path="partitioned/", dataset="pandas.CSVDataSet")
        data_node = GraphNode.create_data_node(
            full_name="dataset",
            layer="raw",
            tags=set(),
            dataset=dataset,
        )
        data_node_metadata = DataNodeMetadata(data_node=data_node)
        assert data_node_metadata.filepath == "partitioned/"

    # TODO: these test should ideally use a "real" catalog entry to create actual rather
    # than mock DataNode. Or if the loading functionality is tested elsewhere,
    # perhaps they are not needed at all. At the moment they don't actually test much.
    def test_plotly_data_node_metadata(self):
        mock_plot_data = {
            "data": [
                {
                    "x": ["giraffes", "orangutans", "monkeys"],
                    "y": [20, 14, 23],
                    "type": "bar",
                }
            ]
        }
        plotly_data_node = MagicMock()
        plotly_data_node.is_plot_node.return_value = True
        plotly_data_node.is_image_node.return_value = False
        plotly_data_node.is_tracking_node.return_value = False
        plotly_data_node.kedro_obj.load.return_value = mock_plot_data
        plotly_node_metadata = DataNodeMetadata(data_node=plotly_data_node)
        assert plotly_node_metadata.plot == mock_plot_data

    def test_plotly_data_node_dataset_not_exist(self):
        plotly_data_node = MagicMock()
        plotly_data_node.is_plot_node.return_value = True
        plotly_data_node.is_image_node.return_value = False
        plotly_data_node.is_tracking_node.return_value = False
        plotly_data_node.kedro_obj.exists.return_value = False
        plotly_node_metadata = DataNodeMetadata(data_node=plotly_data_node)
        assert not hasattr(plotly_node_metadata, "plot")

    def test_plotly_json_dataset_node_metadata(self):
        mock_plot_data = {
            "data": [
                {
                    "x": ["giraffes", "orangutans", "monkeys"],
                    "y": [20, 14, 23],
                    "type": "bar",
                }
            ]
        }
        plotly_json_dataset_node = MagicMock()
        plotly_json_dataset_node.is_plot_node.return_value = True
        plotly_json_dataset_node.is_image_node.return_value = False
        plotly_json_dataset_node.is_tracking_node.return_value = False
        plotly_json_dataset_node.kedro_obj.load.return_value = mock_plot_data
        plotly_node_metadata = DataNodeMetadata(data_node=plotly_json_dataset_node)
        assert plotly_node_metadata.plot == mock_plot_data

    # @patch("base64.b64encode")
    def test_image_data_node_metadata(self):
        mock_image_data = base64.b64encode(
            b"iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAA"
            b"AAC0lEQVQYV2NgYAAAAAMAAWgmWQ0AAAAASUVORK5CYII="
        )
        image_dataset_node = MagicMock()
        image_dataset_node.is_image_node.return_value = True
        image_dataset_node.is_plot_node.return_value = False
        image_dataset_node.is_tracking_node.return_value = False
        image_dataset_node.kedro_obj.load.return_value = mock_image_data
        image_node_metadata = DataNodeMetadata(data_node=image_dataset_node)
        assert image_node_metadata.image == mock_image_data

    def test_image_data_node_dataset_not_exist(self):
        image_dataset_node = MagicMock()
        image_dataset_node.is_image_node.return_value = True
        image_dataset_node.is_plot_node.return_value = False
        image_dataset_node.kedro_obj.exists.return_value = False
        image_node_metadata = DataNodeMetadata(data_node=image_dataset_node)
        assert not hasattr(image_node_metadata, "image")

    def test_json_data_node_metadata(self):
        mock_json_data = {
            "recommendations": "test string",
            "recommended_controls": False,
            "projected_optimization": 0.0013902,
        }

        json_data_node = MagicMock()
        json_data_node.is_plot_node.return_value = False
        json_data_node.is_image_node.return_value = False
        json_data_node.is_tracking_node.return_value = True
        json_data_node.is_metric_node.return_value = False
        json_data_node.kedro_obj.load.return_value = mock_json_data
        json_node_metadata = DataNodeMetadata(data_node=json_data_node)
        assert json_node_metadata.tracking_data == mock_json_data
        assert not hasattr(json_node_metadata, "plot")

    def test_metrics_data_node_metadata_dataset_not_exist(self):
        metrics_data_node = MagicMock()
        metrics_data_node.is_plot_node.return_value = False
        metrics_data_node.is_image_node.return_value = False
        metrics_data_node.is_metric_node.return_value = True
        metrics_data_node.kedro_obj.exists.return_value = False
        metrics_node_metadata = DataNodeMetadata(data_node=metrics_data_node)
        assert not hasattr(metrics_node_metadata, "metrics")
        assert not hasattr(metrics_node_metadata, "plot")

    def test_data_node_metadata_latest_tracking_data_not_exist(self):
        plotly_data_node = MagicMock()
        plotly_data_node.is_plot_node.return_value = True
        plotly_data_node.is_image_node.return_value = False
        plotly_data_node.is_tracking_node.return_value = False
        plotly_data_node.kedro_obj.exists.return_value = False
        plotly_node_metadata = DataNodeMetadata(data_node=plotly_data_node)
        assert not hasattr(plotly_node_metadata, "plot")

    @patch("kedro_viz.models.flowchart.DataNodeMetadata.load_versioned_tracking_data")
    def test_tracking_data_node_metadata_versioned_dataset(self, patched_data_loader):
        mock_metrics_data = {
            "recommendations": 0.0009277445547700936,
            "recommended_controls": 0.001159680693462617,
            "projected_optimization": 0.0013916168321551402,
        }
        tracking_data_node = MagicMock()
        tracking_data_node.is_plot_node.return_value = False
        tracking_data_node.is_image_node.return_value = False
        tracking_data_node.is_metric_node.return_value = True
        tracking_data_node.kedro_obj.load.return_value = mock_metrics_data
        tracking_data_node_metadata = DataNodeMetadata(data_node=tracking_data_node)
        assert tracking_data_node_metadata.tracking_data == mock_metrics_data
        assert hasattr(tracking_data_node_metadata, "plot")

    @patch("kedro_viz.models.flowchart.DataNodeMetadata.load_versioned_tracking_data")
    def test_tracking_data_node_metadata_versioned_dataset_not_exist(
        self, patched_data_loader
    ):
        mock_metrics_data = {
            "recommendations": 0.0009277445547700936,
            "recommended_controls": 0.001159680693462617,
            "projected_optimization": 0.0013916168321551402,
        }
        patched_data_loader.return_value = {}
        tracking_data_node = MagicMock()
        tracking_data_node.is_plot_node.return_value = False
        tracking_data_node.is_image_node.return_value = False
        tracking_data_node.is_metric_node.return_value = True
        tracking_data_node.kedro_obj.load.return_value = mock_metrics_data
        tracking_data_node_metadata = DataNodeMetadata(data_node=tracking_data_node)
        assert tracking_data_node_metadata.tracking_data == mock_metrics_data
        assert not hasattr(tracking_data_node_metadata, "plot")

    def test_data_node_metadata_create_metrics_plot(self):
        test_versioned_data = {
            "index": [
                datetime.datetime(2021, 9, 10, 9, 2, 44, 245000),
                datetime.datetime(2021, 9, 11, 9, 2, 44, 245000),
            ],
            "recommendations": [1, 2],
            "recommended_controls": [3, 4],
            "projected_optimization": [5, 6],
        }
        data_frame = pd.DataFrame(data=test_versioned_data)
        test_plot = DataNodeMetadata.create_metrics_plot(data_frame)
        assert "data" in test_plot
        assert "layout" in test_plot

    @pytest.fixture
    def tracking_data_filepath(self, tmp_path):
        dir_name = ["2021-09-10T09.02.44.245Z", "2021-09-10T09.03.23.733Z"]
        filename = "metrics.json"
        json_content = [
            {
                "recommendations": 0.3866563620506992,
                "recommended_controls": 0.48332045256337397,
                "projected_optimization": 0.5799845430760487,
            },
            {
                "recommendations": 0.200383330721228,
                "recommended_controls": 0.250479163401535,
                "projected_optimization": 0.30057499608184196,
            },
        ]
        source_dir = Path(tmp_path / filename)
        for index, directory in enumerate(dir_name):
            filepath = Path(source_dir / directory / filename)
            filepath.parent.mkdir(parents=True, exist_ok=True)
            filepath.write_text(json.dumps(json_content[index]))
        return source_dir

    @pytest.fixture
    def tracking_data_filepath_reload(self, tmp_path):
        dir_name = ["2021-09-10T09.03.55.245Z", "2021-09-10T09.03.56.733Z"]
        filename = "metrics.json"
        json_content = [
            {
                "recommendations": 0.4,
                "recommended_controls": 0.5,
                "projected_optimization": 0.6,
            },
            {
                "recommendations": 0.7,
                "recommended_controls": 0.8,
                "projected_optimization": 0.9,
            },
        ]
        source_dir = Path(tmp_path / filename)
        for index, directory in enumerate(dir_name):
            filepath = Path(source_dir / directory / filename)
            filepath.parent.mkdir(parents=True, exist_ok=True)
            filepath.write_text(json.dumps(json_content[index]))
        return source_dir

    @pytest.fixture
    def tracking_data_filepath_invalid_run_id(self, tmp_path):
        dir_name = ["2021", "2021"]
        filename = "metrics.json"
        json_content = [
            {
                "recommendations": 0.3866563620506992,
                "recommended_controls": 0.48332045256337397,
                "projected_optimization": 0.5799845430760487,
            },
            {
                "recommendations": 0.200383330721228,
                "recommended_controls": 0.250479163401535,
                "projected_optimization": 0.30057499608184196,
            },
        ]
        source_dir = Path(tmp_path / filename)
        for index, directory in enumerate(dir_name):
            filepath = Path(source_dir / directory / filename)
            filepath.parent.mkdir(parents=True, exist_ok=True)
            filepath.write_text(json.dumps(json_content[index]))
        return source_dir

    def test_load_metrics_versioned_data(self, tracking_data_filepath):
        mock_tracking_data_json = {
            datetime.datetime(2021, 9, 10, 9, 2, 44, 245000): {
                "recommendations": 0.3866563620506992,
                "recommended_controls": 0.48332045256337397,
                "projected_optimization": 0.5799845430760487,
            },
            datetime.datetime(2021, 9, 10, 9, 3, 23, 733000): {
                "recommendations": 0.200383330721228,
                "recommended_controls": 0.250479163401535,
                "projected_optimization": 0.30057499608184196,
            },
        }
        assert (
            DataNodeMetadata.load_versioned_tracking_data(tracking_data_filepath)
            == mock_tracking_data_json
        )

    def test_load_tracking_data_versioned_data_set_limit(self, tracking_data_filepath):
        mock_tracking_data_json = {
            datetime.datetime(2021, 9, 10, 9, 3, 23, 733000): {
                "recommendations": 0.200383330721228,
                "recommended_controls": 0.250479163401535,
                "projected_optimization": 0.30057499608184196,
            },
        }
        limit = 1
        assert (
            DataNodeMetadata.load_versioned_tracking_data(tracking_data_filepath, limit)
            == mock_tracking_data_json
        )

    @patch("logging.Logger.warning")
    def test_load_tracking_data_versioned_data_invalid_run_id(
        self, patched_warning, tracking_data_filepath_invalid_run_id
    ):
        DataNodeMetadata.load_versioned_tracking_data(
            tracking_data_filepath_invalid_run_id
        )
        patched_warning.assert_has_calls(
            [
                call(
                    """Expected run_id (timestamp) of format YYYY-MM-DDTHH:MM:SS.ffffff.
                    Skip when loading tracking data."""
                )
            ]
        )

    def test_parameters_metadata_all_parameters(self):
        parameters = {"test_split_ratio": 0.3, "num_epochs": 1000}
        parameters_dataset = MemoryDataSet(data=parameters)
        parameters_node = GraphNode.create_parameters_node(
            full_name="parameters", layer=None, tags={}, parameters=parameters_dataset
        )
        parameters_node_metadata = ParametersNodeMetadata(parameters_node)
        assert parameters_node_metadata.parameters == parameters

    def test_parameters_metadata_single_parameter(self):
        parameters_dataset = MemoryDataSet(data=0.3)
        parameters_node = GraphNode.create_parameters_node(
            full_name="params:test_split_ratio",
            layer=None,
            tags={},
            parameters=parameters_dataset,
        )
        parameters_node_metadata = ParametersNodeMetadata(parameters_node)
        assert parameters_node_metadata.parameters == {"test_split_ratio": 0.3}
