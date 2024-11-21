from kedro_datasets.pandas import CSVDataset

from kedro_viz.models.flowchart.named_entities import RegisteredPipeline
from kedro_viz.models.flowchart.nodes import GraphNode


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
            dataset_id="dataset@transcoded",
            dataset_name="dataset@transcoded",
            layer="raw",
            tags=set(),
            dataset=kedro_dataset,
            stats={"rows": 10, "columns": 2, "file_size": 1048},
            modular_pipelines=set(),
        )
        assert data_node.pipelines == set()
        data_node.add_pipeline(default_pipeline.id)
        assert data_node.belongs_to_pipeline(default_pipeline.id)
        assert not data_node.belongs_to_pipeline(another_pipeline.id)
