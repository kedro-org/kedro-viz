from collections import defaultdict
from typing import Dict

from kedro.io import DataCatalog, MemoryDataset
from kedro.io.core import DatasetError
from kedro.pipeline import Pipeline, node, pipeline
from kedro_datasets.pandas import CSVDataset

from kedro_viz.data_access.managers import DataAccessManager
from kedro_viz.data_access.repositories.catalog import CatalogRepository
from kedro_viz.data_access.repositories.graph import GraphNodesRepository
from kedro_viz.data_access.repositories.modular_pipelines import (
    ModularPipelinesRepository,
)
from kedro_viz.integrations.utils import UnavailableDataset
from kedro_viz.models.flowchart.nodes import (
    DataNode,
    ParametersNode,
    TaskNode,
    TranscodedDataNode,
)
from kedro_viz.models.metadata import NodeExtras


def identity(x):
    return x


class TestDataAccessManager:
    def test_manager_initialize_fields(self, data_access_manager: DataAccessManager):
        """Test that all instance variables are correctly initialized."""
        assert isinstance(data_access_manager.catalog, CatalogRepository)
        assert isinstance(data_access_manager.nodes, GraphNodesRepository)
        assert isinstance(data_access_manager.modular_pipelines, defaultdict)
        assert data_access_manager.node_extras == {}

    def test_manager_reset_fields(self, data_access_manager: DataAccessManager):
        """Test that reset_fields correctly reinitializes the instance variables."""
        # Modify fields to non-default values
        data_access_manager.catalog = None
        data_access_manager.node_extras = {"test_key": NodeExtras(stats={"rows": 100})}

        data_access_manager.reset_fields()

        # Assert fields are reset to default
        assert isinstance(data_access_manager.catalog, CatalogRepository)
        assert isinstance(data_access_manager.node_extras, dict)
        assert data_access_manager.node_extras == {}


class TestAddCatalog:
    def test_add_catalog(
        self,
        data_access_manager: DataAccessManager,
        example_pipelines: Dict[str, Pipeline],
    ):
        dataset = CSVDataset(filepath="dataset.csv")
        catalog = DataCatalog(datasets={"dataset": dataset})
        data_access_manager.add_catalog(catalog, example_pipelines)
        assert data_access_manager.catalog.get_catalog() is catalog


class TestAddNode:
    def test_add_node(
        self, data_access_manager: DataAccessManager, example_modular_pipelines_repo_obj
    ):
        kedro_node = node(
            identity,
            inputs="x",
            outputs="y",
            name="identity_node",
            tags=["tag1", "tag2"],
        )
        graph_node = data_access_manager.add_node(
            "my_pipeline", kedro_node, example_modular_pipelines_repo_obj
        )
        nodes_list = data_access_manager.nodes.as_list()
        assert len(nodes_list) == 1
        assert isinstance(graph_node, TaskNode)
        assert "my_pipeline" in graph_node.pipelines
        assert graph_node.has_metadata()
        assert graph_node.kedro_obj is kedro_node
        # The node carries its own tags (the data-access tags repo was removed as dead code).
        assert graph_node.tags == {"tag1", "tag2"}

    def test_add_node_with_modular_pipeline(
        self,
        data_access_manager: DataAccessManager,
        example_modular_pipelines_repo_obj: ModularPipelinesRepository,
        mocker,
    ):
        kedro_node = node(
            identity,
            inputs="x",
            outputs="y",
            namespace="uk.data_science.modular_pipeline",
        )
        mocker.patch.object(
            example_modular_pipelines_repo_obj,
            "get_node_and_modular_pipeline_mapping",
            return_value=(
                "identity_node",
                {"uk", "uk.data_science", "uk.data_science.modular_pipeline"},
            ),
        )

        graph_node = data_access_manager.add_node(
            "my_pipeline", kedro_node, example_modular_pipelines_repo_obj
        )
        assert graph_node.modular_pipelines == {
            "uk",
            "uk.data_science",
            "uk.data_science.modular_pipeline",
        }


class TestAddDataset:
    def test_add_dataset(
        self,
        data_access_manager: DataAccessManager,
        example_pipelines: Dict[str, Pipeline],
        example_modular_pipelines_repo_obj,
    ):
        dataset = CSVDataset(filepath="dataset.csv")
        dataset_name = "x"
        catalog = DataCatalog(datasets={dataset_name: dataset})
        data_access_manager.add_catalog(catalog, example_pipelines)
        data_access_manager.add_dataset(
            "my_pipeline", dataset_name, example_modular_pipelines_repo_obj
        )

        # dataset should be added as a graph node
        nodes_list = data_access_manager.nodes.as_list()
        assert len(nodes_list) == 1
        graph_node = nodes_list[0]
        assert isinstance(graph_node, DataNode)
        assert graph_node.kedro_obj is dataset
        assert "my_pipeline" in graph_node.pipelines
        assert not graph_node.modular_pipelines

    def test_add_memory_dataset_when_dataset_not_in_catalog(
        self,
        data_access_manager: DataAccessManager,
        example_pipelines: Dict[str, Pipeline],
        example_modular_pipelines_repo_obj,
    ):
        catalog = DataCatalog()
        data_access_manager.add_catalog(catalog, example_pipelines)
        data_access_manager.add_dataset(
            "my_pipeline", "memory_dataset", example_modular_pipelines_repo_obj
        )
        # dataset should be added as a graph node
        nodes_list = data_access_manager.nodes.as_list()
        assert len(nodes_list) == 1
        graph_node = nodes_list[0]
        assert isinstance(graph_node, DataNode)
        assert isinstance(graph_node.kedro_obj, MemoryDataset)

    def test_add_dataset_with_modular_pipeline(
        self,
        data_access_manager: DataAccessManager,
        example_pipelines: Dict[str, Pipeline],
        example_modular_pipelines_repo_obj,
        mocker,
    ):
        dataset = CSVDataset(filepath="dataset.csv")
        dataset_name = "uk.data_science.x"
        catalog = DataCatalog(
            datasets={dataset_name: dataset},
        )
        data_access_manager.add_catalog(catalog, example_pipelines)
        mocker.patch.object(
            example_modular_pipelines_repo_obj,
            "get_node_and_modular_pipeline_mapping",
            return_value=(
                "identity_node",
                {"uk", "uk.data_science"},
            ),
        )
        data_access_manager.add_dataset(
            "my_pipeline", dataset_name, example_modular_pipelines_repo_obj
        )
        nodes_list = data_access_manager.nodes.as_list()
        graph_node: DataNode = nodes_list[0]
        assert graph_node.modular_pipelines == {
            "uk",
            "uk.data_science",
        }

    def test_add_dataset_with_unresolved_pattern(
        self,
        data_access_manager: DataAccessManager,
        example_pipelines: Dict[str, Pipeline],
        example_modular_pipelines_repo_obj,
        mocker,
    ):
        dataset = CSVDataset(filepath="dataset.csv")
        dataset_name = "companies#csv"
        catalog = DataCatalog(datasets={dataset_name: dataset})
        data_access_manager.add_catalog(catalog, example_pipelines)

        mocker.patch.object(
            data_access_manager.catalog,
            "get_dataset",
            side_effect=DatasetError("Dataset not found"),
        )

        dataset_obj = data_access_manager.add_dataset(
            "my_pipeline", dataset_name, example_modular_pipelines_repo_obj
        )

        assert isinstance(dataset_obj.kedro_obj, UnavailableDataset)

    def test_add_all_parameters(
        self,
        data_access_manager: DataAccessManager,
        example_pipelines: Dict[str, Pipeline],
        example_modular_pipelines_repo_obj,
    ):
        catalog = DataCatalog()
        catalog["parameters"] = {"train_test_split": 0.1, "num_epochs": 1000}
        data_access_manager.add_catalog(catalog, example_pipelines)
        data_access_manager.add_dataset(
            "my_pipeline", "parameters", example_modular_pipelines_repo_obj
        )

        nodes_list = data_access_manager.nodes.as_list()
        assert len(nodes_list) == 1
        graph_node = nodes_list[0]
        assert isinstance(graph_node, ParametersNode)
        assert graph_node.is_all_parameters()
        assert graph_node.parameter_value == {
            "train_test_split": 0.1,
            "num_epochs": 1000,
        }

    def test_add_single_parameter(
        self,
        data_access_manager: DataAccessManager,
        example_pipelines: Dict[str, Pipeline],
        example_modular_pipelines_repo_obj,
    ):
        catalog = DataCatalog()
        catalog["params:train_test_split"] = 0.1
        data_access_manager.add_catalog(catalog, example_pipelines)
        data_access_manager.add_dataset(
            "my_pipeline", "params:train_test_split", example_modular_pipelines_repo_obj
        )
        nodes_list = data_access_manager.nodes.as_list()
        assert len(nodes_list) == 1
        graph_node = nodes_list[0]
        assert isinstance(graph_node, ParametersNode)
        assert graph_node.is_single_parameter()
        assert graph_node.parameter_value == 0.1

    def test_add_dataset_with_params_prefix(
        self,
        data_access_manager: DataAccessManager,
        example_pipelines: Dict[str, Pipeline],
        example_modular_pipelines_repo_obj,
    ):
        catalog = DataCatalog()
        catalog["params_train_test_split"] = 0.1
        data_access_manager.add_catalog(catalog, example_pipelines)
        data_access_manager.add_dataset(
            "my_pipeline", "params_train_test_split", example_modular_pipelines_repo_obj
        )
        nodes_list = data_access_manager.nodes.as_list()
        assert len(nodes_list) == 1
        graph_node = nodes_list[0]
        assert not isinstance(graph_node, ParametersNode)
        assert isinstance(graph_node, DataNode)


class TestAddMetadataNodes:
    """The slim path that feeds the metadata bridge: builds the viz node objects (task / data /
    parameter / transcoded) and attaches parameters to the tasks that consume them — without any
    graph-structure work (edges, node dependencies, registered pipelines, modular-tree expansion)."""

    def test_builds_task_data_and_parameter_nodes_with_params_attached(
        self,
        data_access_manager: DataAccessManager,
        example_pipelines: Dict[str, Pipeline],
        example_catalog: DataCatalog,
    ):
        data_access_manager.add_catalog(example_catalog, example_pipelines)
        data_access_manager.add_metadata_nodes(example_pipelines)

        nodes = data_access_manager.nodes.as_list()
        node_types = {type(n) for n in nodes}
        assert TaskNode in node_types
        assert DataNode in node_types
        assert ParametersNode in node_types

        # parameters are attached to the task nodes that consume them
        task_nodes = [n for n in nodes if isinstance(n, TaskNode)]
        assert any(n.parameters for n in task_nodes)

    def test_transcoded_datasets_are_wired(
        self,
        data_access_manager: DataAccessManager,
        example_transcoded_pipelines: Dict[str, Pipeline],
        example_transcoded_catalog: DataCatalog,
    ):
        data_access_manager.add_catalog(
            example_transcoded_catalog, example_transcoded_pipelines
        )
        data_access_manager.add_metadata_nodes(example_transcoded_pipelines)
        assert any(
            isinstance(n, TranscodedDataNode)
            for n in data_access_manager.nodes.as_list()
        )


class TestResolveDatasetFactoryPatterns:
    def test_resolve_dataset_factory_patterns(
        self,
        pipeline_with_datasets_mock,
        pipeline_with_data_sets_mock,
        data_access_manager: DataAccessManager,
        mocker,
    ):
        catalog_repo = CatalogRepository()
        catalog_config = {
            "{namespace}.int_{name}": {
                "type": "pandas.CSVDataset",
                "filepath": "{name}.csv",
                "metadata": {"kedro-viz": {"layer": "factory_test"}},
            },
            "cars": {
                "type": "pandas.CSVDataset",
                "filepath": "cars.csv",
                "metadata": {"kedro-viz": {"layer": "raw"}},
            },
        }
        processing_pipeline = pipeline(
            [
                node(
                    lambda x: x,
                    inputs=["int_companies"],
                    outputs="prm_agg_companies",
                    name="process_data",
                )
            ],
            namespace="processing",
            outputs="prm_agg_companies",
        )
        catalog = DataCatalog.from_config(catalog_config)
        catalog_repo.set_catalog(catalog)
        pipelines = {
            "pipeline1": pipeline_with_datasets_mock,
            "pipeline2": pipeline_with_data_sets_mock,
            "pipeline3": processing_pipeline,
        }

        assert catalog_repo.get_layer_for_dataset("processing.int_companies") is None
        assert catalog_repo.get_dataset("model_inputs#csv") is not None

        # clear mapping
        catalog_repo._layers_mapping = None

        data_access_manager.resolve_dataset_factory_patterns(catalog, pipelines)
        assert (
            catalog_repo.get_layer_for_dataset("processing.int_companies")
            == "factory_test"
        )
