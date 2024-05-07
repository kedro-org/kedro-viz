from kedro_viz.constants import DEFAULT_REGISTERED_PIPELINE_ID, ROOT_MODULAR_PIPELINE_ID
from kedro_viz.models.flowchart import GraphNode, GraphNodeType, ModularPipelineChild
from kedro_viz.services import modular_pipelines_services


def test_expand_tree_no_nested_key():
    modular_pipeline_id = "data_science"
    modular_pipeline_node = GraphNode.create_modular_pipeline_node(modular_pipeline_id)
    modular_pipeline_node.add_pipeline(DEFAULT_REGISTERED_PIPELINE_ID)
    tree = {modular_pipeline_id: modular_pipeline_node}
    expanded_tree = modular_pipelines_services.expand_tree(tree)
    assert sorted(expanded_tree.keys()) == [ROOT_MODULAR_PIPELINE_ID, "data_science"]
    assert expanded_tree[modular_pipeline_id].name == "data_science"


def test_expanded_tree_with_nested_key():
    modular_pipeline_id = "uk.data_science.model_training"
    modular_pipeline_node = GraphNode.create_modular_pipeline_node(modular_pipeline_id)
    modular_pipeline_node.add_pipeline(DEFAULT_REGISTERED_PIPELINE_ID)
    tree = {modular_pipeline_id: modular_pipeline_node}
    expanded_tree = modular_pipelines_services.expand_tree(tree)
    assert sorted(expanded_tree.keys()) == [
        ROOT_MODULAR_PIPELINE_ID,
        "uk",
        "uk.data_science",
        "uk.data_science.model_training",
    ]
    assert expanded_tree[ROOT_MODULAR_PIPELINE_ID].children == {
        ModularPipelineChild(id="uk", type=GraphNodeType.MODULAR_PIPELINE)
    }
    assert expanded_tree["uk"].children == {
        ModularPipelineChild(id="uk.data_science", type=GraphNodeType.MODULAR_PIPELINE)
    }
    assert expanded_tree["uk.data_science"].children == {
        ModularPipelineChild(
            id="uk.data_science.model_training",
            type=GraphNodeType.MODULAR_PIPELINE,
        )
    }
