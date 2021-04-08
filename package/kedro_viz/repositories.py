from dataclasses import asdict

from kedro_viz.models import GraphNode


class GraphNodeRepository:
    def __init__(self):
        self._graph_nodes_dict = {}
        self._graph_nodes_list = []

    def _has_node(self, node: GraphNode) -> bool:
        return node.id in self._graph_nodes_dict

    def _add_node(self, node: GraphNode) -> bool:
        node_dict = asdict(node)
        self._graph_nodes_dict[node.id] = node_dict
        self._graph_nodes_list.append(node_dict)

    def create_or_update(self, node: GraphNode, pipeline_name: str):
        if self._has_node(node):
            self._graph_nodes_dict[node.id]["pipelines"].append(pipeline_name)
        else:
            self._add_node(node)
