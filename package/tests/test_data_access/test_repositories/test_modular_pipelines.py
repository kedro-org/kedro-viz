import pytest
from kedro.pipeline import node
from kedro_datasets.pandas import CSVDataSet

from kedro_viz.constants import ROOT_MODULAR_PIPELINE_ID
from kedro_viz.data_access.repositories import ModularPipelinesRepository
from kedro_viz.models.flowchart import GraphNode


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

    def test_extract_from_node(self, identity):
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

    def test_add_input_should_raise_if_adding_non_data_node(self, identity):
        task_node = GraphNode.create_task_node(
            node(identity, inputs="x", outputs=None, namespace="data_science")
        )
        modular_pipelines = ModularPipelinesRepository()
        with pytest.raises(ValueError):
            modular_pipelines.add_input("data_science", task_node)

    def test_add_output_should_raise_if_adding_non_data_node(self, identity):
        task_node = GraphNode.create_task_node(
            node(identity, inputs="x", outputs=None, namespace="data_science")
        )
        modular_pipelines = ModularPipelinesRepository()
        with pytest.raises(ValueError):
            modular_pipelines.add_output("data_science", task_node)
