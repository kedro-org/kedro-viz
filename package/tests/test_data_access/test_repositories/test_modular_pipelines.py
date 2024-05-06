from kedro.pipeline import node
from kedro_datasets.pandas import CSVDataset

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

    def test_add_inputs(self):
        kedro_dataset = CSVDataset(filepath="foo.csv")
        modular_pipelines = ModularPipelinesRepository()
        data_science_pipeline = modular_pipelines.get_or_create_modular_pipeline(
            "data_science"
        )
        data_node = GraphNode.create_data_node(
            dataset_name="data_science.model",
            layer="model",
            tags=set(),
            dataset=kedro_dataset,
            stats=None,
        )
        modular_pipelines.add_inputs("data_science", set(["data_science.model"]))
        assert data_node.id in data_science_pipeline.inputs

    def test_add_outputs(self):
        kedro_dataset = CSVDataset(filepath="foo.csv")
        modular_pipelines = ModularPipelinesRepository()
        data_science_pipeline = modular_pipelines.get_or_create_modular_pipeline(
            "data_science"
        )
        data_node = GraphNode.create_data_node(
            dataset_name="data_science.model",
            layer="model",
            tags=set(),
            dataset=kedro_dataset,
            stats=None,
        )
        modular_pipelines.add_outputs("data_science", set(["data_science.model"]))
        assert data_node.id in data_science_pipeline.outputs
