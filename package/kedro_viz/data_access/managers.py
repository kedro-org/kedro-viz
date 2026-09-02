"""`kedro_viz.data_access.managers` defines data access managers."""

import logging
from collections import defaultdict
from typing import Dict, Optional, Union

from kedro.io import DataCatalog
from kedro.io.core import DatasetError
from kedro.pipeline import Pipeline as KedroPipeline
from kedro.pipeline.node import Node as KedroNode

from kedro_viz.constants import ROOT_MODULAR_PIPELINE_ID
from kedro_viz.integrations.utils import UnavailableDataset
from kedro_viz.models.flowchart.model_utils import GraphNodeType
from kedro_viz.models.flowchart.nodes import (
    DataNode,
    GraphNode,
    ModularPipelineChild,
    ParametersNode,
    TaskNode,
    TranscodedDataNode,
)
from kedro_viz.models.metadata import NodeExtras
from kedro_viz.utils import _strip_transcoding, is_dataset_param

from .repositories import (
    CatalogRepository,
    GraphNodesRepository,
    ModularPipelinesRepository,
)

logger = logging.getLogger(__name__)


class DataAccessManager:
    """Centralised interface for the rest of the application to interact with data repositories.

    Builds only the viz node objects that back the metadata bridge (source code, previews, stats,
    dataset type for ``/api/nodes/{id}``). The graph itself is served by the inspection adapter
    from a Kedro snapshot — this manager no longer builds edges, node dependencies, registered
    pipelines or the modular-pipeline tree.
    """

    def __init__(self):
        self._initialize_fields()

    def _initialize_fields(self):
        """Initialize or reset all instance variables."""
        self.catalog = CatalogRepository()
        self.nodes = GraphNodesRepository()

        # One modular-pipelines repository per registered pipeline — used only to derive node ids
        # and each node's ``modular_pipelines`` membership (no tree expansion / edges).
        self.modular_pipelines: Dict[str, ModularPipelinesRepository] = defaultdict(
            ModularPipelinesRepository
        )
        self.node_extras: Dict[str, NodeExtras] = {}

    def reset_fields(self):
        """Reset all instance variables."""
        self._initialize_fields()

    def resolve_dataset_factory_patterns(
        self,
        catalog: DataCatalog,
        pipelines: Dict[str, KedroPipeline],
    ):
        """Resolve dataset factory patterns in data catalog by matching
        them against the datasets in the pipelines. This is also required
        to populate layers information for dataset factories.
        """
        all_datasets = set()
        for pipeline in pipelines.values():
            datasets = pipeline.datasets()
            all_datasets.update(datasets)

        for dataset_name in all_datasets:
            try:
                catalog.get(dataset_name)
            except Exception:  # noqa: BLE001 # pragma: no cover
                continue

    def add_catalog(
        self,
        catalog: DataCatalog,
        pipelines: Dict[str, KedroPipeline],
    ):
        """Add the catalog to the CatalogRepository

        Args:
            catalog: The DataCatalog instance to add.
        """
        self.resolve_dataset_factory_patterns(catalog, pipelines)
        self.catalog.set_catalog(catalog)

    def add_metadata_nodes(self, pipelines: Dict[str, KedroPipeline]):
        """Populate ``self.nodes`` with viz node objects ONLY — the slim path that feeds the
        metadata bridge.

        Creates the viz node objects (``add_node`` / ``add_dataset`` /
        ``add_parameters_to_task_node`` + transcoded wiring) and skips the graph-structure work:
        no edges, no node dependencies, no registered-pipeline lists, no modular-tree expansion.
        The snapshot adapter owns the graph; the live objects here only answer ``/api/nodes/{id}``
        (source code, preview, stats, dataset type).
        """
        for registered_pipeline_id, pipeline in pipelines.items():
            modular_pipelines_repo_obj = self.modular_pipelines[registered_pipeline_id]
            modular_pipelines_repo_obj.populate_tree(pipeline)
            free_inputs = pipeline.inputs()
            for node in pipeline.nodes:
                task_node = self.add_node(
                    registered_pipeline_id, node, modular_pipelines_repo_obj
                )
                for input_ in node.inputs:
                    input_node = self.add_dataset(
                        registered_pipeline_id,
                        input_,
                        modular_pipelines_repo_obj,
                        is_free_input=input_ in free_inputs,
                    )
                    input_node.tags.update(task_node.tags)
                    if isinstance(input_node, TranscodedDataNode):
                        input_node.transcoded_versions.add(
                            self.catalog.get_dataset(input_)
                        )
                    if isinstance(input_node, ParametersNode):
                        self.add_parameters_to_task_node(
                            parameters_node=input_node, task_node=task_node
                        )
                for output in node.outputs:
                    output_node = self.add_dataset(
                        registered_pipeline_id, output, modular_pipelines_repo_obj
                    )
                    output_node.tags.update(task_node.tags)
                    if isinstance(output_node, TranscodedDataNode):
                        output_node.original_name = output
                        output_node.original_version = self.catalog.get_dataset(output)

    def add_node_extras(self, node_extras_mapping: Dict[str, NodeExtras]):
        """Add all node extras at once.

        Args:
            node_extras_mapping: Dictionary mapping node names to NodeExtras objects
        """
        self.node_extras = node_extras_mapping

    def get_extras_for_node(self, node_name: str) -> Optional[NodeExtras]:
        """Get NodeExtras instance for a node.

        Args:
            node_name: The name of the node

        Returns:
            NodeExtras object or None
        """
        return self.node_extras.get(node_name)

    def add_node(
        self,
        registered_pipeline_id: str,
        node: KedroNode,
        modular_pipelines_repo_obj: ModularPipelinesRepository,
    ) -> TaskNode:
        """Add a Kedro node as a TaskNode to the NodesRepository
        for a given registered pipeline ID.

        Args:
            registered_pipeline_id: The registered pipeline ID to which the node belongs.
            node: The Kedro node to add as TaskNode.
            modular_pipelines_repo_obj: The modular pipelines repository
                    instance for the registered pipeline.
        Returns:
            The GraphNode instance representing the Kedro node that was added to the graph.
        """
        (
            node_id,
            modular_pipeline_ids,
        ) = modular_pipelines_repo_obj.get_node_and_modular_pipeline_mapping(node)
        task_node: TaskNode = self.nodes.add_node(
            GraphNode.create_task_node(
                node=node,
                node_id=node_id,
                modular_pipelines=modular_pipeline_ids,
                node_extras=self.get_extras_for_node(node._name or node._func_name),
            )
        )
        task_node.add_pipeline(registered_pipeline_id)
        return task_node

    def add_dataset(
        self,
        registered_pipeline_id: str,
        dataset_name: str,
        modular_pipelines_repo_obj: ModularPipelinesRepository,
        is_free_input: bool = False,
    ) -> Union[DataNode, TranscodedDataNode, ParametersNode]:
        """Add a Kedro dataset as a DataNode, TranscodedDataNode or ParametersNode
        to the NodesRepository for a given registered pipeline ID.

        Args:
            registered_pipeline_id: The registered pipeline ID to which the dataset belongs.
            dataset_name: The name of the dataset.
            modular_pipelines_repo_obj: The modular pipelines repository
                    instance for the registered pipeline.
            is_free_input: Whether the dataset is a free input to the registered pipeline.
        Returns:
            The GraphNode instance representing the dataset that was added to the NodesRepository.
        """
        try:
            dataset_obj = self.catalog.get_dataset(dataset_name)
        except DatasetError:
            dataset_obj = UnavailableDataset()

        layer = self.catalog.get_layer_for_dataset(dataset_name)
        (
            dataset_id,
            modular_pipeline_ids,
        ) = modular_pipelines_repo_obj.get_node_and_modular_pipeline_mapping(
            dataset_name
        )

        # add datasets that are not part of a modular pipeline
        # as a child to the root modular pipeline
        if modular_pipeline_ids is None:
            root_modular_pipeline_node = (
                modular_pipelines_repo_obj.get_or_create_modular_pipeline(
                    ROOT_MODULAR_PIPELINE_ID
                )
            )
            root_modular_pipeline_node.children.add(
                ModularPipelineChild(id=dataset_id, type=GraphNodeType.DATA)
            )

            # update the node_mod_pipeline_map
            if dataset_id not in modular_pipelines_repo_obj.node_mod_pipeline_map:
                modular_pipelines_repo_obj.node_mod_pipeline_map[dataset_id] = {
                    ROOT_MODULAR_PIPELINE_ID
                }

        graph_node: Union[DataNode, TranscodedDataNode, ParametersNode]

        if is_dataset_param(dataset_name):
            graph_node = GraphNode.create_parameters_node(
                dataset_id=dataset_id,
                dataset_name=dataset_name,
                layer=layer,
                tags=set(),
                parameters=dataset_obj,
                modular_pipelines=None,
                node_extras=self.get_extras_for_node(dataset_name),
            )
        else:
            graph_node = GraphNode.create_data_node(
                dataset_id=dataset_id,
                dataset_name=dataset_name,
                layer=layer,
                tags=set(),
                dataset=dataset_obj,
                modular_pipelines=modular_pipeline_ids,
                is_free_input=is_free_input,
                node_extras=self.get_extras_for_node(_strip_transcoding(dataset_name)),
            )
        graph_node = self.nodes.add_node(graph_node)
        graph_node.add_pipeline(registered_pipeline_id)
        return graph_node

    @staticmethod
    def add_parameters_to_task_node(
        parameters_node: ParametersNode, task_node: TaskNode
    ):
        """Add parameters to a task node in order to show which task node has parameters.

        Args:
            parameters_node: The parameters to add.
            task_node: The task node to add parameters to.
        """
        if parameters_node.is_all_parameters():
            task_node.parameters = parameters_node.parameter_value
        else:
            task_node.parameters[parameters_node.parameter_name] = (
                parameters_node.parameter_value
            )
