"""`kedro_viz.data_access.repositories.graph` defines interface to
centralise access to graph objects."""
# pylint: disable=missing-class-docstring,missing-function-docstring
from typing import Dict, Generator, List, Optional, Set

from kedro_viz.models.flowchart import GraphEdge, GraphNode


class GraphNodesRepository:
    def __init__(self):
        self.nodes_dict: Dict[str, GraphNode] = {}
        self.nodes_list: List[GraphNode] = []

    def has_node(self, node: GraphNode) -> bool:
        return node.id in self.nodes_dict

    def add_node(self, node: GraphNode) -> GraphNode:
        if not self.has_node(node):
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


class GraphEdgesRepository:
    """Repository for the set of edges in a registered pipeline."""

    def __init__(self):
        self.edges_list: Set[GraphEdge] = set()

    def __iter__(self) -> Generator:
        for edge in self.edges_list:
            yield edge

    def remove_edge(self, edge: GraphEdge):
        """Remove an edge from this edge repository.

        Args:
            edge: The edge to remove.

        Example:
            >>> edges = GraphEdgesRepository()
            >>> edges.add_edge(GraphEdge(source="foo", target="bar"))
            >>> edges.remove_edge(GraphEdge(source="foo", target="bar"))
            >>> edges.as_list()
            []
        """
        self.edges_list.remove(edge)

    def add_edge(self, edge: GraphEdge):
        """Add an edge to this edge repository.

        Args:
            edge: The edge to add.

        Example:
            >>> edges = GraphEdgesRepository()
            >>> edges.add_edge(GraphEdge(source="foo", target="bar"))
            >>> edges.as_list()
            [GraphEdge(source='foo', target='bar')]
        """
        self.edges_list.add(edge)

    def as_list(self) -> List[GraphEdge]:
        """Return all edges in the repository as a list."""
        return list(self.edges_list)

    def get_edges_by_node_ids(self, node_ids: Set[str]) -> List[GraphEdge]:
        """Return all edges whose source and target are in a given set of node_ids.
        Args:
            node_ids: The set of node_ids to get edges for.
        Returns:
            List of edges whose source and target are in the given set of node_ids.
            Return an empty list if no such edge can be found.
        Example:
            >>> edges = GraphEdgesRepository()
            >>> edges.add_edge(GraphEdge(source="foo", target="bar"))
            >>> edges.get_edges_by_node_ids({"foo", "bar"})
            [GraphEdge(source='foo', target='bar')]
            >>> edges.get_edges_by_node_ids({"doesnt exist"})
            []
        """
        return [e for e in self.edges_list if {e.source, e.target}.issubset(node_ids)]
