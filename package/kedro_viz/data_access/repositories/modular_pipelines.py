# pylint: disable=protected-access

from typing import Dict, List, Optional, Set

from kedro.pipeline import Pipeline as KedroPipeline

from kedro_viz.constants import ROOT_MODULAR_PIPELINE_ID
from kedro_viz.models.flowchart import (
    GraphNode,
    GraphNodeType,
    ModularPipelineChild,
    ModularPipelineNode,
)

try:
    # kedro 0.19.4 onwards
    from kedro.pipeline._transcoding import TRANSCODING_SEPARATOR, _strip_transcoding
except ImportError:  # pragma: no cover
    # older versions
    from kedro.pipeline.pipeline import TRANSCODING_SEPARATOR, _strip_transcoding


class ModularPipelinesRepository:
    """Repository for the set of modular pipelines in a registered pipeline."""

    def __init__(self):
        """
        Initialize the ModularPipelinesRepository with an empty tree and have a node to modular pipeline mapping.

        The tree contains a root modular pipeline node.
        """
        self.tree: Dict[str, ModularPipelineNode] = {
            ROOT_MODULAR_PIPELINE_ID: GraphNode.create_modular_pipeline_node(
                ROOT_MODULAR_PIPELINE_ID
            )
        }
        self.node_mod_pipeline_map: Dict[
            str, Set[str]
        ] = {}  # Updated to map node_id to a list of modular_pipeline_ids

    def populate_tree(self, pipeline: KedroPipeline):
        """
        Add inputs, outputs, and children to each modular pipeline node based on the given Kedro pipeline.

        Args:
            pipeline (KedroPipeline): The Kedro pipeline to populate the tree from.
        """
        namespaces = sorted(
            {node.namespace for node in pipeline.nodes if node.namespace}
        )

        modular_pipeline_ids = {
            id for ns in namespaces for id in self._explode_namespace(ns)
        }

        for modular_pipeline_id in sorted(modular_pipeline_ids):
            self.get_or_create_modular_pipeline(modular_pipeline_id)

            sub_pipeline = pipeline.only_nodes_with_namespace(modular_pipeline_id)
            rest_of_the_pipeline = pipeline - sub_pipeline

            free_inputs = sub_pipeline.inputs()
            free_outputs = sub_pipeline.outputs() | (
                rest_of_the_pipeline.inputs() & sub_pipeline.all_outputs()
            )

            self.add_inputs(modular_pipeline_id, free_inputs)
            self.add_outputs(modular_pipeline_id, free_outputs)
            self.add_children(modular_pipeline_id, sub_pipeline.nodes)

    def _explode_namespace(self, nested_namespace: str) -> List[str]:
        """
        Expand the nested namespace into its constituent parts.

        Args:
            nested_namespace (str): The nested namespace to expand.

        Returns:
            List[str]: A list of expanded namespaces.
        """
        if not nested_namespace or "." not in nested_namespace:
            return [nested_namespace] if nested_namespace else []
        ns_parts = nested_namespace.split(".")
        return [".".join(ns_parts[: i + 1]) for i in range(len(ns_parts))]

    def get_or_create_modular_pipeline(
        self, modular_pipeline_id: str
    ) -> ModularPipelineNode:
        """
        Retrieve or create a modular pipeline node.

        Args:
            modular_pipeline_id (str): The ID of the modular pipeline to retrieve or create.

        Returns:
            ModularPipelineNode: The retrieved or newly created modular pipeline node.
        """

        if not self.has_modular_pipeline(modular_pipeline_id):
            self.tree[modular_pipeline_id] = GraphNode.create_modular_pipeline_node(
                modular_pipeline_id
            )
        return self.tree[modular_pipeline_id]

    def add_inputs(self, modular_pipeline_id: str, inputs: Set[str]) -> None:
        """
        Add input datasets to the modular pipeline.

        Args:
            modular_pipeline_id (str): The ID of the modular pipeline to add inputs to.
            inputs (Set[str]): The input datasets to add.
        """
        hashed_inputs = {self._hash_input_output(input) for input in inputs}
        self.tree[modular_pipeline_id].inputs = hashed_inputs

    def add_outputs(self, modular_pipeline_id: str, outputs: Set[str]) -> None:
        """
        Add output datasets from the modular pipeline.

        Args:
            modular_pipeline_id (str): The ID of the modular pipeline to add outputs to.
            outputs (Set[str]): The output datasets to add.
        """
        hashed_outputs = {self._hash_input_output(output) for output in outputs}
        self.tree[modular_pipeline_id].outputs = hashed_outputs

    def _hash_input_output(self, item: str) -> str:
        """Hash the input/output dataset."""
        return (
            GraphNode._hash(_strip_transcoding(item))
            if TRANSCODING_SEPARATOR in item
            else GraphNode._hash(item)
        )

    def add_children(self, modular_pipeline_id: str, task_nodes: List[GraphNode]):
        """
        Add children to a modular pipeline. Here we follow the below rules
        - Any input/output of a modular pipeline is a child of the parent pipeline unless it is an input/output of that parent pipeline
        - Any input/output of a top-level modular pipeline is added as a child to the root modular pipeline
        - A task node is added as a child to a modular pipeline if it has the namespace of that modular pipeline
        - Inputs/Outputs of a task node are added as children to the modular pipeline if they are not inputs/outputs of that modular pipeline

        Args:
            modular_pipeline_id (str): The ID of the modular pipeline to add children to.
            task_nodes (List[GraphNode]): The task nodes (and it's related datasets/parameters) to add as children.
        """
        modular_pipeline = self.get_or_create_modular_pipeline(modular_pipeline_id)
        all_inputs_outputs = set(modular_pipeline.inputs) | set(
            modular_pipeline.outputs
        )

        parent_modular_pipeline_id = (
            modular_pipeline_id.split(".")[0] if "." in modular_pipeline_id else None
        )
        if parent_modular_pipeline_id:
            parent_modular_pipeline = self.get_or_create_modular_pipeline(
                parent_modular_pipeline_id
            )
            parent_modular_pipeline.pipelines.update(modular_pipeline.pipelines)
            self._add_children_to_parent_pipeline(
                parent_modular_pipeline, modular_pipeline_id, all_inputs_outputs
            )
        else:
            self._add_children_to_parent_pipeline(
                self.tree[ROOT_MODULAR_PIPELINE_ID],
                modular_pipeline_id,
                all_inputs_outputs,
            )

        for task_node in task_nodes:
            if task_node.namespace == modular_pipeline_id:
                task_node_id = GraphNode._hash(str(task_node))
                modular_pipeline.children.add(
                    ModularPipelineChild(id=task_node_id, type=GraphNodeType.TASK)
                )
                self._add_datasets_as_children(
                    modular_pipeline, task_node, all_inputs_outputs
                )
                if task_node_id not in self.node_mod_pipeline_map:
                    self.node_mod_pipeline_map[task_node_id] = set()
                self.node_mod_pipeline_map[task_node_id].add(modular_pipeline_id)

    def _add_children_to_parent_pipeline(
        self, parent_node, modular_pipeline_id, all_inputs_outputs
    ):
        """
        Helper to add modular_pipeline children correctly to parent modular pipelines in case of nesting.
        Here we follow the below rules:
        - A modular pipeline is a child of it's parent modular pipeline
        - Any input/output of a modular pipeline is a child of the parent pipeline unless it is an input/output of that parent pipeline
        - Any input/output of a top-level modular pipeline is added as a child to the root modular pipeline

        Args:
            parent_node (ModularPipelineNode): The parent modular pipeline node.
            modular_pipeline_id (str): The ID of the modular pipeline to add as a child.
            all_inputs_outputs (Set[str]): A set of all input/output IDs to consider.
        """

        parent_node.children.add(
            ModularPipelineChild(
                id=modular_pipeline_id, type=GraphNodeType.MODULAR_PIPELINE
            )
        )
        for dataset in all_inputs_outputs:
            if dataset not in parent_node.inputs and dataset not in parent_node.outputs:
                parent_node.children.add(
                    ModularPipelineChild(id=dataset, type=GraphNodeType.DATA)
                )
            if dataset not in self.node_mod_pipeline_map:
                self.node_mod_pipeline_map[dataset] = set()
            self.node_mod_pipeline_map[dataset].add(modular_pipeline_id)

    def _add_datasets_as_children(
        self, modular_pipeline, task_node, all_inputs_outputs
    ):
        """Helper to add datasets and parameters related to task nodes as children.

        Here we follow the below rule:
        - Inputs/Outputs of a task node are added as children to the modular pipeline if they are not inputs/outputs of that modular pipeline
        """
        hashed_io_ids = {
            self._hash_input_output(io)
            for io in set(task_node.inputs) | set(task_node.outputs)
        }
        for io_id in hashed_io_ids:
            if io_id not in all_inputs_outputs:
                modular_pipeline.children.add(
                    ModularPipelineChild(id=io_id, type=GraphNodeType.DATA)
                )
                if io_id not in self.node_mod_pipeline_map:
                    self.node_mod_pipeline_map[io_id] = set()
                self.node_mod_pipeline_map[io_id].add(modular_pipeline.id)

    def has_modular_pipeline(self, modular_pipeline_id: str) -> bool:
        """Check if the repository has a given modular pipeline ID."""
        return modular_pipeline_id in self.tree

    def get_modular_pipeline_for_node(self, node) -> Optional[List[str]]:
        """Get the modular pipeline(s) to which the given node belongs."""
        node_id = (
            self._hash_input_output(node)
            if isinstance(node, str)
            else GraphNode._hash(str(node))
        )
        return self.node_mod_pipeline_map.get(node_id)

    def as_dict(self) -> Dict[str, ModularPipelineNode]:
        """Return the repository as a dictionary."""
        return self.tree
