# pylint: disable=too-many-public-methods
import datetime
import json
import shutil
import time
from pathlib import Path
from textwrap import dedent
from unittest.mock import MagicMock, call, patch

import pandas as pd
import pytest
from kedro.extras.datasets.pandas import CSVDataSet, ParquetDataSet
from kedro.extras.datasets.spark import SparkDataSet
from kedro.extras.datasets.tracking.metrics_dataset import MetricsDataSet
from kedro.io import MemoryDataSet, PartitionedDataSet
from kedro.pipeline.node import node

from kedro_viz.models.graph import (
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

orig_import = __import__


def import_mock(name, *args):
    if name.startswith("plotly"):
        return MagicMock()
    return orig_import(name, *args)


def identity(x):
    return x


def decorator(fun):
    """
    Not the best way to write decorator
    but trying to stay faithful to the bug report here:
    https://github.com/quantumblacklabs/kedro-viz/issues/484
    """

    def _new_fun(*args, **kwargs):
        return fun(*args, **kwargs)

    _new_fun.__name__ = fun.__name__
    return _new_fun


@decorator
def decorated(x):
    return x


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

    def test_create_transcoded_data_node(self):
        dataset_name = "dataset@spark"
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
            full_name="dataset",
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
            full_name="dataset@spark",
            layer="raw",
            tags=set(),
            dataset=dataset,
        )
        transcoded_data_node.original_name = "dataset"
        transcoded_data_node.original_version = ParquetDataSet(filepath="foo.parquet")
        transcoded_data_node.transcoded_versions = [SparkDataSet(filepath="foo.csv")]
        transcoded_data_node_metadata = TranscodedDataNodeMetadata(
            transcoded_data_node=transcoded_data_node
        )
        assert (
            transcoded_data_node_metadata.original_type
            == "kedro.extras.datasets.pandas.parquet_dataset.ParquetDataSet"
        )

        assert transcoded_data_node_metadata.transcoded_types == [
            "kedro.extras.datasets.spark.spark_dataset.SparkDataSet"
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

    @patch("builtins.__import__", side_effect=import_mock)
    @patch("json.load")
    def test_plotly_data_node_metadata(self, patched_json_load, patched_import):
        mock_plot_data = {
            "data": [
                {
                    "x": ["giraffes", "orangutans", "monkeys"],
                    "y": [20, 14, 23],
                    "type": "bar",
                }
            ]
        }
        patched_json_load.return_value = mock_plot_data
        plotly_data_node = MagicMock()
        plotly_data_node.is_plot_node.return_value = True
        plotly_data_node.is_metric_node.return_value = False
        plotly_node_metadata = DataNodeMetadata(data_node=plotly_data_node)
        assert plotly_node_metadata.plot == mock_plot_data

    @patch("builtins.__import__", side_effect=import_mock)
    def test_plotly_data_node_dataset_not_exist(self, patched_import):
        plotly_data_node = MagicMock()
        plotly_data_node.is_plot_node.return_value = True
        plotly_data_node.is_metric_node.return_value = False
        plotly_data_node.kedro_obj._exists.return_value = False
        plotly_node_metadata = DataNodeMetadata(data_node=plotly_data_node)
        assert not hasattr(plotly_node_metadata, "plot")

    @patch("kedro_viz.models.graph.DataNodeMetadata.load_versioned_tracking_data")
    @patch("kedro_viz.models.graph.DataNodeMetadata.load_latest_tracking_data")
    @patch("kedro_viz.models.graph.DataNodeMetadata.create_metrics_plot")
    def test_metrics_data_node_metadata(
        self,
        patched_metrics_plot,
        patched_latest_metrics,
        patched_data_loader,
    ):
        mock_metrics_data = {
            "recommendations": 0.0009277445547700936,
            "recommended_controls": 0.001159680693462617,
            "projected_optimization": 0.0013916168321551402,
        }
        mock_version_data = {
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
        mock_plot_data = {
            "data": [
                {
                    "metrics": ["giraffes", "orangutans", "monkeys"],
                    "value": [20, 14, 23],
                    "type": "bar",
                }
            ]
        }
        patched_data_loader.return_value = mock_version_data
        patched_latest_metrics.return_value = mock_metrics_data
        patched_metrics_plot.return_value = mock_plot_data
        metrics_data_node = MagicMock()
        metrics_data_node.is_plot_node.return_value = False
        metrics_data_node.is_tracking_node.return_value = True
        metrics_data_node.is_metric_node.return_value = True
        metrics_node_metadata = DataNodeMetadata(data_node=metrics_data_node)
        assert metrics_node_metadata.tracking_data == mock_metrics_data
        assert metrics_node_metadata.plot == mock_plot_data

    @patch("kedro_viz.models.graph.DataNodeMetadata.load_latest_tracking_data")
    def test_json_data_node_metadata(
        self,
        patched_latest_json,
    ):
        mock_json_data = {
            "recommendations": "test string",
            "recommended_controls": False,
            "projected_optimization": 0.0013902,
        }

        patched_latest_json.return_value = mock_json_data
        json_data_node = MagicMock()
        json_data_node.is_plot_node.return_value = False
        json_data_node.is_tracking_node.return_value = True
        json_data_node.is_metric_node.return_value = False
        json_node_metadata = DataNodeMetadata(data_node=json_data_node)
        assert json_node_metadata.tracking_data == mock_json_data
        assert not hasattr(json_node_metadata, "plot")

    def test_metrics_data_node_metadata_dataset_not_exist(self):
        metrics_data_node = MagicMock()
        metrics_data_node.is_plot_node.return_value = False
        metrics_data_node.is_metric_node.return_value = True
        metrics_data_node.kedro_obj._exists.return_value = False
        metrics_node_metadata = DataNodeMetadata(data_node=metrics_data_node)
        assert not hasattr(metrics_node_metadata, "metrics")
        assert not hasattr(metrics_node_metadata, "plot")

    @patch("kedro_viz.models.graph.DataNodeMetadata.load_latest_tracking_data")
    def test_metrics_data_node_metadata_latest_metrics_not_exist(
        self,
        patched_latest_metrics,
    ):
        patched_latest_metrics.return_value = None
        metrics_data_node = MagicMock()
        metrics_data_node.is_plot_node.return_value = False
        metrics_data_node.is_metric_node.return_value = True
        metrics_node_metadata = DataNodeMetadata(data_node=metrics_data_node)
        assert not hasattr(metrics_node_metadata, "metrics")
        assert not hasattr(metrics_node_metadata, "plot")

    @patch("kedro_viz.models.graph.DataNodeMetadata.load_latest_tracking_data")
    @patch("kedro_viz.models.graph.DataNodeMetadata.load_versioned_tracking_data")
    def test_metrics_data_node_metadata_versioned_dataset_not_exist(
        self,
        patched_data_loader,
        patched_latest_metrics,
    ):
        mock_metrics_data = {
            "recommendations": 0.0009277445547700936,
            "recommended_controls": 0.001159680693462617,
            "projected_optimization": 0.0013916168321551402,
        }
        patched_latest_metrics.return_value = mock_metrics_data
        patched_data_loader.return_value = {}
        metrics_data_node = MagicMock()
        metrics_data_node.is_plot_node.return_value = False
        metrics_data_node.is_metric_node.return_value = True
        metrics_node_metadata = DataNodeMetadata(data_node=metrics_data_node)
        assert metrics_node_metadata.tracking_data == mock_metrics_data
        assert not hasattr(metrics_node_metadata, "plot")

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
    def metrics_filepath(self, tmp_path):
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
    def metrics_filepath_reload(self, tmp_path):
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
    def metrics_filepath_invalid_timestamp(self, tmp_path):
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

    def test_load_latest_metrics(self):
        # Note - filepath is assigned temp.json as temp solution instead of metrics_filepath
        # as it fails on windows build. This will be cleaned up in the future.
        filename = "temp.json"
        dataset = MetricsDataSet(filepath=filename)
        data = {"col1": 1, "col2": 0.23, "col3": 0.002}
        dataset.save(data)
        assert DataNodeMetadata.load_latest_tracking_data(dataset) == data
        # to avoid datasets being saved concurrently
        time.sleep(1)
        new_data = {"col1": 3, "col2": 3.23, "col3": 3.002}
        dataset.save(new_data)
        assert DataNodeMetadata.load_latest_tracking_data(dataset) == new_data
        shutil.rmtree(filename)

    def test_load_latest_metrics_fail(self, mocker, metrics_filepath):
        dataset = MetricsDataSet(filepath=f"{metrics_filepath}")
        mocker.patch.object(dataset, "_exists_function", return_value=False)
        assert DataNodeMetadata.load_latest_tracking_data(dataset) is None

    def test_load_metrics_versioned_data(self, metrics_filepath):
        mock_metrics_json = {
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
            DataNodeMetadata.load_versioned_tracking_data(metrics_filepath)
            == mock_metrics_json
        )

    def test_load_metrics_versioned_data_set_limit(self, metrics_filepath):
        mock_metrics_json = {
            datetime.datetime(2021, 9, 10, 9, 3, 23, 733000): {
                "recommendations": 0.200383330721228,
                "recommended_controls": 0.250479163401535,
                "projected_optimization": 0.30057499608184196,
            },
        }
        limit = 1
        assert (
            DataNodeMetadata.load_versioned_tracking_data(metrics_filepath, limit)
            == mock_metrics_json
        )

    @patch("logging.Logger.warning")
    def test_load_metrics_versioned_data_invalid_timestamp(
        self, patched_warning, metrics_filepath_invalid_timestamp
    ):
        DataNodeMetadata.load_versioned_tracking_data(
            metrics_filepath_invalid_timestamp
        )
        patched_warning.assert_has_calls(
            [
                call(
                    """Expected timestamp of format YYYY-MM-DDTHH:MM:SS.ffffff.
                    Skip when loading metrics."""
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
