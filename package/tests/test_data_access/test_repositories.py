# Test repositories methods that are not covered by generic managers tests.
import pytest
from kedro.extras.datasets.pandas import CSVDataSet
from kedro.io.data_catalog import DataCatalog
from kedro.pipeline import node

from kedro_viz.constants import ROOT_MODULAR_PIPELINE_ID
from kedro_viz.data_access.repositories import (
    CatalogRepository,
    GraphEdgesRepository,
    GraphNodesRepository,
    ModularPipelinesRepository,
    RegisteredPipelinesRepository,
)
from kedro_viz.models.graph import GraphEdge, GraphNode


def identity(x):
    return x


class TestGraphNodeRepository:
    def test_get_node_by_id(self):
        repo = GraphNodesRepository()
        task_node = GraphNode.create_task_node(node(identity, inputs="x", outputs=None))
        assert repo.get_node_by_id(task_node.id) is None
        repo.add_node(task_node)
        assert repo.get_node_by_id(task_node.id) is task_node

    def test_filter_by_ids(self):
        repo = GraphNodesRepository()
        task_node_ids = []
        task_nodes = []
        for i in range(5):
            task_node = GraphNode.create_task_node(
                node(identity, inputs="x", outputs=None, name=f"identity_{i}")
            )
            task_node_ids.append(task_node.id)
            task_nodes.append(task_node)
            repo.add_node(task_node)

        filtered = repo.get_nodes_by_ids(set(task_node_ids[:-1]))
        assert filtered == task_nodes[:-1]
        assert task_nodes[-1] not in filtered
        assert repo.get_nodes_by_ids({"not exist"}) == []


class TestGraphEdgesRepository:
    def test_filter_by_node_is(self):
        ab = GraphEdge(source="a", target="b")
        bc = GraphEdge(source="b", target="c")
        cd = GraphEdge(source="c", target="d")
        da = GraphEdge(source="d", target="a")
        repo = GraphEdgesRepository()
        for edge in [ab, bc, cd, da]:
            repo.add_edge(edge)
        assert set(repo.get_edges_by_node_ids({"a", "b", "d"})) == {ab, da}


class TestRegisteredPipelinesrepository:
    def test_get_node_ids_in_pipeline(self):
        repo = RegisteredPipelinesRepository()
        repo.add_node("__default__", "a")
        repo.add_node("__default__", "b")
        assert repo.get_node_ids_by_pipeline_id("__default__") == {"a", "b"}
        assert repo.get_node_ids_by_pipeline_id("another") == set()


class TestModularPipelinesRepository:
    def test_init_should_create_a_tree_with_default_root(self):
        modular_pipelines = ModularPipelinesRepository()
        assert modular_pipelines.has_modular_pipeline(ROOT_MODULAR_PIPELINE_ID)

    def test_get_or_create_modular_pipeline(self):
        modular_pipelines = ModularPipelinesRepository()
        modular_pipelines.get_or_create_modular_pipeline("data_science")

        assert modular_pipelines.has_modular_pipeline("data_science")
        assert sorted(modular_pipelines.as_dict().keys()) == sorted(
            [ROOT_MODULAR_PIPELINE_ID, "data_science"]
        )

        modular_pipelines.get_or_create_modular_pipeline("data_science")
        # make sure no additional pipeline was created
        assert sorted(modular_pipelines.as_dict().keys()) == sorted(
            [ROOT_MODULAR_PIPELINE_ID, "data_science"]
        )

    def test_extract_from_node(self):
        task_node = GraphNode.create_task_node(
            node(identity, inputs="x", outputs=None, namespace="data_science")
        )
        modular_pipelines = ModularPipelinesRepository()
        assert not modular_pipelines.has_modular_pipeline("data_science")
        modular_pipelines.extract_from_node(task_node)
        assert modular_pipelines.has_modular_pipeline("data_science")

    def test_add_input(self):
        kedro_dataset = CSVDataSet(filepath="foo.csv")
        modular_pipelines = ModularPipelinesRepository()
        data_science_pipeline = modular_pipelines.get_or_create_modular_pipeline(
            "data_science"
        )
        data_node = GraphNode.create_data_node(
            full_name="data_science.model",
            layer="model",
            tags=set(),
            dataset=kedro_dataset,
        )
        modular_pipelines.add_input("data_science", data_node)
        assert data_node.id in data_science_pipeline.inputs

    def test_add_output(self):
        kedro_dataset = CSVDataSet(filepath="foo.csv")
        modular_pipelines = ModularPipelinesRepository()
        data_science_pipeline = modular_pipelines.get_or_create_modular_pipeline(
            "data_science"
        )
        data_node = GraphNode.create_data_node(
            full_name="data_science.model",
            layer="model",
            tags=set(),
            dataset=kedro_dataset,
        )
        modular_pipelines.add_output("data_science", data_node)
        assert data_node.id in data_science_pipeline.outputs

    def test_add_input_should_raise_if_adding_non_data_node(self):
        task_node = GraphNode.create_task_node(
            node(identity, inputs="x", outputs=None, namespace="data_science")
        )
        modular_pipelines = ModularPipelinesRepository()
        with pytest.raises(ValueError):
            modular_pipelines.add_input("data_science", task_node)

    def test_add_output_should_raise_if_adding_non_data_node(self):
        task_node = GraphNode.create_task_node(
            node(identity, inputs="x", outputs=None, namespace="data_science")
        )
        modular_pipelines = ModularPipelinesRepository()
        with pytest.raises(ValueError):
            modular_pipelines.add_output("data_science", task_node)


class TestDataCatalogRepository:
    def test_get_layer_mapping_for_transcoded_dataset(self):
        repo = CatalogRepository()
        catalog_config = {
            "cars@pandas": {
                "type": "pandas.CSVDataSet",
                "filepath": "cars.csv",
                "layer": "raw",
            },
            "cars@spark": {"type": "spark.SparkDataSet", "filepath": "cars.parquet"},
        }
        catalog = DataCatalog.from_config(catalog_config)
        repo.set_catalog(catalog)
        assert repo.get_layer_for_dataset("cars") == "raw"
        assert repo.get_layer_for_dataset("cars@pandas") == "raw"
        assert repo.get_layer_for_dataset("cars@spark") == "raw"
