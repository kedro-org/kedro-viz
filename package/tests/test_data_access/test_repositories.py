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
# Test repositories methods that are not covered by generic managers tests.
import pytest
from kedro.extras.datasets.pandas import CSVDataSet
from kedro.pipeline import node

from kedro_viz.constants import ROOT_MODULAR_PIPELINE_ID
from kedro_viz.data_access.repositories import (
    GraphEdgesRepository,
    GraphNodesRepository,
    ModularPipelinesRepository,
    RegisteredPipelinesRepository,
)
from kedro_viz.models.graph import GraphEdge, GraphNode


def identity(x):
    return x


class TestGraphNodeRepository:
    def test_get_node_by_id(self):
        repo = GraphNodesRepository()
        task_node = GraphNode.create_task_node(node(identity, inputs="x", outputs=None))
        assert repo.get_node_by_id(task_node.id) is None
        repo.add_node(task_node)
        assert repo.get_node_by_id(task_node.id) is task_node

    def test_filter_by_ids(self):
        repo = GraphNodesRepository()
        task_node_ids = []
        task_nodes = []
        for i in range(5):
            task_node = GraphNode.create_task_node(
                node(identity, inputs="x", outputs=None, name=f"identity_{i}")
            )
            task_node_ids.append(task_node.id)
            task_nodes.append(task_node)
            repo.add_node(task_node)

        filtered = repo.get_nodes_by_ids(set(task_node_ids[:-1]))
        assert filtered == task_nodes[:-1]
        assert task_nodes[-1] not in filtered
        assert repo.get_nodes_by_ids({"not exist"}) == []


class TestGraphEdgesRepository:
    def test_filter_by_node_is(self):
        ab = GraphEdge(source="a", target="b")
        bc = GraphEdge(source="b", target="c")
        cd = GraphEdge(source="c", target="d")
        da = GraphEdge(source="d", target="a")
        repo = GraphEdgesRepository()
        for edge in [ab, bc, cd, da]:
            repo.add_edge(edge)
        assert set(repo.get_edges_by_node_ids({"a", "b", "d"})) == {ab, da}


class TestRegisteredPipelinesrepository:
    def test_get_node_ids_in_pipeline(self):
        repo = RegisteredPipelinesRepository()
        repo.add_node("__default__", "a")
        repo.add_node("__default__", "b")
        assert repo.get_node_ids_by_pipeline_id("__default__") == {"a", "b"}
        assert repo.get_node_ids_by_pipeline_id("another") == set()


class TestModularPipelinesRepository:
    def test_init_should_create_a_tree_with_default_root(self):
        modular_pipelines = ModularPipelinesRepository()
        assert modular_pipelines.has_modular_pipeline(ROOT_MODULAR_PIPELINE_ID)

    def test_get_or_create_modular_pipeline(self):
        modular_pipelines = ModularPipelinesRepository()
        modular_pipelines.get_or_create_modular_pipeline("data_science")

        assert modular_pipelines.has_modular_pipeline("data_science")
        assert sorted(modular_pipelines.as_dict().keys()) == sorted(
            [ROOT_MODULAR_PIPELINE_ID, "data_science"]
        )

        modular_pipelines.get_or_create_modular_pipeline("data_science")
        # make sure no additional pipeline was created
        assert sorted(modular_pipelines.as_dict().keys()) == sorted(
            [ROOT_MODULAR_PIPELINE_ID, "data_science"]
        )

    def test_extract_from_node(self):
        task_node = GraphNode.create_task_node(
            node(identity, inputs="x", outputs=None, namespace="data_science")
        )
        modular_pipelines = ModularPipelinesRepository()
        assert not modular_pipelines.has_modular_pipeline("data_science")
        modular_pipelines.extract_from_node(task_node)
        assert modular_pipelines.has_modular_pipeline("data_science")

    def test_add_input(self):
        kedro_dataset = CSVDataSet(filepath="foo.csv")
        modular_pipelines = ModularPipelinesRepository()
        data_science_pipeline = modular_pipelines.get_or_create_modular_pipeline(
            "data_science"
        )
        data_node = GraphNode.create_data_node(
            full_name="data_science.model",
            layer="model",
            tags=set(),
            dataset=kedro_dataset,
        )
        modular_pipelines.add_input("data_science", data_node)
        assert data_node.id in data_science_pipeline.inputs

    def test_add_output(self):
        kedro_dataset = CSVDataSet(filepath="foo.csv")
        modular_pipelines = ModularPipelinesRepository()
        data_science_pipeline = modular_pipelines.get_or_create_modular_pipeline(
            "data_science"
        )
        data_node = GraphNode.create_data_node(
            full_name="data_science.model",
            layer="model",
            tags=set(),
            dataset=kedro_dataset,
        )
        modular_pipelines.add_output("data_science", data_node)
        assert data_node.id in data_science_pipeline.outputs

    def test_add_input_should_raise_if_adding_non_data_node(self):
        task_node = GraphNode.create_task_node(
            node(identity, inputs="x", outputs=None, namespace="data_science")
        )
        modular_pipelines = ModularPipelinesRepository()
        with pytest.raises(ValueError):
            modular_pipelines.add_input("data_science", task_node)

    def test_add_output_should_raise_if_adding_non_data_node(self):
        task_node = GraphNode.create_task_node(
            node(identity, inputs="x", outputs=None, namespace="data_science")
        )
        modular_pipelines = ModularPipelinesRepository()
        with pytest.raises(ValueError):
            modular_pipelines.add_output("data_science", task_node)
