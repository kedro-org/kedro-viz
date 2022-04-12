"""`kedro_viz.services.modular_pipelines` defines modular pipelines-related business logic.
The service layer consist of pure functions operating on domain models.
"""
from typing import Dict

from kedro_viz.constants import DEFAULT_REGISTERED_PIPELINE_ID, ROOT_MODULAR_PIPELINE_ID
from kedro_viz.models.graph import (
    GraphNode,
    GraphNodeType,
    ModularPipelineChild,
    ModularPipelineNode,
)


def expand_tree(
    modular_pipelines_tree: Dict[str, ModularPipelineNode],
    registered_pipeline_id: str = DEFAULT_REGISTERED_PIPELINE_ID,
) -> Dict[str, ModularPipelineNode]:
    """Expand a given modular pipelines tree by adding parents for each node in the tree
    based on the node's ID. Filter out any nodes that don't belong to the given
    registered pipeline ID. The function will return a new copy of the tree,
    instead of mutating the tree in-place.

    While adding a parent of a modular pipeline into the tree, it also updates
    the parent's inputs & outputs with the modular pipeline's inputs & outputs.

    Args:
        modular_pipelines_tree: The modular pipelines tree to expand.
        registered_pipeline_id: The registered pipeline ID to filter modular pipelines.
    Returns:
        The expanded modular pipelines tree.
    Example:
        >>> modular_pipeline_node = GraphNode.create_modular_pipeline_node("one.two")
        >>> tree = {"one.two": modular_pipeline_node}
        >>> expanded_tree = expand_tree(tree)
        >>> assert list(sorted(expanded_tree.keys())) == ["__root__", "one", "one.two"]
    """
    expanded_tree = {
        ROOT_MODULAR_PIPELINE_ID: GraphNode.create_modular_pipeline_node(
            ROOT_MODULAR_PIPELINE_ID
        )
    }
    for modular_pipeline_id, modular_pipeline_node in modular_pipelines_tree.items():
        if (
            modular_pipeline_id == ROOT_MODULAR_PIPELINE_ID
            or not modular_pipeline_node.belongs_to_pipeline(registered_pipeline_id)
        ):
            continue

        if modular_pipeline_id not in expanded_tree:
            expanded_tree[modular_pipeline_id] = modular_pipeline_node

        # Split the materialized path ID of a modular pipeline into the list of parents.
        # Then iterate through this list to construct the tree of child references,
        # with the left-most child being a child of the __root__ node.
        # For example, if the modular pipeline ID is "one.two.three",
        # In each iteration, the tree node ID will be:
        # - one
        # - one.two
        # - one.two.three
        # `one` is a child of the `__root__` node, `one.two` is a child of `one`, and so on.
        chunks = modular_pipeline_id.split(".")
        num_chunks = len(chunks)
        expanded_tree[ROOT_MODULAR_PIPELINE_ID].children.add(
            ModularPipelineChild(
                id=chunks[0],
                type=GraphNodeType.MODULAR_PIPELINE,
            )
        )
        if num_chunks == 1:
            continue

        for i in range(1, num_chunks):
            parent_id = ".".join(chunks[:i])
            if parent_id not in expanded_tree:
                expanded_tree[parent_id] = GraphNode.create_modular_pipeline_node(
                    parent_id,
                )

            expanded_tree[parent_id].pipelines.update(modular_pipeline_node.pipelines)
            expanded_tree[parent_id].children.add(
                ModularPipelineChild(
                    id=f"{parent_id}.{chunks[i]}",
                    type=GraphNodeType.MODULAR_PIPELINE,
                )
            )
            expanded_tree[parent_id].internal_inputs.update(
                modular_pipeline_node.internal_inputs
            )
            expanded_tree[parent_id].external_inputs.update(
                modular_pipeline_node.external_inputs
            )
            expanded_tree[parent_id].internal_outputs.update(
                modular_pipeline_node.internal_outputs
            )
            expanded_tree[parent_id].external_outputs.update(
                modular_pipeline_node.external_outputs
            )
    return expanded_tree
