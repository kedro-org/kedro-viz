from kedro.pipeline import node

from kedro_viz.data_access.repositories import (
    GraphEdgesRepository,
    GraphNodesRepository,
)
from kedro_viz.models.flowchart import GraphEdge, GraphNode


class TestGraphNodeRepository:
    def test_get_node_by_id(self, identity):
        repo = GraphNodesRepository()
        task_node = GraphNode.create_task_node(
            node(identity, inputs="x", outputs=None), "identity_node", None
        )
        assert repo.get_node_by_id(task_node.id) is None
        repo.add_node(task_node)
        assert repo.get_node_by_id(task_node.id) is task_node

    def test_filter_by_ids(self, identity):
        repo = GraphNodesRepository()
        task_node_ids = []
        task_nodes = []
        for i in range(5):
            task_node = GraphNode.create_task_node(
                node(identity, inputs="x", outputs=None, name=f"identity_{i}"),
                f"identity_{i}",
                None,
            )
            task_node_ids.append(task_node.id)
            task_nodes.append(task_node)
            repo.add_node(task_node)

        filtered = repo.get_nodes_by_ids(set(task_node_ids[:-1]))
        assert filtered == task_nodes[:-1]
        assert task_nodes[-1] not in filtered
        assert repo.get_nodes_by_ids({"not exist"}) == []

    def test_get_node_ids(self, identity):
        repo = GraphNodesRepository()
        task_node = GraphNode.create_task_node(
            node(identity, inputs="x", outputs=None), "identity_node", None
        )
        repo.add_node(task_node)
        assert repo.get_node_ids() == ["identity_node"]


class TestGraphEdgesRepository:
    def test_filter_by_node_is(self):
        ab = GraphEdge(source="a", target="b")
        bc = GraphEdge(source="b", target="c")
        cd = GraphEdge(source="c", target="d")
        da = GraphEdge(source="d", target="a")
        repo = GraphEdgesRepository()
        for edge in [ab, bc, cd, da]:
            repo.add_edge(edge)
        assert set(repo.get_edges_by_node_ids({"a", "b", "d"})) == {
            ab,
            da,
        }
