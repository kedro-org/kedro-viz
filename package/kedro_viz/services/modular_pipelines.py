# Copyright 2021 QuantumBlack Visual Analytics Limited
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
# EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
# OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND
# NONINFRINGEMENT. IN NO EVENT WILL THE LICENSOR OR OTHER CONTRIBUTORS
# BE LIABLE FOR ANY CLAIM, DAMAGES, OR OTHER LIABILITY, WHETHER IN AN
# ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF, OR IN
# CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
#
# The QuantumBlack Visual Analytics Limited ("QuantumBlack") name and logo
# (either separately or in combination, "QuantumBlack Trademarks") are
# trademarks of QuantumBlack. The License does not grant you any right or
# license to the QuantumBlack Trademarks. You may not use the QuantumBlack
# Trademarks or any confusingly similar mark as a trademark for your product,
# or use the QuantumBlack Trademarks in any other manner that might cause
# confusion in the marketplace, including but not limited to in advertising,
# on websites, or on software.
#
# See the License for the specific language governing permissions and
# limitations under the License.
"""`kedro_viz.services.modular_pipelines` defines modular pipelines-related business logic.
The service layer consist of pure functions operating on domain models.
"""
from typing import Dict, List

from kedro_viz.constants import ROOT_MODULAR_PIPELINE_ID
from kedro_viz.models.graph import (
    GraphNode,
    GraphNodeType,
    ModularPipelineChild,
    ModularPipelineNode,
)


def expand_tree(
    modular_pipelines_tree: Dict[str, ModularPipelineNode]
) -> Dict[str, ModularPipelineNode]:
    """Expand a given modular pipelines tree by adding parents for each node in the tree
    based on the node's ID. The function will return a new copy of the tree,
    instead of mutating the tree in-place.

    While adding a parent of a modular pipeline into the tree, it also updates
    the parent's inputs & outputs with the modular pipeline's inputs & outputs.

    Args:
        modular_pipelines_tree: The modular pipeline stree to expand.
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


def tree_to_list(
    modular_pipelines_tree: Dict[str, ModularPipelineNode]
) -> List[Dict[str, str]]:
    """Serialise a tree to a list of {id, name} for each tree node except the __root__ node.
    N.B.: This is only temporarily needed until the new frontend supports the full tree structure.

    Args:
        modular_pipelines_tree: The modulars pipeline tree to convert to list.
    Returns:
        The list of modular pipelines tree node IDs & names.
    Example:
        >>> modular_pipeline_node = GraphNode.create_modular_pipeline_node("one.two")
        >>> tree = {"one.two": modular_pipeline_node}
        >>> expanded_tree = expand_tree(tree)
        >>> tree_to_list(expanded_tree)
        [{'id': 'one', 'name': 'One'}, {'id': 'one.two', 'name': 'Two'}]
    """
    return [
        {
            "id": modular_pipeline_id,
            "name": modular_pipeline_node.name,
        }
        for modular_pipeline_id, modular_pipeline_node in sorted(
            modular_pipelines_tree.items()
        )
        if modular_pipeline_id != ROOT_MODULAR_PIPELINE_ID
    ]
