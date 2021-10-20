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
import pytest

from kedro_viz.models.graph import GraphNode
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
            full_name=node_dict["id"],
            layer=node_dict.get("layer"),
            tags=None,
            dataset=None,
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
            full_name=node_dict["id"],
            layer=node_dict.get("layer"),
            tags=None,
            dataset=None,
        )
        for node_id, node_dict in data.items()
    }
    node_dependencies = {"node_1": {"node_2"}, "node_2": {"node_3"}, "node_3": set()}
    assert sort_layers(nodes, node_dependencies) == []
    mocked_warning.assert_called_once_with(
        "Layers visualisation is disabled as circular dependency detected among layers.",
    )
