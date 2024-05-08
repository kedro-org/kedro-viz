"""`kedro_viz.data_access.repositories.modular_pipelines`
defines repository to centralise access to modular pipelines data."""

# pylint: disable=protected-access

from typing import Dict, Optional, Set, List

from kedro_viz.constants import ROOT_MODULAR_PIPELINE_ID
from kedro.pipeline import Pipeline as KedroPipeline
from kedro_viz.models.flowchart import (
    GraphNode,
    GraphNodeType,
    ModularPipelineChild,
    ModularPipelineNode,
    ParametersNode,
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
        #   "data_engineering": ModularPipelineNode(id="data_engineering", children=[]),
        # }
        self.tree: Dict[str, ModularPipelineNode] = {
            ROOT_MODULAR_PIPELINE_ID: GraphNode.create_modular_pipeline_node(
                ROOT_MODULAR_PIPELINE_ID
            )
        }
        
    def set_tree(self, pipeline: KedroPipeline):
        """The purpose of this method is to resolve the inputs and outputs for a modular pipeline
        Args:
            pipeline: An instance of Kedro pipeline
            modular_pipelines_repo_obj: An instance of ModularPipelinesRepository
                created using the pipeline's id
        """
        namespaces = sorted(set(node.namespace for node in pipeline.nodes if node.namespace))


        def explode(nested_namespace: str) -> list[str]:
            """The purpose of this method is to expand the nested namespace if any
            Args:
                nested_namespace: The nested namespace to be expanded
            Example:
            >>> nested_namespace = 'train_evaluation.random_forest'
            >>> explode(nested_namespace)
            ['train_evaluation', 'train_evaluation.random_forest']
            """
            if not nested_namespace or "." not in nested_namespace:
                exploded_ns = [nested_namespace] if nested_namespace else []
            else:
                ns_parts = nested_namespace.split(".")
                exploded_ns = [
                    ".".join(ns_parts[: i + 1]) for i in range(len(ns_parts))
                ]
            return exploded_ns

        modular_pipeline_ids = set()
        
        for namespace in namespaces:
            modular_pipeline_ids |= set(explode(namespace))

        for modular_pipeline_id in sorted(modular_pipeline_ids):
            self.get_or_create_modular_pipeline(modular_pipeline_id)

            # get the sub_pipeline and the rest of the pipeline
            sub_pipeline = pipeline.only_nodes_with_namespace(modular_pipeline_id)
            rest_of_the_pipeline = pipeline - sub_pipeline

            # get free inputs and free outputs of the sub_pipeline
            free_inputs_to_sub_pipeline = sub_pipeline.inputs()
            free_outputs_from_sub_pipeline = sub_pipeline.outputs()

            # get all sub_pipeline outputs that are used by external nodes
            other_outputs_from_sub_pipeline = (rest_of_the_pipeline.inputs() & sub_pipeline.all_outputs())

            # add the other_outputs_from_sub_pipeline to the free outputs
            free_outputs_from_sub_pipeline |= other_outputs_from_sub_pipeline

            # add inputs and outputs for the created modular pipeline
            self.add_inputs(modular_pipeline_id, free_inputs_to_sub_pipeline)
            self.add_outputs(modular_pipeline_id, free_outputs_from_sub_pipeline)
            
            internal_inputs = sub_pipeline.all_inputs() - free_inputs_to_sub_pipeline
            internal_outputs = sub_pipeline.all_outputs() - free_outputs_from_sub_pipeline
            
            self.add_child_datasets(modular_pipeline_id, internal_inputs, internal_outputs)
            
            task_nodes = sub_pipeline.nodes
            # self.add_child_tasks(modular_pipeline_id, task_nodes)
        
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

    def add_inputs(
        self,
        modular_pipeline_id: str,
        inputs: Set[str],
    ) -> None:
        """Add input datasets to the modular pipeline.
        Args:
            modular_pipeline_id: ID of the modular pipeline to add inputs
            inputs: A set of input dataset ids
        """
        self.tree[modular_pipeline_id].inputs = {
            GraphNode._hash(input) for input in inputs
        }

    def add_outputs(
        self,
        modular_pipeline_id: str,
        outputs: Set[str],
    ) -> None:
        """Add output datasets from the modular pipeline.
        Args:
            modular_pipeline_id: ID of the modular pipeline to add outputs
            outputs: A set of output dataset ids
        """
        self.tree[modular_pipeline_id].outputs = {
            GraphNode._hash(output) for output in outputs
        }
        
    def add_child_datasets(self, modular_pipeline_id: str, inputs: Set[str], outputs: Set[str]):
        print(modular_pipeline_id)
        parent_modular_pipeline_id, _ = modular_pipeline_id.partition('.')
        if parent_modular_pipeline_id:
            parent_modular_pipeline = self.get_or_create_modular_pipeline(parent_modular_pipeline_id)
        modular_pipeline = self.get_or_create_modular_pipeline(modular_pipeline_id)
        for input in inputs:
            input_id = GraphNode._hash(input)
            print("input_id", input_id)
            if parent_modular_pipeline_id and input_id in parent_modular_pipeline.children:
                print("parent_modular_pipeline_id", parent_modular_pipeline_id)
                print("parent_modular_pipeline.children", parent_modular_pipeline.children)
                parent_modular_pipeline.inputs.remove(input_id)
            modular_pipeline.children.add(ModularPipelineChild(id= input_id , type=GraphNodeType.DATA))
        for output in outputs:
            output_id = GraphNode._hash(output)
            if parent_modular_pipeline_id and output_id in parent_modular_pipeline.children:
                parent_modular_pipeline.inputs.remove(output_id)
            modular_pipeline.children.add(ModularPipelineChild(id= output_id, type=GraphNodeType.DATA))
            
        

    def add_child_task(self, modular_pipeline_id: str, child: ModularPipelineChild):
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


    def extract_from_node(self, node) -> Optional[str]:
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

        # Add the node's registered pipelines to the modular pipeline's registered pipelines.
        # Basically this means if the node belongs to the "__default__" pipeline, for example,
        # so does the modular pipeline.
        # modular_pipeline.pipelines.update(node.pipelines)

        # Since we extract the modular pipeline from the node's namespace,
        # the node is by definition a child of the modular pipeline.
        self.add_child_task(
            modular_pipeline_id,
            ModularPipelineChild(id=GraphNode._hash(str(node)), type=GraphNodeType.TASK),
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
    
    def get_modular_pipeline_from_node(self, node) -> Optional[str]:
        """Get the name of the modular pipeline to which the given node_id belongs.

        Args:
            node: The node to check for its parent modular pipeline.

        Returns:
            The name of the modular pipeline if the node belongs to any modular pipeline,
            otherwise returns None.
        """
        node_id = GraphNode._hash(str(node))
        
  
        mod_id = None
        for modular_pipeline_id, modular_pipeline_node in self.tree.items():
            if any(child.id == node_id for child in modular_pipeline_node.children):
                mod_id= modular_pipeline_id
        if mod_id:
            return [mod_id]
        else:
            return []

    
    # def resolve_children(self):
    # # Iterate over each pipeline in the tree
    #     print(self.tree)
    #     for pipeline_name, pipeline_node in self.tree.items():
    #         # Check if the pipeline has a parent
    #         if '.' in pipeline_name:
    #             # Extract parent pipeline name and child pipeline name
    #             parent_name, child_name = pipeline_name.split('.')

    #             # Get the children of parent pipeline and child pipeline
    #             parent_children = self.tree[parent_name].children
    #             child_children = pipeline_node.children

    #             # Get the set of child IDs from the child pipeline
    #             child_ids = {child.id for child in child_children}

    #             # Remove duplicate children from the parent pipeline
    #             parent_children = {child for child in parent_children if child.id not in child_ids}

    #             # Update the children attribute of the parent pipeline
    #             self.tree[parent_name].children = parent_children
                
    #     print(self.tree)
                
    def as_dict(self) -> Dict[str, ModularPipelineNode]:
        """Return the repository as a dictionary."""
        return self.tree
