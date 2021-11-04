"""`kedro_viz.data_access.repositories` defines repositories to save and load application data."""
# pylint: disable=missing-class-docstring,missing-function-docstring,protected-access
from collections import OrderedDict, defaultdict
from typing import Dict, Generator, Iterable, List, Optional, Set, Union

import kedro
from kedro.io import AbstractDataSet, DataCatalog, DataSetNotFoundError
from semver import VersionInfo

from kedro_viz.constants import ROOT_MODULAR_PIPELINE_ID
from kedro_viz.models.graph import (
    DataNode,
    GraphEdge,
    GraphNode,
    GraphNodeType,
    ModularPipelineChild,
    ModularPipelineNode,
    ParametersNode,
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
        """Return whether a dataset is a parameter"""
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
    """Repository for the set of modular pipelines in a registered pipeline.
    Internally, the repository models the set of modular pipelines as a tree using child-references.
    For more detail about this representation, see:
    https://docs.mongodb.com/manual/tutorial/model-tree-structures-with-child-references/


    The reason is because under the hood, Kedro uses a materialized path approach
    to namespace representation, which forms a tree. See:
    https://docs.mongodb.com/manual/tutorial/model-tree-structures-with-materialized-paths/
    For examples:
    - A node could have a materialized path as a namespace property,
    i.e. namespace="uk.data_science"
    - A dataset could have a materialized path baked into its name,
    i.e. "uk.data_science.model"
    This allows for compaction in data representation during execution,
    i.e. no need to keep an ephemeral nested structure when the execution tree is flattened out.
    It also provides a clean algebraic query syntax,
    i.e. `pipeline.only_nodes_with_namespace("data_science")`.
    Both are well-known properties of the materialized path representation of a tree.

    However, when the tree needs to be displayed visually, it's much more convenient to work with
    the child-references representation. Specifically:
    - Each tree node has an ID, a name derived from the ID and a set of children.
    - Each child of a node could be a data node, a task node, a parameters node or
    another modular pipeline node.
    - There is a designated root node with a __root__ ID.

    With this representation, a folder-like render of the tree is simply a recursive in-order
    tree traversal. To improve the performance on the client, we perform the conversion between
    these two representations on the backend by extracting the modular pipeline from a Kedro project
    and adding it to this repository.
    """

    def __init__(self):
        # The tree representation of the tree.
        # Example:
        # {
        #   "__root__": ModularPipelineNode(
        #       id="__root__",
        #       children=["data_science", "data_engineering"]
        #   ),
        #   "data_science": ModularPipelineNode(id="data_science", children=[]),
        #   "data_engineering": ModularPipelineNode(id="data_science", children=[]),
        # }
        self.tree: Dict[str, ModularPipelineNode] = {
            ROOT_MODULAR_PIPELINE_ID: GraphNode.create_modular_pipeline_node(
                ROOT_MODULAR_PIPELINE_ID
            )
        }

    def get_or_create_modular_pipeline(
        self, modular_pipeline_id: str
    ) -> ModularPipelineNode:
        """Get the modular pipeline node with the given ID from the repository.
        If it doesn't exist, create the node, add to the repository and return the instance.

        Args:
            modular_pipeline_id: The ID of the modular pipeline to retrieve from the repository.
        Returns:
            A ModularPipelineNode instance with the given ID.
        Example:
            >>> modular_pipeline_repository = ModularPipelinesRepository()
            >>> modular_pipeline_node = modular_pipeline_repository.get_or_create_modular_pipeline(
            ...     "data_science"
            ... )
            >>> assert modular_pipeline_node.id == "data_science"
        """
        if not self.has_modular_pipeline(modular_pipeline_id):
            modular_pipeline_node = GraphNode.create_modular_pipeline_node(
                modular_pipeline_id
            )
            self.tree[modular_pipeline_id] = modular_pipeline_node
        return self.tree[modular_pipeline_id]

    def add_input(
        self, modular_pipeline_id: str, input_node: Union[DataNode, ParametersNode]
    ) -> None:
        """Add an input to a modular pipeline based on whether it's an internal or external input.
        The input to a modular pipeline can only be a data node or parameter node.
        The input also has knowledge of which modular pipelines it belongs to
        based on its namespace. This information can be accessed with through
        `input_node.modular_pipelines`.

        Args:
            modular_pipeline_id: ID of the modular pipeline to add the input to.
            input_node: The input node to add.
        Raises:
            ValueError: when attempt to add a non-data,non-parameter node as input
                to the modular pipeline.
        Example:
            >>> modular_pipelines = ModularPipelinesRepository()
            >>> data_science_pipeline = modular_pipelines.get_or_create_modular_pipeline(
            ...     "data_science"
            ... )
            >>> model_input_node = GraphNode.create_data_node(
            ...     "data_science.model_input", layer=None, tags=set(), dataset=None
            ... )
            >>> modular_pipelines.add_input("data_science", model_input_node)
            >>> assert data_science_pipeline.inputs == {model_input_node.id}
        """
        if not isinstance(input_node, (DataNode, ParametersNode)):
            raise ValueError(
                f"Attempt to add a non-data node as input to modular pipeline {modular_pipeline_id}"
            )

        is_internal_input = modular_pipeline_id in input_node.modular_pipelines
        if is_internal_input:
            self.tree[modular_pipeline_id].internal_inputs.add(input_node.id)
        else:
            self.tree[modular_pipeline_id].external_inputs.add(input_node.id)

    def add_output(self, modular_pipeline_id: str, output_node: GraphNode):
        """Add an output to a modular pipeline based on whether it's an internal or external output.
        The output has knowledge of which modular pipelines it belongs to based on its namespace.
        The information can be accessed with through `output_node.modular_pipelines`.

        Args:
            modular_pipeline_id: ID of the modular pipeline to add the output to.
            output_node: The output node to add.
        Raises:
            ValueError: when attempt to add a non-data, non-parameter node as output
                to the modular pipeline.
        Example:
            >>> modular_pipelines = ModularPipelinesRepository()
            >>> data_science_pipeline = modular_pipelines.get_or_create_modular_pipeline(
            ...     "data_science"
            ... )
            >>> model_output_node = GraphNode.create_data_node(
            ...     "data_science.model_output", layer=None, tags=set(), dataset=None
            ... )
            >>> modular_pipelines.add_output("data_science", model_output_node)
            >>> assert data_science_pipeline.outputs == {model_output_node.id}
        """
        if not isinstance(output_node, (DataNode, ParametersNode)):
            raise ValueError(
                f"Attempt to add a non-data node as input to modular pipeline {modular_pipeline_id}"
            )

        is_internal_output = modular_pipeline_id in output_node.modular_pipelines
        if is_internal_output:
            self.tree[modular_pipeline_id].internal_outputs.add(output_node.id)
        else:
            self.tree[modular_pipeline_id].external_outputs.add(output_node.id)

    def add_child(self, modular_pipeline_id: str, child: ModularPipelineChild):
        """Add a child to a modular pipeline.
        Args:
            modular_pipeline_id: ID of the modular pipeline to add the child to.
            child: The child to add to the modular pipeline.
        Example:
            >>> modular_pipelines = ModularPipelinesRepository()
            >>> modular_pipeline_child = ModularPipelineChild(
            ...     id="dataset",
            ...     type=GraphNodeType.DATA
            ... )
            >>> modular_pipelines.add_child("data_science", modular_pipeline_child)
            >>> data_science_pipeline = modular_pipelines.get_or_create_modular_pipeline(
            ...     "data_science"
            ... )
            >>> assert data_science_pipeline.children == {modular_pipeline_child}
        """
        modular_pipeline = self.get_or_create_modular_pipeline(modular_pipeline_id)
        modular_pipeline.children.add(child)

    def extract_from_node(self, node: GraphNode) -> Optional[str]:
        """Extract the namespace from a graph node and add it as a modular pipeline node
        to the modular pipeline repository.

        Args:
            node: The GraphNode from which to extract modular pipeline.
        Returns:
            ID of the modular pipeline node added to the modular pipeline repository if found.
        Example:
            >>> modular_pipelines = ModularPipelinesRepository()
            >>> model_output_node = GraphNode.create_data_node(
            ...     "data_science.model_output", layer=None, tags=set(), dataset=None
            ... )
            >>> modular_pipelines.extract_from_node(model_output_node)
            'data_science'
            >>> assert modular_pipelines.has_modular_pipeline("data_science")
        """

        # There is no need to extract modular pipeline from parameters
        # because all valid modular pipelines are encoded in either a TaskNode or DataNode.
        if isinstance(node, ParametersNode):
            return None

        modular_pipeline_id = node.namespace
        if not modular_pipeline_id:
            return None

        modular_pipeline = self.get_or_create_modular_pipeline(modular_pipeline_id)

        # Add the node's registered pipelines to the modular pipeline's registered pipelines.
        # Basically this means if the node belongs to the "__default__" pipeline, for example,
        # so does the modular pipeline.
        modular_pipeline.pipelines.update(node.pipelines)

        # Since we extract the modular pipeline from the node's namespace,
        # the node is by definition a child of the modular pipeline.
        self.add_child(
            modular_pipeline_id,
            ModularPipelineChild(id=node.id, type=GraphNodeType(node.type)),
        )
        return modular_pipeline_id

    def has_modular_pipeline(self, modular_pipeline_id: str) -> bool:
        """Return whether this modular pipeline repository has a given modular pipeline ID.
        Args:
            modular_pipeline_id: ID of the modular pipeline to check existence in the repository.
        Returns:
            Whether the given modular pipeline ID is in the repository.
        Example:
            >>> modular_pipelines = ModularPipelinesRepository()
            >>> modular_pipelines.has_modular_pipeline("__root__")
            True
            >>> modular_pipelines.has_modular_pipeline("doesnt exist")
            False
        """
        return modular_pipeline_id in self.tree

    def as_dict(self) -> Dict[str, ModularPipelineNode]:
        """Return the repository as a dictionary."""
        return self.tree


class TagsRepository:
    def __init__(self):
        self.tags_set: Set[Tag] = set()

    def add_tags(self, tags: Iterable[str]):
        self.tags_set.update([Tag(id=tag_id) for tag_id in tags])

    def as_list(self) -> List[Tag]:
        return list(sorted(self.tags_set, key=lambda t: t.id))
