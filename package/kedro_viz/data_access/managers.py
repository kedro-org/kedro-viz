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
"""`kedro_viz.data_access.managers` defines data access managers."""
from collections import defaultdict
from typing import Dict, List, Union

from kedro.io import DataCatalog
from kedro.pipeline import Pipeline as KedroPipeline
from kedro.pipeline.node import Node as KedroNode

from kedro_viz.models.graph import (
    DataNode,
    GraphEdge,
    GraphNode,
    ParametersNode,
    RegisteredPipeline,
    TaskNode,
)

from .repositories import (
    CatalogRepository,
    GraphEdgesRepository,
    GraphNodesRepository,
    LayersRepository,
    ModularPipelinesRepository,
    RegisteredPipelinesRepository,
    TagsRepository,
)


# pylint: disable=too-many-instance-attributes,missing-function-docstring
class DataAccessManager:
    """Centralised interface for the rest of the application to interact with data repositories."""

    def __init__(self):
        self.catalog = CatalogRepository()
        self.nodes = GraphNodesRepository()
        self.edges = GraphEdgesRepository()
        self.registered_pipelines = RegisteredPipelinesRepository()
        self.tags = TagsRepository()
        self.modular_pipelines = ModularPipelinesRepository()
        self.node_dependencies = defaultdict(set)
        self.layers = LayersRepository()

    def add_catalog(self, catalog: DataCatalog):
        self.catalog.set_catalog(catalog)

    def add_pipelines(self, pipelines: Dict[str, KedroPipeline]):
        for pipeline_key, pipeline in pipelines.items():
            self.add_pipeline(pipeline_key, pipeline)

        # After adding the pipelines, we will have to manually go through parameters nodes
        # to remove non-modular pipelines that we infer from the parameters' name.
        # The reason is because we only know the complete list of valid modular pipelines
        # after iterating through all task and data nodes.
        self._remove_non_modular_pipelines()

    def add_pipeline(self, pipeline_key: str, pipeline: KedroPipeline):
        self.registered_pipelines.add_pipeline(pipeline_key)
        free_inputs = pipeline.inputs()
        for node in sorted(pipeline.nodes, key=lambda n: n.name):
            task_node = self.add_node(pipeline_key, node)
            self.registered_pipelines.add_node(pipeline_key, task_node.id)

            for input_ in node.inputs:
                is_free_input = input_ in free_inputs
                input_node = self.add_node_input(
                    pipeline_key, input_, task_node, is_free_input
                )
                self.registered_pipelines.add_node(pipeline_key, input_node.id)

            for output in node.outputs:
                output_node = self.add_node_output(pipeline_key, output, task_node)
                self.registered_pipelines.add_node(pipeline_key, output_node.id)

    def add_node(self, pipeline_key: str, node: KedroNode) -> TaskNode:
        task_node: TaskNode = self.nodes.add_node(GraphNode.create_task_node(node))
        task_node.add_pipeline(pipeline_key)
        self.tags.add_tags(task_node.tags)
        self.modular_pipelines.add_modular_pipeline(task_node.modular_pipelines)
        return task_node

    def add_node_input(
        self,
        pipeline_key: str,
        input_dataset: str,
        task_node: TaskNode,
        is_free_input: bool = False,
    ) -> Union[DataNode, ParametersNode]:
        graph_node = self.add_dataset(
            pipeline_key, input_dataset, is_free_input=is_free_input
        )
        graph_node.tags.update(task_node.tags)
        self.edges.add_edge(GraphEdge(source=graph_node.id, target=task_node.id))
        self.node_dependencies[graph_node.id].add(task_node.id)

        if isinstance(graph_node, ParametersNode):
            self.add_parameters_to_task_node(
                parameters_node=graph_node, task_node=task_node
            )
        return graph_node

    def add_node_output(
        self, pipeline_key: str, output_dataset: str, task_node: TaskNode
    ) -> Union[DataNode, ParametersNode]:
        graph_node = self.add_dataset(pipeline_key, output_dataset)
        graph_node.tags.update(task_node.tags)
        self.edges.add_edge(GraphEdge(source=task_node.id, target=graph_node.id))
        self.node_dependencies[task_node.id].add(graph_node.id)
        return graph_node

    def add_dataset(
        self, pipeline_key: str, dataset_name: str, is_free_input: bool = False
    ) -> Union[DataNode, ParametersNode]:
        obj = self.catalog.get_dataset(dataset_name)
        layer = self.catalog.get_layer_for_dataset(dataset_name)
        graph_node: Union[DataNode, ParametersNode]
        if self.catalog.is_dataset_param(dataset_name):
            graph_node = GraphNode.create_parameters_node(
                full_name=dataset_name,
                layer=layer,
                tags=set(),
                parameters=obj,
            )
        else:
            graph_node = GraphNode.create_data_node(
                full_name=dataset_name,
                layer=layer,
                tags=set(),
                dataset=obj,
                is_free_input=is_free_input,
            )
            self.modular_pipelines.add_modular_pipeline(graph_node.modular_pipelines)
        graph_node = self.nodes.add_node(graph_node)
        graph_node.add_pipeline(pipeline_key)
        return graph_node

    @staticmethod
    def add_parameters_to_task_node(
        parameters_node: ParametersNode, task_node: TaskNode
    ):
        if parameters_node.is_all_parameters():
            task_node.parameters = parameters_node.parameter_value
        else:
            task_node.parameters[
                parameters_node.parameter_name
            ] = parameters_node.parameter_value

    def get_default_selected_pipeline(self) -> RegisteredPipeline:
        default_pipeline = RegisteredPipeline(id="__default__")
        return (
            default_pipeline
            if self.registered_pipelines.has_pipeline(default_pipeline.id)
            else self.registered_pipelines.as_list()[0]
        )

    def _remove_non_modular_pipelines(self):
        for node in self.nodes.nodes_list:
            if isinstance(node, ParametersNode):
                pipes = [
                    pipe
                    for pipe in node.modular_pipelines
                    if self.modular_pipelines.has_modular_pipeline(pipe)
                ]
                node.modular_pipelines = sorted(pipes)

    def set_layers(self, layers: List[str]):
        self.layers.set_layers(layers)
