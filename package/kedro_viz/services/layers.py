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
"""`kedro_viz.services.layers` defines layers-related logic."""
from collections import defaultdict
from typing import Dict, List, Set

from toposort import toposort_flatten

from kedro_viz.models.graph import GraphNode


def sort_layers(
    nodes: Dict[str, GraphNode], dependencies: Dict[str, Set[str]]
) -> List[str]:
    """Given a DAG represented by a dictionary of nodes, some of which have a `layer` attribute,
    along with their dependencies, return the list of all layers sorted according to
    the nodes' topological order, i.e. a layer should appear before another layer in the list
    if its node is a dependency of the other layer's node, directly or indirectly.

    For example, given the following graph:
        node1(layer=a) -> node2 -> node4 -> node6(layer=d)
                            |                   ^
                            v                   |
                        node3(layer=b) -> node5(layer=c)
    The layers ordering should be: [a, b, c, d]

    In theory, this is a problem of finding the
    [transitive closure](https://en.wikipedia.org/wiki/Transitive_closure) in a graph of layers
    and then toposort them. The algorithm below follows a repeated depth-first search approach:
        * For every node, find all layers that depends on it in a depth-first search.
        * While traversing, build up a dictionary of {node_id -> layers} for the node
        that have already been visited.
        * Turn the final {node_id -> layers} into a {layer -> layers} to represent the layers'
        dependencies. Note: the key is a layer and the values are the parents of that layer,
        just because that's the format toposort requires.
        * Feed this layers dictionary to ``toposort`` and return the sorted values.
        * Raise CircularDependencyError if the layers cannot be sorted topologically,
        i.e. there are cycles among the layers.

    Args:
        nodes: A dictionary of {node_id -> node} represents the nodes in the graph.
        dependencies: A dictionary of {node_id -> set(child_ids)}
            represents the direct dependencies between nodes in the graph.

    Returns:
        The list of layers sorted based on topological order.

    Raises:
        CircularDependencyError: When the layers have cyclic dependencies.
    """
    node_layers: Dict[str, Set[str]] = {}  # map node_id to the layers that depend on it

    def find_child_layers(node_id: str) -> Set[str]:
        """For the given node_id, find all layers that depend on it in a depth-first manner.
        Build up the node_layers dependency dictionary while traversing so each node is visited
        only once.
        Note: Python's default recursive depth limit is 1000, which means this algorithm won't
        work for pipeline with more than 1000 nodes. However, we can rewrite this using stack if
        we run into this limit in practice.
        """
        if node_id in node_layers:
            return node_layers[node_id]

        node_layers[node_id] = set()

        # for each child node of the given node_id,
        # mark its layer and all layers that depend on it as child layers of the given node_id.
        for child_node_id in dependencies[node_id]:
            child_node = nodes[child_node_id]
            child_layer = getattr(child_node, "layer", None)
            if child_layer is not None:
                node_layers[node_id].add(child_layer)
            node_layers[node_id].update(find_child_layers(child_node_id))

        return node_layers[node_id]

    # populate node_layers dependencies
    for node_id in nodes:
        find_child_layers(node_id)

    # compute the layer dependencies dictionary based on the node_layers dependencies,
    # represented as {layer -> set(parent_layers)}
    layer_dependencies = defaultdict(set)
    for node_id, child_layers in node_layers.items():
        node_layer = getattr(nodes[node_id], "layer", None)

        # add the node's layer as a parent layer for all child layers.
        # Even if a child layer is the same as the node's layer, i.e. a layer is marked
        # as its own parent, toposort still works so we don't need to check for that explicitly.
        if node_layer is not None:
            for layer in child_layers:
                layer_dependencies[layer].add(node_layer)

    # toposort the layer_dependencies to find the layer order.
    # Note that for string, toposort_flatten will default to alphabetical order for tie-break.
    return toposort_flatten(layer_dependencies)
