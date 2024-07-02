"""`kedro_viz.data_access.repositories.modular_pipelines` defines
repository to centralise access for modular pipelines data."""


from collections import defaultdict
from typing import Dict, List, Set, Tuple, Union

from kedro.pipeline import Pipeline as KedroPipeline
from kedro.pipeline.node import Node as KedroNode

from kedro_viz.constants import ROOT_MODULAR_PIPELINE_ID
from kedro_viz.models.flowchart import (
    GraphNode,
    GraphNodeType,
    ModularPipelineChild,
    ModularPipelineNode,
)
from kedro_viz.utils import _hash, _hash_input_output, is_dataset_param


class ModularPipelinesRepository:
    """Repository for the set of modular pipelines in a registered pipeline."""

    def __init__(self):
        """
        Initialize the ModularPipelinesRepository with a
        tree dict containing a root modular pipeline node,
        an empty node_mod_pipeline_map for faster lookup and
        an empty parameters set.
        """
        self.tree: Dict[str, ModularPipelineNode] = {
            ROOT_MODULAR_PIPELINE_ID: GraphNode.create_modular_pipeline_node(
                ROOT_MODULAR_PIPELINE_ID
            )
        }
        self.node_mod_pipeline_map = defaultdict(set)
        self.parameters = set()

    def populate_tree(self, pipeline: KedroPipeline) -> None:
        """
        Add inputs, outputs, and children to each modular
        pipeline node in the ModularPipelinesRepository
        based on the given Kedro pipeline.

        Args:
            pipeline (KedroPipeline): The Kedro pipeline to populate the tree from.
        """
        namespaces = sorted(
            {node.namespace for node in pipeline.nodes if node.namespace}
        )

        modular_pipeline_ids = {
            modular_pipeline_id
            for ns in namespaces
            for modular_pipeline_id in self._explode_namespace(ns)
        }

        for modular_pipeline_id in sorted(modular_pipeline_ids):
            self.get_or_create_modular_pipeline(modular_pipeline_id)

            sub_pipeline = pipeline.only_nodes_with_namespace(modular_pipeline_id)
            rest_of_the_pipeline = pipeline - sub_pipeline

            free_inputs = sub_pipeline.inputs()
            free_outputs = sub_pipeline.outputs() | (
                rest_of_the_pipeline.inputs() & sub_pipeline.all_outputs()
            )

            self._add_inputs(modular_pipeline_id, free_inputs)
            self._add_outputs(modular_pipeline_id, free_outputs)
            self._add_children(modular_pipeline_id, sub_pipeline.nodes)

    @staticmethod
    def _explode_namespace(nested_namespace: str) -> List[str]:
        """
        Expand the nested namespace into its constituent parts.

        Args:
            nested_namespace (str): The nested namespace to expand.

        Returns:
            List[str]: A list of expanded namespaces where each namespace
                    is used as modular pipeline id while creating a ModularPipelineNode.
        Example:
            >>> nested_namespace = "uk.data_processing.internal"
            >>> modular_pipeline_repo_obj = ModularPipelinesRepository()
            >>> expanded_namespace =
                    modular_pipeline_repo_obj._explode_namespace(nested_namespace)
            >>> expanded_namespace
            ["uk", "uk.data_processing", "uk.data_processing.internal"]
        """
        if not nested_namespace:
            return []
        ns_parts = nested_namespace.split(".")
        return [".".join(ns_parts[: i + 1]) for i in range(len(ns_parts))]

    def get_or_create_modular_pipeline(
        self, modular_pipeline_id: str
    ) -> ModularPipelineNode:
        """
        Get the modular pipeline node with the given ID from the repository.
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

        if modular_pipeline_id not in self.tree:
            modular_pipeline_node = GraphNode.create_modular_pipeline_node(
                modular_pipeline_id
            )
            self.tree[modular_pipeline_id] = modular_pipeline_node
        return self.tree[modular_pipeline_id]

    def _add_inputs(self, modular_pipeline_id: str, inputs: Set[str]) -> None:
        """
        Add input datasets to the modular pipeline.

        Args:
            modular_pipeline_id (str): The ID of the modular pipeline to add inputs to.
            inputs (Set[str]): The input datasets to add.
        """
        hashed_inputs = set()

        for _input in inputs:
            hashed_input = _hash_input_output(_input)
            hashed_inputs.add(hashed_input)
            if is_dataset_param(_input):
                self.parameters.add(hashed_input)

        self.tree[modular_pipeline_id].inputs = hashed_inputs

    def _add_outputs(self, modular_pipeline_id: str, outputs: Set[str]) -> None:
        """
        Add output datasets from the modular pipeline.

        Args:
            modular_pipeline_id (str): The ID of the modular pipeline to add outputs to.
            outputs (Set[str]): The output datasets to add.
        """
        hashed_outputs = {_hash_input_output(output) for output in outputs}
        self.tree[modular_pipeline_id].outputs = hashed_outputs

    def _add_children(self, modular_pipeline_id: str, kedro_nodes: List[KedroNode]):
        """
        Add children to a modular pipeline. Here we follow the below rules
        - A kedro node is added as a child to a modular pipeline if
          it has the namespace of that modular pipeline
        - Inputs/Outputs of a kedro node are added as children
          to the modular pipeline if they are not inputs/outputs
          of that modular pipeline and are not parameter datasets
        - Any input/output of a modular pipeline is a child
          of the parent pipeline unless it is an input/output
          of that parent pipeline
        - Any input/output of a top-level modular pipeline is added
          as a child to the root modular pipeline

        Args:
            modular_pipeline_id (str): The ID of the modular pipeline to add children to.
            kedro_nodes (List[KedroNode]): The kedro nodes (and it's related datasets/parameters)
                    to add as children.
        """
        modular_pipeline = self.get_or_create_modular_pipeline(modular_pipeline_id)
        modular_pipeline_inputs_outputs = set(modular_pipeline.inputs).union(
            modular_pipeline.outputs
        )

        # Filter nodes that belong to the current modular pipeline
        filtered_kedro_nodes = [
            node for node in kedro_nodes if node.namespace == modular_pipeline_id
        ]

        # Add filtered kedro nodes and their related datasets as children to the modular pipeline
        self._add_nodes_and_datasets_as_children(
            modular_pipeline, filtered_kedro_nodes, modular_pipeline_inputs_outputs
        )
        self._add_children_to_parent_pipeline(
            modular_pipeline, modular_pipeline_id, modular_pipeline_inputs_outputs
        )

    def _add_nodes_and_datasets_as_children(
        self,
        modular_pipeline: ModularPipelineNode,
        kedro_nodes: List[KedroNode],
        modular_pipeline_inputs_outputs: Set[str],
    ):
        """
        Add Kedro nodes and their related datasets as children to the modular pipeline.

        Datasets (inputs/outputs) are added if they are not already inputs/outputs of
        the modular pipeline and are not parameter datasets.
        """

        for node in kedro_nodes:
            node_id = _hash(str(node))
            modular_pipeline.children.add(
                ModularPipelineChild(id=node_id, type=GraphNodeType.TASK)
            )
            modular_pipeline.tags.update(node.tags)

            hashed_io_ids = {
                _hash_input_output(io) for io in set(node.inputs).union(node.outputs)
            }

            # Compute valid input/output IDs that are not part of the modular pipeline
            # inputs/outputs or parameters
            valid_io_ids = hashed_io_ids.difference(
                modular_pipeline_inputs_outputs, self.parameters
            )

            # Add each valid input/output as a child to the modular pipeline
            for io_id in valid_io_ids:
                modular_pipeline.children.add(
                    ModularPipelineChild(id=io_id, type=GraphNodeType.DATA)
                )
                self.node_mod_pipeline_map[io_id].add(modular_pipeline.id)

            self.node_mod_pipeline_map[node_id].add(modular_pipeline.id)

    def _add_children_to_parent_pipeline(
        self,
        modular_pipeline: ModularPipelineNode,
        modular_pipeline_id: str,
        modular_pipeline_inputs_outputs: Set[str],
    ):
        """
        Helper to add modular_pipeline children correctly to parent modular pipelines
        in case of nesting.

        Here we follow the below rules:
        - A modular pipeline is a child of its parent modular pipeline
        - Any input/output of a modular pipeline is a child of the parent pipeline
        unless it is an input/output of that parent pipeline or a parameter dataset
        - Any input/output of a top-level modular pipeline is added as a child to
        the root modular pipeline

        Args:
            modular_pipeline (ModularPipelineNode): The modular pipeline node.
            modular_pipeline_id (str): The ID of the modular pipeline to add as a child.
            modular_pipeline_inputs_outputs (Set[str]): A set of inputs/outputs to/from
            the modular pipeline.
        """
        # Determine the parent modular pipeline ID
        parent_modular_pipeline_id = (
            ".".join(modular_pipeline_id.split(".")[:-1])
            if "." in modular_pipeline_id
            else ROOT_MODULAR_PIPELINE_ID
        )

        # Get or create the parent modular pipeline
        parent_modular_pipeline = self.get_or_create_modular_pipeline(
            parent_modular_pipeline_id
        )

        # Add the modular pipeline as a child to the parent modular pipeline
        parent_modular_pipeline.children.add(
            ModularPipelineChild(
                id=modular_pipeline_id, type=GraphNodeType.MODULAR_PIPELINE
            )
        )
        parent_modular_pipeline.pipelines.update(modular_pipeline.pipelines)
        parent_modular_pipeline.tags.update(modular_pipeline.tags)

        # Add input/output datasets as children to the parent modular pipeline
        for dataset in modular_pipeline_inputs_outputs:
            if (
                dataset not in parent_modular_pipeline.inputs
                and dataset not in parent_modular_pipeline.outputs
                and dataset not in self.parameters
            ):
                parent_modular_pipeline.children.add(
                    ModularPipelineChild(id=dataset, type=GraphNodeType.DATA)
                )
            self.node_mod_pipeline_map[dataset].add(modular_pipeline_id)

    def get_node_and_modular_pipeline_mapping(
        self, node
    ) -> Tuple[str, Union[Set[str], None]]:
        """Get the modular pipeline(s) to which the given task node/or dataset belongs."""
        node_id = (
            _hash(str(node))
            if isinstance(node, KedroNode)
            else _hash_input_output(node)
        )
        return node_id, self.node_mod_pipeline_map.get(node_id)

    def as_dict(self) -> Dict[str, ModularPipelineNode]:
        """Return the repository as a dictionary."""
        return self.tree
