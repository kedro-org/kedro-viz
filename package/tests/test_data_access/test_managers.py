from typing import Dict

import networkx as nx
import pytest
from kedro.io import DataCatalog, MemoryDataset
from kedro.pipeline import Pipeline, node
from kedro.pipeline.modular_pipeline import pipeline
from kedro_datasets.pandas import CSVDataset

from kedro_viz.constants import DEFAULT_REGISTERED_PIPELINE_ID, ROOT_MODULAR_PIPELINE_ID
from kedro_viz.data_access.managers import DataAccessManager
from kedro_viz.data_access.repositories.catalog import CatalogRepository
from kedro_viz.data_access.repositories.modular_pipelines import (
    ModularPipelinesRepository,
)
from kedro_viz.models.flowchart import (
    DataNode,
    GraphEdge,
    ParametersNode,
    Tag,
    TaskNode,
    TranscodedDataNode,
)


def identity(x):
    return x


def assert_expected_modular_pipeline_values_for_edge_cases(
    expected_modular_pipeline_tree_obj,
    modular_pipeline_node_id,
    data_access_manager,
    modular_pipeline_tree_values,
    expected_key,
):
    """This asserts an `expected_key` value present in modular_pipeline_tree
    that is constructed in the edge cases with the expected_modular_pipeline_tree"""
    assert sorted(
        list(expected_modular_pipeline_tree_obj[modular_pipeline_node_id][expected_key])
    ) == sorted(
        list(
            data_access_manager.nodes.get_node_by_id(node_id).name
            for node_id in modular_pipeline_tree_values
        )
    )


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
        assert graph_node.belongs_to_pipeline("my_pipeline")
        assert graph_node.has_metadata()
        assert graph_node.kedro_obj is kedro_node
        assert data_access_manager.tags.as_list() == [Tag(id="tag1"), Tag(id="tag2")]

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

    def test_add_node_input(
        self,
        data_access_manager: DataAccessManager,
        example_pipelines: Dict[str, Pipeline],
        example_modular_pipelines_repo_obj,
    ):
        dataset = CSVDataset(filepath="dataset.csv")
        dataset_name = "x"
        registered_pipeline_id = "my_pipeline"

        # add a Kedro node to the graph
        kedro_node = node(
            identity, inputs=dataset_name, outputs="output", tags=["tag1", "tag2"]
        )
        task_node = data_access_manager.add_node(
            registered_pipeline_id, kedro_node, example_modular_pipelines_repo_obj
        )

        # add its input to the graph
        catalog = DataCatalog(
            datasets={dataset_name: dataset},
        )
        data_access_manager.add_catalog(catalog, example_pipelines)
        data_access_manager.add_dataset(
            registered_pipeline_id, dataset_name, example_modular_pipelines_repo_obj
        )
        data_node = data_access_manager.add_node_input(
            registered_pipeline_id,
            dataset_name,
            task_node,
            example_modular_pipelines_repo_obj,
        )
        assert isinstance(data_node, DataNode)

        # the graph should have 2 nodes: the task node and its input data node
        nodes_list = data_access_manager.nodes.as_list()
        assert nodes_list == [task_node, data_node]
        # it should have an edge between these two nodes
        assert data_access_manager.get_edges_for_registered_pipeline(
            registered_pipeline_id
        ) == [GraphEdge(source=data_node.id, target=task_node.id)]
        # the input data node should have the task node's tags
        assert data_node.tags == {"tag1", "tag2"}
        assert data_access_manager.get_node_dependencies_for_registered_pipeline(
            registered_pipeline_id
        ) == {
            data_node.id: {
                task_node.id,
            }
        }

    def test_add_parameters_as_node_input(
        self,
        data_access_manager: DataAccessManager,
        example_pipelines: Dict[str, Pipeline],
        example_modular_pipelines_repo_obj,
    ):
        parameters = {"train_test_split": 0.1, "num_epochs": 1000}
        catalog = DataCatalog()
        catalog.add_feed_dict({"parameters": parameters})
        data_access_manager.add_catalog(catalog, example_pipelines)
        registered_pipeline_id = "my_pipeline"
        kedro_node = node(identity, inputs="parameters", outputs="output")
        task_node = data_access_manager.add_node(
            registered_pipeline_id,
            kedro_node,
            example_modular_pipelines_repo_obj,
        )
        parameters_node = data_access_manager.add_node_input(
            registered_pipeline_id,
            "parameters",
            task_node,
            example_modular_pipelines_repo_obj,
        )
        assert isinstance(parameters_node, ParametersNode)
        assert task_node.parameters == parameters

    def test_add_single_parameter_as_node_input(
        self,
        data_access_manager: DataAccessManager,
        example_pipelines: Dict[str, Pipeline],
        example_modular_pipelines_repo_obj,
    ):
        catalog = DataCatalog()
        catalog.add_feed_dict({"params:train_test_split": 0.1})
        data_access_manager.add_catalog(catalog, example_pipelines)
        registered_pipeline_id = "my_pipeline"
        kedro_node = node(identity, inputs="params:train_test_split", outputs="output")
        task_node = data_access_manager.add_node(
            registered_pipeline_id,
            kedro_node,
            example_modular_pipelines_repo_obj,
        )
        parameter_node = data_access_manager.add_node_input(
            registered_pipeline_id,
            "params:train_test_split",
            task_node,
            example_modular_pipelines_repo_obj,
        )
        assert isinstance(parameter_node, ParametersNode)
        assert task_node.parameters == {"train_test_split": 0.1}

    def test_parameters_yaml_namespace_not_added_to_modular_pipelines(
        self,
        data_access_manager: DataAccessManager,
        example_pipelines: Dict[str, Pipeline],
        example_modular_pipelines_repo_obj,
        mocker,
    ):
        parameter_name = "params:uk.data_science.train_test_split.ratio"
        catalog = DataCatalog()
        catalog.add_feed_dict({parameter_name: 0.1})
        data_access_manager.add_catalog(catalog, example_pipelines)
        registered_pipeline_id = "my_pipeline"
        kedro_node = node(
            identity,
            inputs=parameter_name,
            outputs="output",
            namespace="uk.data_science",
        )
        mocker.patch.object(
            example_modular_pipelines_repo_obj,
            "get_node_and_modular_pipeline_mapping",
            return_value=(
                "identity_node",
                {"uk", "uk.data_science"},
            ),
        )
        task_node = data_access_manager.add_node(
            registered_pipeline_id,
            kedro_node,
            example_modular_pipelines_repo_obj,
        )
        data_access_manager.add_node_input(
            registered_pipeline_id,
            parameter_name,
            task_node,
            example_modular_pipelines_repo_obj,
        )

        # make sure parameters YAML namespace not accidentally added to the modular pipeline tree
        if task_node.modular_pipelines:
            assert "uk.data_science.train_test_split" not in task_node.modular_pipelines

    def test_add_node_output(
        self,
        data_access_manager: DataAccessManager,
        example_pipelines: Dict[str, Pipeline],
        example_modular_pipelines_repo_obj,
    ):
        dataset = CSVDataset(filepath="dataset.csv")
        registered_pipeline_id = "my_pipeline"
        dataset_name = "x"

        # add a Kedro node to the graph
        kedro_node = node(
            identity, inputs="input", outputs=dataset_name, tags=["tag1", "tag2"]
        )
        task_node = data_access_manager.add_node(
            registered_pipeline_id, kedro_node, example_modular_pipelines_repo_obj
        )

        # add its output to the graph
        catalog = DataCatalog(
            datasets={dataset_name: dataset},
        )
        data_access_manager.add_catalog(catalog, example_pipelines)
        data_access_manager.add_dataset(
            registered_pipeline_id, dataset_name, example_modular_pipelines_repo_obj
        )
        data_node = data_access_manager.add_node_output(
            registered_pipeline_id,
            dataset_name,
            task_node,
            example_modular_pipelines_repo_obj,
        )

        # the graph should have 2 nodes: the task node and its output data node
        nodes_list = data_access_manager.nodes.as_list()
        assert nodes_list == [task_node, data_node]
        # it should have an edge between these two nodes
        assert data_access_manager.get_edges_for_registered_pipeline(
            registered_pipeline_id
        ) == [GraphEdge(source=task_node.id, target=data_node.id)]
        # the output data node should have the task node's tags
        assert data_node.tags == {"tag1", "tag2"}
        assert data_access_manager.get_node_dependencies_for_registered_pipeline(
            registered_pipeline_id
        ) == {
            task_node.id: {
                data_node.id,
            }
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
        assert graph_node.belongs_to_pipeline("my_pipeline")
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

    def test_add_all_parameters(
        self,
        data_access_manager: DataAccessManager,
        example_pipelines: Dict[str, Pipeline],
        example_modular_pipelines_repo_obj,
    ):
        catalog = DataCatalog()
        catalog.add_feed_dict(
            {"parameters": {"train_test_split": 0.1, "num_epochs": 1000}}
        )
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
        catalog.add_feed_dict({"params:train_test_split": 0.1})
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
        catalog.add_feed_dict({"params_train_test_split": 0.1})
        data_access_manager.add_catalog(catalog, example_pipelines)
        data_access_manager.add_dataset(
            "my_pipeline", "params_train_test_split", example_modular_pipelines_repo_obj
        )
        nodes_list = data_access_manager.nodes.as_list()
        assert len(nodes_list) == 1
        graph_node = nodes_list[0]
        assert not isinstance(graph_node, ParametersNode)
        assert isinstance(graph_node, DataNode)


class TestAddPipelines:
    def test_add_pipelines(
        self,
        data_access_manager: DataAccessManager,
        example_pipelines: Dict[str, Pipeline],
        example_catalog: DataCatalog,
    ):
        data_access_manager.add_catalog(example_catalog, example_pipelines)
        data_access_manager.add_pipelines(example_pipelines)

        assert [p.id for p in data_access_manager.registered_pipelines.as_list()] == [
            DEFAULT_REGISTERED_PIPELINE_ID,
            "data_science",
            "data_processing",
        ]
        assert {n.name for n in data_access_manager.nodes.as_list()} == {
            "process_data",
            "train_model",
            "uk.data_science.model",
            "uk.data_processing.raw_data",
            "model_inputs",
            "parameters",
            "params:uk.data_processing.train_test_split",
        }
        assert data_access_manager.tags.as_list() == [Tag(id="split"), Tag(id="train")]
        assert sorted(
            data_access_manager.modular_pipelines[DEFAULT_REGISTERED_PIPELINE_ID]
            .as_dict()
            .keys()
        ) == sorted(
            [
                ROOT_MODULAR_PIPELINE_ID,
                "uk",
                "uk.data_processing",
                "uk.data_science",
            ]
        )
        assert sorted(
            data_access_manager.create_modular_pipelines_tree_for_registered_pipeline().keys()
        ) == sorted(
            [
                ROOT_MODULAR_PIPELINE_ID,
                "uk",
                "uk.data_processing",
                "uk.data_science",
            ]
        )

    def test_add_pipelines_with_transcoded_data(
        self,
        data_access_manager: DataAccessManager,
        example_transcoded_pipelines: Dict[str, Pipeline],
        example_transcoded_catalog: DataCatalog,
    ):
        data_access_manager.add_catalog(
            example_transcoded_catalog, example_transcoded_pipelines
        )
        data_access_manager.add_pipelines(example_transcoded_pipelines)
        assert any(
            isinstance(node, TranscodedDataNode)
            for node in data_access_manager.nodes.as_list()
        )

    def test_different_registered_pipelines_having_modular_pipeline_with_same_name(
        self,
        data_access_manager: DataAccessManager,
    ):
        # this test case was taken from the following user's report:
        # https://github.com/kedro-org/kedro-viz/issues/858
        registered_pipelines = {
            "__default__": pipeline(
                [node(func=lambda a: False, inputs="tst.a", outputs="d")]
            ),
            "pipe2": pipeline(
                [node(func=lambda a: False, inputs="tst.b", outputs="tst.c")]
            ),
        }

        data_access_manager.add_catalog(DataCatalog(), registered_pipelines)
        data_access_manager.add_pipelines(registered_pipelines)
        modular_pipeline_tree = (
            data_access_manager.create_modular_pipelines_tree_for_registered_pipeline(
                DEFAULT_REGISTERED_PIPELINE_ID
            )
        )
        assert len(modular_pipeline_tree["__root__"].children) == 3

    def test_get_default_selected_pipelines_without_default(
        self,
        data_access_manager: DataAccessManager,
        example_pipelines: Dict[str, Pipeline],
        example_catalog: DataCatalog,
    ):
        data_access_manager.add_catalog(example_catalog, example_pipelines)
        del example_pipelines[DEFAULT_REGISTERED_PIPELINE_ID]
        data_access_manager.add_pipelines(example_pipelines)
        assert not data_access_manager.registered_pipelines.get_pipeline_by_id(
            DEFAULT_REGISTERED_PIPELINE_ID
        )
        assert data_access_manager.get_default_selected_pipeline().id == "data_science"

    def test_add_pipelines_with_circular_modular_pipelines(
        self,
        data_access_manager: DataAccessManager,
    ):
        # in this test example,
        # internal modular pipeline has two disconnected nodes: a->b and c->d
        # b connects as input to an external modular pipeline
        # while c serves as that modular pipeline's output
        # which creates a circular dependency between internal and external.

        internal = pipeline(
            Pipeline(
                [
                    node(
                        identity,
                        inputs="a",
                        outputs="b",
                    ),
                    node(
                        identity,
                        inputs="c",
                        outputs="d",
                    ),
                ]
            ),
            namespace="internal",
            inputs={"c"},
            outputs={"b"},
        )
        external = pipeline(
            Pipeline(
                [
                    node(
                        identity,
                        inputs="b",
                        outputs="c",
                    )
                ]
            ),
            namespace="external",
            inputs={"b"},
            outputs={"c"},
        )

        registered_pipelines = {
            "__default__": internal + external,
        }
        data_access_manager.add_catalog(DataCatalog(), registered_pipelines)
        data_access_manager.add_pipelines(registered_pipelines)
        data_access_manager.create_modular_pipelines_tree_for_registered_pipeline(
            DEFAULT_REGISTERED_PIPELINE_ID
        )
        edges = data_access_manager.get_edges_for_registered_pipeline(
            DEFAULT_REGISTERED_PIPELINE_ID
        )

        # make sure that the original edge external.d->internal.d that forms the cycle
        # is not in the final list of edges
        d = next(edge for edge in edges if edge.source == "external").target
        assert not any(edge.target == "internal" for edge in edges if edge.source == d)

        digraph = nx.DiGraph()
        for edge in edges:
            digraph.add_edge(edge.source, edge.target)
        with pytest.raises(nx.NetworkXNoCycle):
            nx.find_cycle(digraph)


class TestResolveDatasetFactoryPatterns:
    def test_resolve_dataset_factory_patterns(
        self,
        example_catalog,
        pipeline_with_datasets_mock,
        pipeline_with_data_sets_mock,
        data_access_manager: DataAccessManager,
    ):
        pipelines = {
            "pipeline1": pipeline_with_datasets_mock,
            "pipeline2": pipeline_with_data_sets_mock,
        }
        new_catalog = CatalogRepository()
        new_catalog.set_catalog(example_catalog)

        assert "model_inputs#csv" not in new_catalog.as_dict().keys()

        data_access_manager.resolve_dataset_factory_patterns(example_catalog, pipelines)

        assert "model_inputs#csv" in new_catalog.as_dict().keys()
