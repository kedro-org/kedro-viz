"""`kedro_viz.data_access.repositories.graph` defines interface to
centralise access to graph objects."""

from typing import Dict, List, Optional, Set

from kedro_viz.models.flowchart.nodes import GraphNode


class GraphNodesRepository:
    def __init__(self):
        self.nodes_dict: Dict[str, GraphNode] = {}
        self.nodes_list: List[GraphNode] = []

    def add_node(self, node: GraphNode) -> GraphNode:
        existing_node = self.nodes_dict.get(node.id)
        if existing_node:
            # Update tags or other attributes if the node already exists
            existing_node.tags.update(node.tags)
        else:
            self.nodes_dict[node.id] = node
            self.nodes_list.append(node)
        return self.nodes_dict[node.id]

    def get_node_by_id(self, node_id: str) -> Optional[GraphNode]:
        return self.nodes_dict.get(node_id, None)

    def as_list(self) -> List[GraphNode]:
        return self.nodes_list

    def as_dict(self) -> Dict[str, GraphNode]:
        return self.nodes_dict

    def get_node_ids(self) -> List[str]:
        return list(self.nodes_dict.keys())

    def get_nodes_by_ids(self, node_ids: Set[str]) -> List[GraphNode]:
        return [n for n in self.nodes_list if n.id in node_ids]
