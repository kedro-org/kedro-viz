import pytest
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

    def test_add_inputs(self):
        kedro_dataset = CSVDataset(filepath="foo.csv")
        modular_pipelines = ModularPipelinesRepository()
        data_science_pipeline = modular_pipelines.get_or_create_modular_pipeline(
            "data_science"
        )
        data_node = GraphNode.create_data_node(
            dataset_id="data_science.model",
            dataset_name="data_science.model",
            layer="model",
            tags=set(),
            dataset=kedro_dataset,
            stats=None,
            modular_pipelines={"data_science"},
        )
        modular_pipelines.add_inputs("data_science", set(["data_science.model"]))
        assert (
            modular_pipelines._hash_input_output(data_node.id)
            in data_science_pipeline.inputs
        )

    def test_add_outputs(self):
        kedro_dataset = CSVDataset(filepath="foo.csv")
        modular_pipelines = ModularPipelinesRepository()
        data_science_pipeline = modular_pipelines.get_or_create_modular_pipeline(
            "data_science"
        )
        data_node = GraphNode.create_data_node(
            dataset_id="data_science.model",
            dataset_name="data_science.model",
            layer="model",
            tags=set(),
            dataset=kedro_dataset,
            stats=None,
            modular_pipelines={"data_science"},
        )
        modular_pipelines.add_outputs("data_science", set(["data_science.model"]))
        assert (
            modular_pipelines._hash_input_output(data_node.id)
            in data_science_pipeline.outputs
        )

    @pytest.mark.parametrize(
        "nested_namespace, expected_expanded_namespace",
        [
            (
                "uk.data_science.internal",
                ["uk", "uk.data_science", "uk.data_science.internal"],
            ),
            (
                "uk.data_processing.internal.process",
                [
                    "uk",
                    "uk.data_processing",
                    "uk.data_processing.internal",
                    "uk.data_processing.internal.process",
                ],
            ),
            ("main_pipeline", ["main_pipeline"]),
            ("", []),
            (None, []),
        ],
    )
    def test_explode_namespace(self, nested_namespace, expected_expanded_namespace):
        modular_pipeline_repo_obj = ModularPipelinesRepository()
        assert (
            modular_pipeline_repo_obj._explode_namespace(nested_namespace)
            == expected_expanded_namespace
        )
