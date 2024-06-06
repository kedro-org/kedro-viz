import pytest

from kedro_viz.models.flowchart import GraphNode
from kedro_viz.services.layers import sort_layers


@pytest.mark.parametrize(
    "graph_schema,nodes,node_dependencies,expected",
    [
        (
            # direct dependency
            "node_1(layer=raw) -> node_2(layer=int)",
            {
                "node_1": {"id": "node_1", "layer": "raw"},
                "node_2": {"id": "node_2", "layer": "int"},
            },
            {"node_1": {"node_2"}, "node_2": set()},
            ["raw", "int"],
        ),
        (
            # more than 1 node in a layer
            "node_1 -> node_2(layer=raw) -> node_3(layer=raw) -> node_4(layer=int)",
            {
                "node_1": {"id": "node_1"},
                "node_2": {"id": "node_2", "layer": "raw"},
                "node_3": {"id": "node_3", "layer": "raw"},
                "node_4": {"id": "node_4", "layer": "int"},
            },
            {
                "node_1": {"node_2"},
                "node_2": {"node_3"},
                "node_3": {"node_4"},
                "node_4": set(),
            },
            ["raw", "int"],
        ),
        (
            # indirect dependency
            "node_1(layer=raw) -> node_2 -> node_3(layer=int)",
            {
                "node_1": {"id": "node_1", "layer": "raw"},
                "node_2": {"id": "node_2"},
                "node_3": {"id": "node_3", "layer": "int"},
            },
            {"node_1": {"node_2"}, "node_2": {"node_3"}, "node_3": set()},
            ["raw", "int"],
        ),
        (
            # fan-in dependency
            """
            node_1(layer=raw) -> node_2 -> node_3(layer=int) -> node_6(layer=feature)
            node_4(layer=int) -> node_5 -----------------------------^
            """,
            {
                "node_1": {"id": "node_1", "layer": "raw"},
                "node_2": {"id": "node_2"},
                "node_3": {"id": "node_3", "layer": "int"},
                "node_4": {"id": "node_4", "layer": "int"},
                "node_5": {"id": "node_5"},
                "node_6": {"id": "node_6", "layer": "feature"},
            },
            {
                "node_1": {"node_2"},
                "node_2": {"node_3"},
                "node_3": {"node_6"},
                "node_4": {"node_5"},
                "node_5": {"node_6"},
                "node_6": set(),
            },
            ["raw", "int", "feature"],
        ),
        (
            # fan-out dependency: note that model_input comes after feature here based on
            # alphabetical order since they have no dependency relationship.
            """
            node_1(layer=raw) -> node_2 -> node_3(layer=int) -> node_6 -> node_7(layer=feature)
                    |----------> node_4(layer=int) -> node_5(layer=model_input)
            """,
            {
                "node_1": {"id": "node_1", "layer": "raw"},
                "node_2": {"id": "node_2"},
                "node_3": {"id": "node_3", "layer": "int"},
                "node_4": {"id": "node_4", "layer": "int"},
                "node_5": {"id": "node_5", "layer": "model_input"},
                "node_6": {"id": "node_6"},
                "node_7": {"id": "node_7", "layer": "feature"},
            },
            {
                "node_1": {"node_2"},
                "node_2": {"node_3"},
                "node_3": {"node_6"},
                "node_4": {"node_5"},
                "node_5": set(),
                "node_6": {"node_7"},
                "node_7": set(),
            },
            ["raw", "int", "feature", "model_input"],
        ),
        (
            # fan-out-fan-in dependency
            """
            node_1(layer=raw) -> node_2 -> node_3(layer=int) -> node_6 -> node_7(layer=feature)
                    |----------> node_4(layer=int) -> node_5(layer=model_input) --^
            """,
            {
                "node_1": {"id": "node_1", "layer": "raw"},
                "node_2": {"id": "node_2"},
                "node_3": {"id": "node_3", "layer": "int"},
                "node_4": {"id": "node_4", "layer": "int"},
                "node_5": {"id": "node_5", "layer": "model_input"},
                "node_6": {"id": "node_6"},
                "node_7": {"id": "node_7", "layer": "feature"},
            },
            {
                "node_1": {"node_2"},
                "node_2": {"node_3"},
                "node_3": {"node_6"},
                "node_4": {"node_5"},
                "node_5": {"node_7"},
                "node_6": {"node_7"},
                "node_7": set(),
            },
            ["raw", "int", "model_input", "feature"],
        ),
        (
            # disjoint dependency: when two groups of layers have no direct
            # dependencies,their order is determined by topological order first and
            # alphabetical order second, which is the default of the toposort library.
            # In the example below, toposort the layers will give [{c, d}, {b, a}],
            # so it will become [c, d, a, b] when flattened.
            """
            node_1(layer=c) -> node_2(layer=a)
            node_3(layer=d) -> node_4(layer=b)
            """,
            {
                "node_1": {"id": "node_1", "layer": "c"},
                "node_2": {"id": "node_2", "layer": "a"},
                "node_3": {"id": "node_3", "layer": "d"},
                "node_4": {"id": "node_4", "layer": "b"},
            },
            {"node_1": {"node_2"}, "node_2": {}, "node_3": {"node_4"}, "node_4": {}},
            ["c", "d", "a", "b"],
        ),
        (
            # completely disjoint nodes:
            """
            node_1(layer=a)
            node_2(layer=b)
            """,
            {
                "node_1": {"id": "node_1", "layer": "a"},
                "node_2": {"id": "node_2", "layer": "b"},
            },
            {"node_1": {}, "node_2": {}},
            ["a", "b"],
        ),
    ],
)
def test_sort_layers(graph_schema, nodes, node_dependencies, expected):
    nodes = {
        node_id: GraphNode.create_data_node(
            dataset_id=node_dict["id"],
            dataset_name=node_dict["id"],
            layer=node_dict.get("layer"),
            tags=set(),
            dataset=None,
            stats=None,
            modular_pipelines=None,
        )
        for node_id, node_dict in nodes.items()
    }
    assert sort_layers(nodes, node_dependencies) == expected, graph_schema


def test_sort_layers_should_return_empty_list_on_cyclic_layers(mocker):
    # node_1(layer=raw) -> node_2(layer=int) -> node_3(layer=raw)
    mocked_warning = mocker.patch("kedro_viz.services.layers.logger.warning")
    data = {
        "node_1": {"id": "node_1", "layer": "raw"},
        "node_2": {"id": "node_2", "layer": "int"},
        "node_3": {"id": "node_3", "layer": "raw"},
    }
    nodes = {
        node_id: GraphNode.create_data_node(
            dataset_id=node_dict["id"],
            dataset_name=node_dict["id"],
            layer=node_dict.get("layer"),
            tags=set(),
            dataset=None,
            stats=None,
            modular_pipelines=None,
        )
        for node_id, node_dict in data.items()
    }
    node_dependencies = {"node_1": {"node_2"}, "node_2": {"node_3"}, "node_3": set()}
    assert not sort_layers(nodes, node_dependencies)
    mocked_warning.assert_called_once_with(
        "Layers visualisation is disabled as circular dependency detected among layers.",
    )
