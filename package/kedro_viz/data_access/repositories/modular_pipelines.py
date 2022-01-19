"""`kedro_viz.data_access.repositories.modular_pipelines`
defines repository to centralise access to modular pipelines data."""
from typing import Dict, Optional, Union

from kedro_viz.constants import ROOT_MODULAR_PIPELINE_ID
from kedro_viz.models.graph import (
    DataNode,
    GraphNode,
    GraphNodeType,
    ModularPipelineChild,
    ModularPipelineNode,
    ParametersNode,
    TranscodedDataNode,
)


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
        if not isinstance(input_node, (DataNode, TranscodedDataNode, ParametersNode)):
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
        if not isinstance(output_node, (DataNode, TranscodedDataNode, ParametersNode)):
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
