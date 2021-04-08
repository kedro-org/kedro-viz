from dataclasses import asdict

from kedro_viz.models import GraphNode


class GraphNodeRepository:
    def __init__(self):
        self._graph_nodes_dict: Dict[str, GraphNode] = {}
        self._graph_nodes_list: List[GraphNode] = []

    def _has_node(self, node: GraphNode) -> bool:
        return node.id in self._graph_nodes_dict

    def _add_node(self, node: GraphNode) -> bool:
        self._graph_nodes_dict[node.id] = node
        self._graph_nodes_list.append(node)

    def get(self, node_id: str):
        return self._graph_nodes_dict[node_id]

    def create_or_update(self, node: GraphNode, pipeline_name: str):
        if self._has_node(node):
            self._graph_nodes_dict[node.id].add_pipeline(pipeline_name)
        else:
            self._add_node(node)

    def as_list(self):
        return [asdict(node) for node in self._graph_nodes_list]

    def as_dict(self):
        return {
            node_id: asdict(node) for node_id, node in self._graph_nodes_dict.items()
        }
