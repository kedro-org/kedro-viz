"""`kedro_viz.data_access.repositories.modular_pipelines` defines
repository to centralise access for modular pipelines data."""

import hashlib
from typing import Dict, List, Set, Tuple, Union

from kedro.pipeline import Pipeline as KedroPipeline
from kedro.pipeline.node import Node

from kedro_viz.constants import ROOT_MODULAR_PIPELINE_ID
from kedro_viz.models.flowchart import (
    GraphNode,
    GraphNodeType,
    ModularPipelineChild,
    ModularPipelineNode,
)
from kedro_viz.utils import TRANSCODING_SEPARATOR, _strip_transcoding, is_dataset_param


def _hash(value: str):
    return hashlib.sha1(value.encode("UTF-8")).hexdigest()[:8]


def _hash_input_output(item: str) -> str:
    """Hash the input/output dataset."""
    return (
        _hash(_strip_transcoding(item))
        if TRANSCODING_SEPARATOR in item
        else _hash(item)
    )


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
        self.node_mod_pipeline_map: Dict[
            str, Set[str]
        ] = {}  # Updated to map node_id to a set of modular_pipeline_ids

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

    def _add_children(self, modular_pipeline_id: str, kedro_nodes: List[Node]):
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
            kedro_nodes (List[Node]): The kedro nodes (and it's related datasets/parameters)
                    to add as children.
        """
        modular_pipeline = self.get_or_create_modular_pipeline(modular_pipeline_id)
        modular_pipeline_inputs_outputs = set(modular_pipeline.inputs) | set(
            modular_pipeline.outputs
        )

        for kedro_node in kedro_nodes:
            # add kedro node as a child to the modular pipeline
            if kedro_node.namespace == modular_pipeline_id:
                kedro_node_id = _hash(str(kedro_node))
                modular_pipeline.children.add(
                    ModularPipelineChild(id=kedro_node_id, type=GraphNodeType.TASK)
                )

                modular_pipeline.tags.update(kedro_node.tags)

                # add input/output datasets of a kedro node as a child
                # to the modular pipeline
                self._add_datasets_as_children(
                    modular_pipeline, kedro_node, modular_pipeline_inputs_outputs
                )

                # update node_modular_pipeline lookup
                if kedro_node_id not in self.node_mod_pipeline_map:
                    self.node_mod_pipeline_map[kedro_node_id] = set()
                self.node_mod_pipeline_map[kedro_node_id].add(modular_pipeline_id)

        # The line `parent_modular_pipeline_id = ('.'.join(modular_pipeline_id.split('.')[:-1])
        # if '.' in modular_pipeline_id else None)` is extracting the parent modular pipeline ID
        # from the given modular pipeline ID.
        parent_modular_pipeline_id = (
            ".".join(modular_pipeline_id.split(".")[:-1])
            if "." in modular_pipeline_id
            else None
        )

        if parent_modular_pipeline_id:
            parent_modular_pipeline = self.get_or_create_modular_pipeline(
                parent_modular_pipeline_id
            )
            parent_modular_pipeline.pipelines.update(modular_pipeline.pipelines)
            parent_modular_pipeline.tags.update(modular_pipeline.tags)

            # add current modular pipeline and input/output datasets
            # of a modular pipeline as a child to the parent modular
            # pipeline based on the rules
            self._add_children_to_parent_pipeline(
                parent_modular_pipeline,
                modular_pipeline_id,
                modular_pipeline_inputs_outputs,
            )
        else:
            # add current modular pipeline and input/output datasets
            # of a top-level modular pipeline as a child to ROOT modular
            # pipeline
            self._add_children_to_parent_pipeline(
                self.tree[ROOT_MODULAR_PIPELINE_ID],
                modular_pipeline_id,
                modular_pipeline_inputs_outputs,
            )

    def _add_children_to_parent_pipeline(
        self,
        parent_node: ModularPipelineNode,
        modular_pipeline_id: str,
        modular_pipeline_inputs_outputs: Set[str],
    ):
        """
        Helper to add modular_pipeline children correctly to
        parent modular pipelines in case of nesting.

        Here we follow the below rules:
        - A modular pipeline is a child of it's parent modular pipeline
        - Any input/output of a modular pipeline is a child of the parent pipeline
          unless it is an input/output of that parent pipeline or a parameter dataset
        - Any input/output of a top-level modular pipeline is added as a child
          to the root modular pipeline

        Args:
            parent_node (ModularPipelineNode): The parent modular pipeline node.
            modular_pipeline_id (str): The ID of the modular pipeline to add as a child.
            modular_pipeline_inputs_outputs (Set[str]): A set of inputs/outputs
                    to/from the modular pipeline
        """

        parent_node.children.add(
            ModularPipelineChild(
                id=modular_pipeline_id, type=GraphNodeType.MODULAR_PIPELINE
            )
        )
        for dataset in modular_pipeline_inputs_outputs:
            if (
                dataset not in parent_node.inputs
                and dataset not in parent_node.outputs
                and dataset not in self.parameters
            ):
                parent_node.children.add(
                    ModularPipelineChild(id=dataset, type=GraphNodeType.DATA)
                )
            if dataset not in self.node_mod_pipeline_map:
                self.node_mod_pipeline_map[dataset] = set()
            self.node_mod_pipeline_map[dataset].add(modular_pipeline_id)

    def _add_datasets_as_children(
        self,
        modular_pipeline: ModularPipelineNode,
        kedro_node: Node,
        modular_pipeline_inputs_outputs: Set[str],
    ):
        """Helper to add datasets (not parameters) related to task nodes as children.

        Here we follow the below rule:
        - Inputs/Outputs of a task node are added as children
          to the modular pipeline if they are not inputs/outputs
          of that modular pipeline and are not parameter datasets
        """
        hashed_io_ids = {
            _hash_input_output(io)
            for io in set(kedro_node.inputs) | set(kedro_node.outputs)
        }
        for io_id in hashed_io_ids:
            if (
                io_id not in modular_pipeline_inputs_outputs
                and io_id not in self.parameters
            ):
                modular_pipeline.children.add(
                    ModularPipelineChild(id=io_id, type=GraphNodeType.DATA)
                )
                if io_id not in self.node_mod_pipeline_map:
                    self.node_mod_pipeline_map[io_id] = set()
                self.node_mod_pipeline_map[io_id].add(modular_pipeline.id)

    def get_node_and_modular_pipeline_mapping(
        self, node
    ) -> Tuple[str, Union[Set[str], None]]:
        """Get the modular pipeline(s) to which the given node belongs."""
        node_id = (
            _hash_input_output(node) if isinstance(node, str) else _hash(str(node))
        )
        return node_id, self.node_mod_pipeline_map.get(node_id)

    def as_dict(self) -> Dict[str, ModularPipelineNode]:
        """Return the repository as a dictionary."""
        return self.tree
