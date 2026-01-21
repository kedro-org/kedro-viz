from functools import partial, wraps
from pathlib import Path
from textwrap import dedent

import pytest
from kedro.io import MemoryDataset
from kedro.pipeline.node import node
from kedro_datasets.pandas import CSVDataset, ParquetDataset

from kedro_viz.models.flowchart.node_metadata import (
    DataNodeMetadata,
    ParametersNodeMetadata,
    TaskNodeMetadata,
    TranscodedDataNodeMetadata,
)
from kedro_viz.models.flowchart.nodes import GraphNode
from kedro_viz.models.metadata import NodeExtras


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


def wrapped_decorator(fun):
    """
    Decorator that wraps a function.
    """

    @wraps(fun)
    def _new_fun(*args, **kwargs):
        return fun(*args, **kwargs)

    return _new_fun


@decorator
def decorated(x):
    return x


@wrapped_decorator
def wrapped_decorated(x):
    return x


# A normal function
def full_func(a, b, c, x):
    return 1000 * a + 100 * b + 10 * c + x


# A partial function that calls f with
# a as 3, b as 1 and c as 4.
partial_func = partial(full_func, 3, 1, 4)


class ExampleTask:
    def run(self, data):
        return data


class TestGraphNodeMetadata:
    @pytest.mark.parametrize(
        "dataset,has_metadata", [(MemoryDataset(data=1), True), (None, False)]
    )
    def test_node_has_metadata(self, dataset, has_metadata):
        data_node = GraphNode.create_data_node(
            "test_dataset",
            "test_dataset",
            layer=None,
            tags=set(),
            dataset=dataset,
            node_extras=None,
            modular_pipelines=set(),
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
        task_node = GraphNode.create_task_node(
            kedro_node, "identity_node", set(["namespace"])
        )
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
        assert not task_node_metadata.parameters
        assert (
            task_node_metadata.run_command
            == "kedro run --to-nodes='namespace.identity_node'"
        )

    def test_task_node_metadata_no_namespace(self):
        kedro_node = node(
            identity,
            inputs="x",
            outputs="y",
            name="identity_node",
            tags={"tag"},
        )
        task_node = GraphNode.create_task_node(kedro_node, "identity_node", set())
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
        assert not task_node_metadata.parameters
        assert task_node_metadata.run_command == "kedro run --to-nodes='identity_node'"

    def test_task_node_metadata_no_name(self):
        kedro_node = node(
            identity,
            inputs="x",
            outputs="y",
            tags={"tag"},
            namespace="namespace",
        )
        task_node = GraphNode.create_task_node(
            kedro_node, "identity_node", set(["namespace"])
        )
        task_node_metadata = TaskNodeMetadata(task_node=task_node)
        assert (
            task_node_metadata.run_command
            == f"kedro run --to-nodes='{kedro_node.name}'"
        )

    def test_task_node_metadata_with_decorated_func(self):
        kedro_node = node(
            decorated,
            inputs="x",
            outputs="y",
            name="identity_node",
            tags={"tag"},
            namespace="namespace",
        )
        task_node = GraphNode.create_task_node(
            kedro_node, "identity_node", set(["namespace"])
        )
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
        assert not task_node_metadata.parameters

    def test_task_node_metadata_with_wrapped_decorated_func(self):
        kedro_node = node(
            wrapped_decorated,
            inputs="x",
            outputs="y",
            name="identity_node",
            tags={"tag"},
            namespace="namespace",
        )
        task_node = GraphNode.create_task_node(
            kedro_node, "identity_node", set(["namespace"])
        )
        task_node_metadata = TaskNodeMetadata(task_node=task_node)
        assert task_node_metadata.code == dedent(
            """\
            @wrapped_decorator
            def wrapped_decorated(x):
                return x
            """
        )
        assert task_node_metadata.filepath == str(
            Path(__file__).relative_to(Path.cwd().parent).expanduser()
        )
        assert not task_node_metadata.parameters

    def test_task_node_metadata_with_class_method(self):
        task = ExampleTask()
        kedro_node = node(
            task.run,
            inputs="x",
            outputs="y",
            name="identity_node",
            tags={"tag"},
            namespace="namespace",
        )
        task_node = GraphNode.create_task_node(
            kedro_node, "identity_node", set(["namespace"])
        )
        task_node_metadata = TaskNodeMetadata(task_node=task_node)
        assert task_node_metadata.code is not None
        assert "def run(self, data):" in task_node_metadata.code
        assert task_node_metadata.filepath == str(
            Path(__file__).relative_to(Path.cwd().parent).expanduser()
        )

    def test_task_node_metadata_with_partial_func(self):
        kedro_node = node(
            partial_func,
            inputs="x",
            outputs="y",
            tags={"tag"},
            namespace="namespace",
        )
        task_node = GraphNode.create_task_node(
            kedro_node, "<partial>", set(["namespace"])
        )
        task_node_metadata = TaskNodeMetadata(task_node=task_node)
        assert task_node.name == "<partial>"
        assert task_node_metadata.code is None
        assert task_node_metadata.filepath is None
        assert not task_node_metadata.parameters
        assert task_node_metadata.inputs == ["x"]
        assert task_node_metadata.outputs == ["y"]

    def test_data_node_metadata(self):
        dataset = CSVDataset(filepath="/tmp/dataset.csv")
        data_node = GraphNode.create_data_node(
            dataset_id="dataset",
            dataset_name="dataset",
            layer="raw",
            tags=set(),
            dataset=dataset,
            node_extras=NodeExtras(stats={"rows": 10, "columns": 2}),
            modular_pipelines=set(),
        )
        data_node_metadata = DataNodeMetadata(data_node=data_node)
        assert data_node_metadata.type == "pandas.csv_dataset.CSVDataset"
        assert data_node_metadata.preview_type == "TablePreview"
        assert data_node_metadata.filepath == "/tmp/dataset.csv"
        assert data_node_metadata.run_command == "kedro run --to-outputs=dataset"
        assert data_node_metadata.stats.get("rows") == 10
        assert data_node_metadata.stats.get("columns") == 2

    def test_get_preview_args(self):
        metadata = {"kedro-viz": {"preview_args": {"nrows": 3}}}
        dataset = CSVDataset(filepath="test.csv", metadata=metadata)
        data_node = GraphNode.create_data_node(
            dataset_id="dataset",
            dataset_name="dataset",
            tags=set(),
            layer=None,
            dataset=dataset,
            node_extras=None,
            modular_pipelines=set(),
        )
        assert data_node.get_preview_args() == {"nrows": 3}

    def test_is_preview_enabled(self):
        metadata = {"kedro-viz": {"preview": False}}
        dataset = CSVDataset(filepath="test.csv", metadata=metadata)
        data_node = GraphNode.create_data_node(
            dataset_id="dataset",
            dataset_name="dataset",
            tags=set(),
            layer=None,
            dataset=dataset,
            node_extras=None,
            modular_pipelines=set(),
        )
        assert data_node.is_preview_enabled() is False

    def test_is_all_previews_enabled(self, example_data_node):
        DataNodeMetadata.set_is_all_previews_enabled(False)
        preview_node_metadata = DataNodeMetadata(data_node=example_data_node)

        assert preview_node_metadata.preview is None
        assert preview_node_metadata.preview_type is None

    def test_preview_data_node_metadata(self, example_data_node):
        expected_preview_data = {
            "columns": ["id", "company_rating", "company_location"],
            "index": [0, 1, 2],
            "data": [
                [35029, "100%", "Niue"],
                [30292, "67%", "Anguilla"],
                [12345, "80%", "Barbados"],
            ],
        }

        preview_node_metadata = DataNodeMetadata(data_node=example_data_node)

        assert preview_node_metadata.preview == expected_preview_data
        assert preview_node_metadata.preview_type == "TablePreview"

    def test_preview_data_node_metadata_exception(self, caplog):
        empty_dataset = CSVDataset(filepath="temp.csv")
        dataset_name = "dataset"
        empty_data_node = GraphNode.create_data_node(
            dataset_id=dataset_name,
            dataset_name=dataset_name,
            tags=set(),
            layer=None,
            dataset=empty_dataset,
            node_extras=None,
            modular_pipelines=set(),
        )

        DataNodeMetadata(data_node=empty_data_node)

        assert f" '{dataset_name}' could not be previewed" in caplog.text

    def test_preview_default_data_node_metadata(
        self, example_data_node_without_viz_metadata
    ):
        expected_preview_data = {
            "columns": ["id", "company_rating", "company_location"],
            "index": [0, 1, 2, 3, 4],
            "data": [
                [35029, "100%", "Niue"],
                [30292, "67%", "Anguilla"],
                [12345, "80%", "Barbados"],
                [67890, "95%", "Fiji"],
                [54321, "72%", "Grenada"],
            ],
        }
        preview_node_metadata = DataNodeMetadata(
            data_node=example_data_node_without_viz_metadata
        )

        assert preview_node_metadata.preview == expected_preview_data

    def test_preview_data_node_metadata_not_exist(self, example_data_node, mocker):
        mocker.patch("kedro_datasets.pandas.CSVDataset.preview", return_value=None)

        preview_node_metadata = DataNodeMetadata(data_node=example_data_node)
        assert preview_node_metadata.preview is None

    def test_transcoded_data_node_metadata(self):
        dataset = CSVDataset(filepath="/tmp/dataset.csv")
        transcoded_data_node = GraphNode.create_data_node(
            dataset_id="dataset@pandas2",
            dataset_name="dataset@pandas2",
            layer="raw",
            tags=set(),
            dataset=dataset,
            node_extras=NodeExtras(stats={"rows": 10, "columns": 2}),
            modular_pipelines=set(),
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
        assert transcoded_data_node_metadata.stats.get("rows") == 10
        assert transcoded_data_node_metadata.stats.get("columns") == 2

    def test_partitioned_data_node_metadata(self):
        from kedro_datasets.partitions.partitioned_dataset import PartitionedDataset

        dataset = PartitionedDataset(path="partitioned/", dataset="pandas.CSVDataset")
        data_node = GraphNode.create_data_node(
            dataset_id="dataset",
            dataset_name="dataset",
            layer="raw",
            tags=set(),
            dataset=dataset,
            node_extras=None,
            modular_pipelines=set(),
        )
        data_node_metadata = DataNodeMetadata(data_node=data_node)
        assert data_node_metadata.filepath == "partitioned/"

    def test_parameters_metadata_all_parameters(self):
        parameters = {"test_split_ratio": 0.3, "num_epochs": 1000}
        parameters_dataset = MemoryDataset(data=parameters)
        parameters_node = GraphNode.create_parameters_node(
            dataset_id="parameters",
            dataset_name="parameters",
            layer=None,
            tags=set(),
            parameters=parameters_dataset,
            modular_pipelines=set(),
        )
        parameters_node_metadata = ParametersNodeMetadata(
            parameters_node=parameters_node
        )
        assert parameters_node_metadata.parameters == parameters

    def test_parameters_metadata_single_parameter(self):
        parameters_dataset = MemoryDataset(data=0.3)
        parameters_node = GraphNode.create_parameters_node(
            dataset_id="params:test_split_ratio",
            dataset_name="params:test_split_ratio",
            layer=None,
            tags=set(),
            parameters=parameters_dataset,
            modular_pipelines=set(),
        )
        parameters_node_metadata = ParametersNodeMetadata(
            parameters_node=parameters_node
        )
        assert parameters_node_metadata.parameters == {"test_split_ratio": 0.3}

    def test_text_preview(self, mocker):
        """Test that TextPreview is correctly serialized."""
        try:
            from kedro.pipeline.preview_contract import TextPreview
        except ImportError:
            pytest.skip("kedro.pipeline.preview_contract not available")

        text_preview = TextPreview(
            content="Sample text content", meta={"language": "python"}
        )

        kedro_node = node(
            identity,
            inputs="x",
            outputs="y",
            name="preview_node",
        )
        kedro_node.preview = mocker.MagicMock(return_value=text_preview)

        task_node = GraphNode.create_task_node(kedro_node, "preview_node", set())
        task_node_metadata = TaskNodeMetadata(task_node=task_node)

        assert task_node_metadata.preview == {
            "kind": "text",
            "content": "Sample text content",
            "meta": {"language": "python"},
        }

    def test_mermaid_preview(self, mocker):
        """Test that MermaidPreview is correctly serialized."""
        try:
            from kedro.pipeline.preview_contract import MermaidPreview
        except ImportError:
            pytest.skip("kedro.pipeline.preview_contract not available")

        mermaid_preview = MermaidPreview(
            content="graph TD; A-->B;", meta={"theme": "default"}
        )

        kedro_node = node(
            identity,
            inputs="x",
            outputs="y",
            name="mermaid_node",
        )
        kedro_node.preview = mocker.MagicMock(return_value=mermaid_preview)

        task_node = GraphNode.create_task_node(kedro_node, "mermaid_node", set())
        task_node_metadata = TaskNodeMetadata(task_node=task_node)

        assert task_node_metadata.preview == {
            "kind": "mermaid",
            "content": "graph TD; A-->B;",
            "meta": {"theme": "default"},
        }

    def test_image_preview(self, mocker):
        """Test that ImagePreview is correctly serialized."""
        try:
            from kedro.pipeline.preview_contract import ImagePreview
        except ImportError:
            pytest.skip("kedro.pipeline.preview_contract not available")

        image_preview = ImagePreview(
            content="base64encodedcontent", meta={"format": "png"}
        )

        kedro_node = node(
            identity,
            inputs="x",
            outputs="y",
            name="image_node",
        )
        kedro_node.preview = mocker.MagicMock(return_value=image_preview)

        task_node = GraphNode.create_task_node(kedro_node, "image_node", set())
        task_node_metadata = TaskNodeMetadata(task_node=task_node)

        assert task_node_metadata.preview == {
            "kind": "image",
            "content": "base64encodedcontent",
            "meta": {"format": "png"},
        }

    def test_no_preview_attr(self):
        """Test that preview is None when kedro_node has no preview attribute."""
        kedro_node = node(
            identity,
            inputs="x",
            outputs="y",
            name="no_preview_node",
        )

        task_node = GraphNode.create_task_node(kedro_node, "no_preview_node", set())
        task_node_metadata = TaskNodeMetadata(task_node=task_node)

        assert task_node_metadata.preview is None

    def test_preview_not_callable(self):
        """Test that preview is None when preview attribute is not callable."""
        kedro_node = node(
            identity,
            inputs="x",
            outputs="y",
            name="non_callable_preview_node",
        )
        kedro_node.preview = "not a callable"

        task_node = GraphNode.create_task_node(
            kedro_node, "non_callable_preview_node", set()
        )
        task_node_metadata = TaskNodeMetadata(task_node=task_node)

        assert task_node_metadata.preview is None

    def test_preview_returns_none(self, mocker):
        """Test that preview is None when preview() returns None."""
        kedro_node = node(
            identity,
            inputs="x",
            outputs="y",
            name="null_preview_node",
        )
        kedro_node.preview = mocker.MagicMock(return_value=None)

        task_node = GraphNode.create_task_node(kedro_node, "null_preview_node", set())
        task_node_metadata = TaskNodeMetadata(task_node=task_node)

        assert task_node_metadata.preview is None

    def test_invalid_preview_type(self, mocker):
        """Test that preview is None when preview() returns an unsupported type."""
        kedro_node = node(
            identity,
            inputs="x",
            outputs="y",
            name="invalid_type_node",
        )
        # Return a string which is not a valid preview type
        kedro_node.preview = mocker.MagicMock(return_value="invalid type")

        task_node = GraphNode.create_task_node(kedro_node, "invalid_type_node", set())
        task_node_metadata = TaskNodeMetadata(task_node=task_node)

        assert task_node_metadata.preview is None

    def test_preview_exception_handler(self, mocker, caplog):
        """Test that exceptions during preview() are handled gracefully."""
        kedro_node = node(
            identity,
            inputs="x",
            outputs="y",
            name="exception_node",
        )
        kedro_node.preview = mocker.MagicMock(
            side_effect=RuntimeError("Preview failed")
        )

        task_node = GraphNode.create_task_node(kedro_node, "exception_node", set())
        task_node_metadata = TaskNodeMetadata(task_node=task_node)

        assert task_node_metadata.preview is None
        assert "'exception_node' could not be previewed" in caplog.text
        assert "RuntimeError" in caplog.text
