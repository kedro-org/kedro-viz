from unittest import mock

import pytest
from kedro.pipeline import Pipeline as KedroPipeline
from kedro.pipeline.node import Node as KedroNode

from kedro_viz.constants import ROOT_MODULAR_PIPELINE_ID
from kedro_viz.data_access.repositories import ModularPipelinesRepository
from kedro_viz.models.flowchart import (
    GraphNodeType,
    ModularPipelineChild,
    ModularPipelineNode,
)


@pytest.fixture
def mock_modular_pipelines():
    return ModularPipelinesRepository()


@pytest.fixture
def mock_kedro_nodes():
    return [
        mock.MagicMock(
            namespace="namespace1",
            spec=KedroNode,
            inputs={"input1", "input2"},
            outputs={"output1", "output2"},
        ),
        mock.MagicMock(
            namespace="namespace2",
            spec=KedroNode,
            inputs={"input3", "input4"},
            outputs={"output3", "output4"},
        ),
    ]


@pytest.fixture
def mock_pipeline():
    pipeline = mock.MagicMock(spec=KedroPipeline)
    pipeline.nodes = [
        mock.MagicMock(namespace="namespace1"),
        mock.MagicMock(namespace="namespace2"),
        mock.MagicMock(namespace="namespace3.sub_namespace"),
    ]
    return pipeline


@pytest.fixture
def mock_modular_pipeline_node():
    return ModularPipelineNode(
        id="namespace1.sub_namespace",
        name="namespace1.sub_namespace",
        inputs={"input1"},
        outputs={"output1"},
        children=set(),
        type=GraphNodeType.MODULAR_PIPELINE.value,
    )


class TestModularPipelinesRepository:
    def test_init_should_create_a_tree_with_default_root(self, mock_modular_pipelines):
        assert ROOT_MODULAR_PIPELINE_ID in mock_modular_pipelines.tree

    def test_populate_tree(self, mocker, mock_modular_pipelines, mock_pipeline):
        mocker.patch.object(mock_modular_pipelines, "get_or_create_modular_pipeline")
        mocker.patch.object(mock_modular_pipelines, "_add_inputs")
        mocker.patch.object(mock_modular_pipelines, "_add_outputs")
        mocker.patch.object(mock_modular_pipelines, "_add_children")

        sub_pipeline_mock = mock.MagicMock()
        sub_pipeline_mock.inputs.return_value = {"input1", "input2"}
        sub_pipeline_mock.outputs.return_value = {"output1"}
        sub_pipeline_mock.all_outputs.return_value = {"output1", "output2"}
        sub_pipeline_mock.nodes = ["node1", "node2"]

        mocker.patch.object(
            mock_pipeline, "only_nodes_with_namespace", return_value=sub_pipeline_mock
        )
        rest_of_the_pipeline_mock = mock_pipeline - sub_pipeline_mock
        rest_of_the_pipeline_mock.inputs.return_value = {"output2"}

        mock_modular_pipelines.populate_tree(mock_pipeline)

        modular_pipeline_ids = {
            "namespace1",
            "namespace2",
            "namespace3",
            "namespace3.sub_namespace",
        }

        assert mock_modular_pipelines.get_or_create_modular_pipeline.call_count == len(
            modular_pipeline_ids
        )
        for modular_pipeline_id in sorted(modular_pipeline_ids):
            mock_modular_pipelines.get_or_create_modular_pipeline.assert_any_call(
                modular_pipeline_id
            )
            mock_modular_pipelines._add_inputs.assert_any_call(
                modular_pipeline_id, {"input1", "input2"}
            )
            mock_modular_pipelines._add_outputs.assert_any_call(
                modular_pipeline_id, {"output1", "output2"}
            )
            mock_modular_pipelines._add_children.assert_any_call(
                modular_pipeline_id, ["node1", "node2"]
            )

        mock_pipeline.only_nodes_with_namespace.assert_any_call("namespace1")
        mock_pipeline.only_nodes_with_namespace.assert_any_call("namespace2")
        mock_pipeline.only_nodes_with_namespace.assert_any_call("namespace3")
        mock_pipeline.only_nodes_with_namespace.assert_any_call(
            "namespace3.sub_namespace"
        )

    def test_get_or_create_modular_pipeline(self, mock_modular_pipelines):
        mock_modular_pipelines.get_or_create_modular_pipeline("data_science")

        assert "data_science" in mock_modular_pipelines.tree
        assert sorted(mock_modular_pipelines.as_dict().keys()) == sorted(
            [ROOT_MODULAR_PIPELINE_ID, "data_science"]
        )

        mock_modular_pipelines.get_or_create_modular_pipeline("data_science")
        # make sure no additional pipeline was created
        assert sorted(mock_modular_pipelines.as_dict().keys()) == sorted(
            [ROOT_MODULAR_PIPELINE_ID, "data_science"]
        )

    def test_add_inputs(self, mocker, mock_modular_pipelines):
        modular_pipeline_id = "data_science"
        inputs = {"data_science.input1", "input2", "params: parameter1"}

        mock_modular_pipelines.tree = {modular_pipeline_id: mock.MagicMock()}

        mocker.patch(
            "kedro_viz.data_access.repositories.modular_pipelines._hash_input_output",
            side_effect=lambda value: value,
        )

        mock_modular_pipelines._add_inputs(modular_pipeline_id, inputs)

        assert mock_modular_pipelines.tree[modular_pipeline_id].inputs == inputs
        assert mock_modular_pipelines.parameters == {"params: parameter1"}

    def test_add_outputs(self, mocker, mock_modular_pipelines):
        modular_pipeline_id = "data_science"
        outputs = {"data_science.output1", "output2"}

        mock_modular_pipelines.tree = {modular_pipeline_id: mock.MagicMock()}

        mocker.patch(
            "kedro_viz.data_access.repositories.modular_pipelines._hash_input_output",
            side_effect=lambda value: value,
        )

        mock_modular_pipelines._add_inputs(modular_pipeline_id, outputs)

        assert mock_modular_pipelines.tree[modular_pipeline_id].inputs == outputs

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

    def test_add_children(
        self,
        mocker,
        mock_modular_pipelines,
        mock_modular_pipeline_node,
        mock_kedro_nodes,
    ):
        modular_pipelines_id = "namespace1"

        mocker.patch.object(
            mock_modular_pipelines, "_add_nodes_and_datasets_as_children"
        )
        mocker.patch.object(mock_modular_pipelines, "_add_children_to_parent_pipeline")

        with mocker.patch.object(
            mock_modular_pipelines,
            "get_or_create_modular_pipeline",
            return_value=mock_modular_pipeline_node,
        ):
            mock_modular_pipelines._add_children(modular_pipelines_id, mock_kedro_nodes)

            mock_modular_pipelines._add_nodes_and_datasets_as_children.assert_any_call(
                mock_modular_pipeline_node, [mock_kedro_nodes[0]], {"input1", "output1"}
            )
            mock_modular_pipelines._add_children_to_parent_pipeline.assert_any_call(
                mock_modular_pipeline_node, modular_pipelines_id, {"input1", "output1"}
            )

    def test_add_nodes_and_datasets_as_children(
        self, mocker, mock_modular_pipelines, mock_kedro_nodes
    ):
        mock_modular_pipelines.parameters = {"params:p1", "params:p2"}
        modular_pipeline_node = mock_modular_pipelines.get_or_create_modular_pipeline(
            "namespace1"
        )
        modular_pipeline_inputs_outputs = {"input1", "output1", "input3", "output3"}

        mocker.patch(
            "kedro_viz.data_access.repositories.modular_pipelines._hash",
            side_effect=lambda value: value,
        )
        mocker.patch(
            "kedro_viz.data_access.repositories.modular_pipelines._hash_input_output",
            side_effect=lambda value: value,
        )

        mock_modular_pipelines._add_nodes_and_datasets_as_children(
            modular_pipeline_node, mock_kedro_nodes, modular_pipeline_inputs_outputs
        )

        node_ids = [(str(node)) for node in mock_kedro_nodes]

        expected_children = {
            ModularPipelineChild(id=node_ids[0], type=GraphNodeType.TASK),
            ModularPipelineChild(id=node_ids[1], type=GraphNodeType.TASK),
            ModularPipelineChild(id="input2", type=GraphNodeType.DATA),
            ModularPipelineChild(id="output2", type=GraphNodeType.DATA),
            ModularPipelineChild(id="input4", type=GraphNodeType.DATA),
            ModularPipelineChild(id="output4", type=GraphNodeType.DATA),
        }

        assert modular_pipeline_node.children == expected_children

    def test_add_children_to_parent_pipeline(
        self, mocker, mock_modular_pipelines, mock_modular_pipeline_node
    ):
        parent_modular_pipeline = ModularPipelineNode(
            id="namespace1",
            name="namespace1",
            inputs={"parent_input1"},
            outputs={"parent_output1"},
        )

        mock_modular_pipelines.parameters = {"params:p1"}
        modular_pipeline_inputs_outputs = {
            "input1",
            "output1",
            "parent_input1",
            "parent_output1",
            "params:p1",
        }
        modular_pipeline_id = "namespace1.sub_namespace"

        expected_children = {
            ModularPipelineChild(
                id=modular_pipeline_id, type=GraphNodeType.MODULAR_PIPELINE
            ),
            ModularPipelineChild(id="input1", type=GraphNodeType.DATA),
            ModularPipelineChild(id="output1", type=GraphNodeType.DATA),
        }

        with mocker.patch.object(
            mock_modular_pipelines,
            "get_or_create_modular_pipeline",
            return_value=parent_modular_pipeline,
        ):
            mock_modular_pipelines._add_children_to_parent_pipeline(
                mock_modular_pipeline_node,
                modular_pipeline_id,
                modular_pipeline_inputs_outputs,
            )

            assert parent_modular_pipeline.children == expected_children
