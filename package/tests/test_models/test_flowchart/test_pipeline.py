from kedro_datasets.pandas import CSVDataset

from kedro_viz.models.flowchart.nodes import GraphNode


class TestGraphNodePipelines:
    def test_modular_pipeline_name(self):
        pipeline = GraphNode.create_modular_pipeline_node("data_engineering")
        assert pipeline.name == "data_engineering"

    def test_add_node_to_pipeline(self, example_node_extras):
        kedro_dataset = CSVDataset(filepath="foo.csv")
        data_node = GraphNode.create_data_node(
            dataset_id="dataset@transcoded",
            dataset_name="dataset@transcoded",
            layer="raw",
            tags=set(),
            dataset=kedro_dataset,
            node_extras=example_node_extras,
            modular_pipelines=set(),
        )
        assert data_node.pipelines == set()
        data_node.add_pipeline("__default__")
        assert "__default__" in data_node.pipelines
        assert "testing" not in data_node.pipelines
