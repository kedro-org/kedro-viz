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
"""`kedro_viz.data_access.repositories` defines repositories to save and load application data."""
# pylint: disable=missing-class-docstring,missing-function-docstring,protected-access
from collections import OrderedDict, defaultdict
from typing import Dict, Iterable, List, Optional, Set

import kedro
from kedro.io import AbstractDataSet, DataCatalog, DataSetNotFoundError
from semver import VersionInfo

from kedro_viz.models.graph import (
    GraphEdge,
    GraphNode,
    GraphNodeType,
    ParametersNode,
    ModularPipeline,
    ModularPipelineChild,
    RegisteredPipeline,
    Tag,
)

_KEDRO_VERSION = VersionInfo.parse(kedro.__version__)


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

    def get_nodes_by_ids(self, node_ids: Set[str]) -> List[GraphNode]:
        return [n for n in self.nodes_list if n.id in node_ids]


class GraphEdgesRepository:
    def __init__(self):
        self.edges_list: Set[GraphEdge] = set()

    def remove_edge(self, edge: GraphEdge):
        self.edges_list.remove(edge)

    def add_edge(self, edge: GraphEdge):
        self.edges_list.add(edge)

    def as_list(self) -> List[GraphEdge]:
        return list(self.edges_list)

    def get_edges_by_node_ids(self, node_ids: Set[str]) -> List[GraphEdge]:
        return [e for e in self.edges_list if {e.source, e.target}.issubset(node_ids)]


class CatalogRepository:
    _catalog: DataCatalog

    def __init__(self):
        self._layers_mapping = None

    def get_catalog(self) -> DataCatalog:
        return self._catalog

    def set_catalog(self, value: DataCatalog):
        self._catalog = value

    @staticmethod
    def strip_encoding(dataset_name: str) -> str:
        return dataset_name.split("@")[0]

    @property
    def layers_mapping(self):
        """Return layer mapping: dataset_full_name -> layer it belongs to in the catalog"""
        if self._layers_mapping is not None:
            return self._layers_mapping

        if self._catalog.layers is None:
            self._layers_mapping = {
                self.strip_encoding(dataset_name): None
                for dataset_name in self._catalog._data_sets
            }
        else:
            self._layers_mapping = {}
            for layer, dataset_names in self._catalog.layers.items():
                self._layers_mapping.update(
                    {
                        self.strip_encoding(dataset_name): layer
                        for dataset_name in dataset_names
                    }
                )
        return self._layers_mapping

    def get_dataset(self, dataset_name: str) -> Optional[AbstractDataSet]:
        dataset_obj: Optional[AbstractDataSet]
        if _KEDRO_VERSION.match(">=0.16.0"):
            try:
                dataset_obj = self._catalog._get_dataset(dataset_name)
            except DataSetNotFoundError:  # pragma: no cover
                dataset_obj = None
        else:
            dataset_obj = self._catalog._data_sets.get(dataset_name)  # pragma: no cover
        return dataset_obj

    def get_layer_for_dataset(self, dataset_name: str) -> Optional[str]:
        return self.layers_mapping.get(dataset_name)

    @staticmethod
    def is_dataset_param(dataset_name: str) -> bool:
        """Returns whether a dataset is a parameter"""
        return dataset_name.lower().startswith("param")


class RegisteredPipelinesRepository:
    def __init__(self):
        self.pipelines_dict: Dict[str, RegisteredPipeline] = OrderedDict()
        self.pipelines_node_ids_mapping: Dict[str, Set[str]] = defaultdict(set)

    def add_pipeline(self, pipeline_id: str):
        self.pipelines_dict[pipeline_id] = RegisteredPipeline(id=pipeline_id)

    def add_node(self, pipeline_id: str, node_id: str):
        self.pipelines_node_ids_mapping[pipeline_id].add(node_id)

    def get_pipeline_by_id(self, pipeline_id: str) -> Optional[RegisteredPipeline]:
        return self.pipelines_dict.get(pipeline_id)

    def has_pipeline(self, pipeline_id: str) -> bool:
        return pipeline_id in self.pipelines_dict

    def as_list(self) -> List[RegisteredPipeline]:
        return list(self.pipelines_dict.values())

    def get_node_ids_by_pipeline_id(self, pipeline_id: str) -> Set[str]:
        return self.pipelines_node_ids_mapping[pipeline_id]


class ModularPipelinesRepository:

    ROOT_MODULAR_PIPELINE_ID = "__root__"

    def __init__(self):
        # Represent the set of modular pipelines as a tree.
        # Under the hood, Kedro uses a materialized path approach to tree representation. See:
        # https://docs.mongodb.com/manual/tutorial/model-tree-structures-with-materialized-paths/
        # For examples:
        # - A node could have a materialized path as a namespace property, i.e. namesapce="uk.data_science"
        # - A dataset could have a materialized path baked into its name, i.e. "uk.data_science.model"
        # This allows for compaction in data representation during execution,
        # i.e. no need to keep an ephemeral nested structure when the execution tree is flattened out,
        # as well as clean algebraic query syntax, i.e. `pipeline.only_nodes_with_namespace("data_science")`.
        # Both are well-known properties of the materialized path representation of a tree.
        #
        # However, when the tree needs to be displayed visually, it's much more convenient to work with
        # the child-references representation. See:
        # https://docs.mongodb.com/manual/tutorial/model-tree-structures-with-child-references/
        # Specifically:
        # - Each tree node has an ID, a name derived from the ID and a set of children.
        # - Each child of a node could be a data node, a task node, a parameters node or another modular pipeline node.
        # (See the `ModularPipeline` type definition for more details)
        # - There is a designated root node with a __root__ ID.
        #
        # With this representation, a folder-like render of the tree is simply a recursive in-order tree traversal.
        # To improve the performance on the client, we perform the conversion between
        # these two representations on the backend.
        self.modular_pipelines: Dict[str, ModularPipeline] = {
            self.ROOT_MODULAR_PIPELINE_ID: ModularPipeline(
                id=self.ROOT_MODULAR_PIPELINE_ID
            )
        }

    def mark_modular_pipeline_input(
        self, pipeline_id: str, input_node: GraphNode
    ) -> bool:
        self.modular_pipelines[pipeline_id].inputs.add(input_node.id)

    def mark_modular_pipeline_output(
        self, pipeline_id: str, output_node: GraphNode
    ) -> bool:
        self.modular_pipelines[pipeline_id].outputs.add(output_node.id)

    def add_modular_pipeline_from_node(self, node: GraphNode) -> str:
        """Add the graph node's modular pipeline to the modular pipeline tree.
        Return the added modular pipeline ID.
        """

        # There is no need to extract modular pipeline from parameters
        # because all valid modular pipelines are encoded in either a TaskNode or DataNode.
        if isinstance(node, ParametersNode):
            return

        modular_pipeline_id = node.namespace
        if not modular_pipeline_id:
            return None

        # Add the modular pipeline to the tree if it doesn't exist yet
        if modular_pipeline_id not in self.modular_pipelines:
            modular_pipeline = ModularPipeline(modular_pipeline_id)
            self.modular_pipelines[modular_pipeline_id] = modular_pipeline

        # Since we extract the modular pipeline from the node's namespace,
        # the node is by definition a child of the modular pipeline.
        self.modular_pipelines[modular_pipeline_id].children.add(
            ModularPipelineChild(id=node.id, type=GraphNodeType(node.type))
        )
        return modular_pipeline_id

    def has_modular_pipeline(self, modular_pipeline_id: str) -> bool:
        return modular_pipeline_id in self.modular_pipelines

    def as_dict(self):
        return self.modular_pipelines

    @classmethod
    def from_nodes(cls, nodes: List[GraphNode]) -> "ModularPipelinesRepository":
        repo = cls()
        for node in nodes:
            repo.add_modular_pipeline_from_node(node)
        return repo

    def expand_tree(self) -> Set[str]:
        """Expand the current compact tree into a full-blown representation with child-references
        by converting each parent in the node's materialized path into a dedicated node in the tree.
        Returns the set of all node IDs in the tree.

        Example:

            If the current modular_pipelines tree has the following shape
                { "one.two": {"id": "one.two", "children": ["one.two.three"] }}
            After the expansion, the tree will be:
                {
                    "one": {"id": "one", "children": ["one.two"]},
                    "one.two": {"id": "one.two", "children": ["one.two.three"]}
                    "one.two.three": {"id": "one.two.three", "children": []}
                }
        """
        all_node_ids = set()

        for modular_pipeline_id, modular_pipeline in list(
            self.modular_pipelines.items()
        ):
            if modular_pipeline_id == self.ROOT_MODULAR_PIPELINE_ID:
                continue

            # Split the materialized path ID of a modular pipeline into the list of parents.
            # Then iterate through this list to construct the tree of child references,
            # with the left-most child being a child of the __root__ node.
            # For example, if the modular pipeline ID is "one.two.three",
            # In each iteration, the tree node ID will be:
            # - one
            # - one.two
            # - one.two.three
            # `one` is a child of the `__root__` node, `one.two` is a child of `one`, and so on.
            chunks = modular_pipeline_id.split(".")
            num_chunks = len(chunks)
            self.modular_pipelines[self.ROOT_MODULAR_PIPELINE_ID].children.add(
                ModularPipelineChild(
                    id=chunks[0],
                    type=GraphNodeType.MODULAR_PIPELINE,
                )
            )
            all_node_ids.update([child.id for child in modular_pipeline.children])
            if num_chunks == 1:
                continue

            for i in range(1, num_chunks):
                parent_id = ".".join(chunks[:i])
                if parent_id not in self.modular_pipelines:
                    self.modular_pipelines[parent_id] = ModularPipeline(parent_id)
                    all_node_ids.add(parent_id)

                self.modular_pipelines[parent_id].children.add(
                    ModularPipelineChild(
                        id=f"{parent_id}.{chunks[i]}",
                        type=GraphNodeType.MODULAR_PIPELINE,
                    )
                )
                self.modular_pipelines[parent_id].inputs.update(modular_pipeline.inputs)
                self.modular_pipelines[parent_id].outputs.update(
                    modular_pipeline.outputs
                )

        return all_node_ids


class LayersRepository:
    def __init__(self):
        self.layers_list: List[str] = []

    def set_layers(self, layers: List[str]):
        self.layers_list = layers

    def as_list(self) -> List[str]:
        return self.layers_list


class TagsRepository:
    def __init__(self):
        self.tags_set: Set[Tag] = set()

    def add_tags(self, tags: Iterable[str]):
        self.tags_set.update([Tag(id=tag_id) for tag_id in tags])

    def as_list(self) -> List[Tag]:
        return list(sorted(self.tags_set, key=lambda t: t.id))
