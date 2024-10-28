"""`kedro_viz.services.layers` defines layers-related logic."""

import logging
from collections import defaultdict
from graphlib import CycleError, TopologicalSorter
from typing import Dict, List, Set

from kedro_viz.models.flowchart import GraphNode

logger = logging.getLogger(__name__)


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
        just because that's the format TopologicalSorter requires.
        * Takes layers dictionary to ``graphlib.TopologicalSorter`` and return the sorted values.
        * Raise CycleError if the layers cannot be sorted topologically,
        i.e. there are cycles among the layers.

    Args:
        nodes: A dictionary of {node_id -> node} represents the nodes in the graph.
        dependencies: A dictionary of {node_id -> set(child_ids)}
            represents the direct dependencies between nodes in the graph.

    Returns:
        The list of layers sorted based on topological order.

    Raises:
        CycleError: When the layers have cyclic dependencies.
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

        # The layer of the current node can also be considered as depending on that node.
        # This is to cater for the edge case where all nodes are completely disjoint from each other
        # and no dependency graph for layers can be constructed,
        # yet the layers still need to be displayed.
        node_layer = getattr(nodes[node_id], "layer", None)
        if node_layer is not None:
            node_layers[node_id].add(node_layer)

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
    for node_id in sorted(nodes):  # Sort nodes
        find_child_layers(node_id)

    # compute the layer dependencies dictionary based on the node_layers dependencies,
    # represented as {layer -> set(parent_layers)}
    layer_dependencies = defaultdict(set)
    all_layers = set()  # keep track of all layers encountered
    for node_id, child_layers in node_layers.items():
        node_layer = getattr(nodes[node_id], "layer", None)
        if node_layer is not None:
            all_layers.add(node_layer)
            for layer in child_layers:
                all_layers.add(layer)
                # Avoid adding the node's layer as a parent of itself
                if layer != node_layer:
                    layer_dependencies[layer].add(node_layer)

    # Add empty dependencies for all layers to ensure they appear in the sorting
    for layer in all_layers:
        if layer not in layer_dependencies:
            layer_dependencies[layer] = set()

    # Use graphlib.TopologicalSorter to sort the layer dependencies.
    try:
        sorter = TopologicalSorter(layer_dependencies)
        sorted_layers = list(sorter.static_order())
        # Ensure the order is stable and respects the original input order
        # `sorted_layers.index(layer)` ensures the order from topological sorting is preserved.
        # `layer` ensures that if two layers have the same dependency level,
        # they are sorted alphabetically.
        return sorted(
            sorted_layers, key=lambda layer: (sorted_layers.index(layer), layer)
        )
    except CycleError:
        logger.warning(
            "Layers visualisation is disabled as circular dependency detected among layers."
        )
        return []
