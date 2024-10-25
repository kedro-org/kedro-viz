"""`kedro_viz.data_access.managers` defines data access managers."""

import logging
from collections import defaultdict
from typing import Dict, List, Set, Union

import networkx as nx
from kedro.io import DataCatalog

try:
    # kedro 0.18.11 onwards
    from kedro.io.core import DatasetError
except ImportError:  # pragma: no cover
    # older versions
    from kedro.io.core import DataSetError as DatasetError  # type: ignore

from kedro.pipeline import Pipeline as KedroPipeline
from kedro.pipeline.node import Node as KedroNode
from sqlalchemy.orm import sessionmaker

from kedro_viz.constants import DEFAULT_REGISTERED_PIPELINE_ID, ROOT_MODULAR_PIPELINE_ID
from kedro_viz.integrations.utils import UnavailableDataset
from kedro_viz.models.flowchart import (
    DataNode,
    GraphEdge,
    GraphNode,
    GraphNodeType,
    ModularPipelineChild,
    ModularPipelineNode,
    ParametersNode,
    RegisteredPipeline,
    TaskNode,
    TranscodedDataNode,
)
from kedro_viz.services import layers_services
from kedro_viz.utils import _strip_transcoding, is_dataset_param

from .repositories import (
    CatalogRepository,
    GraphEdgesRepository,
    GraphNodesRepository,
    ModularPipelinesRepository,
    RegisteredPipelinesRepository,
    RunsRepository,
    TagsRepository,
    TrackingDatasetsRepository,
)

logger = logging.getLogger(__name__)


class DataAccessManager:
    """Centralised interface for the rest of the application to interact with data repositories."""

    def __init__(self):
        self.catalog = CatalogRepository()
        self.nodes = GraphNodesRepository()
        self.registered_pipelines = RegisteredPipelinesRepository()
        self.tags = TagsRepository()

        # Make sure each registered pipeline has a distinct collection of
        # - modular pipelines
        # - edges
        # - node dependencies
        self.modular_pipelines: Dict[str, ModularPipelinesRepository] = defaultdict(
            ModularPipelinesRepository
        )
        self.edges: Dict[str, GraphEdgesRepository] = defaultdict(GraphEdgesRepository)
        self.node_dependencies: Dict[str, Dict[str, Set]] = defaultdict(
            lambda: defaultdict(set)
        )
        self.runs = RunsRepository()
        self.tracking_datasets = TrackingDatasetsRepository()
        self.dataset_stats = {}

    def set_db_session(self, db_session_class: sessionmaker):
        """Set db session on repositories that need it."""
        self.runs.set_db_session(db_session_class)

    def resolve_dataset_factory_patterns(
        self, catalog: DataCatalog, pipelines: Dict[str, KedroPipeline]
    ):
        """Resolve dataset factory patterns in data catalog by matching
        them against the datasets in the pipelines.
        """
        for pipeline in pipelines.values():
            if hasattr(pipeline, "data_sets"):
                # Support for Kedro 0.18.x
                datasets = pipeline.data_sets()
            else:
                datasets = pipeline.datasets()

            for dataset_name in datasets:
                try:
                    catalog._get_dataset(dataset_name, suggest=False)
                except Exception:  # noqa: BLE001 # pragma: no cover
                    continue

    def add_catalog(self, catalog: DataCatalog, pipelines: Dict[str, KedroPipeline]):
        """Resolve dataset factory patterns, add the catalog to the CatalogRepository
        and relevant tracking datasets to TrackingDatasetRepository.

        Args:
            catalog: The DataCatalog instance to add.
            pipelines: A dictionary which holds project pipelines
        """

        self.resolve_dataset_factory_patterns(catalog, pipelines)

        self.catalog.set_catalog(catalog)

        for dataset_name, dataset in self.catalog.as_dict().items():
            if self.tracking_datasets.is_tracking_dataset(dataset):
                self.tracking_datasets.add_tracking_dataset(dataset_name, dataset)

    def add_pipelines(self, pipelines: Dict[str, KedroPipeline]):
        """Extract objects from all registered pipelines from a Kedro project
        into the relevant repositories.

        Args:
            pipelines: All registered pipelines in a Kedro project.
        """
        for registered_pipeline_id, pipeline in pipelines.items():
            # Add the registered pipeline and its components to their repositories
            self.add_pipeline(registered_pipeline_id, pipeline)

    def add_dataset_stats(self, stats_dict: Dict):
        """Add dataset statistics (eg. rows, columns, file_size) as a dictionary.
        This will help in showing the relevant stats in the metadata panel

        Args:
            stats_dict: A dictionary object loaded from stats.json file in the kedro project
        """

        self.dataset_stats = stats_dict

    def get_stats_for_data_node(self, data_node_name: str) -> Union[Dict, None]:
        """Returns the dataset statistics for the data node if found

        Args:
            The data node name for which we need the statistics
        """

        return self.dataset_stats.get(data_node_name, None)

    def add_pipeline(self, registered_pipeline_id: str, pipeline: KedroPipeline):
        """Iterate through all the nodes and datasets in a "registered" pipeline
        and add them to relevant repositories. Take care of extracting other relevant information
        such as modular pipelines, layers, etc. and add them to relevant repositories.

        The purpose of this method is to construct a set of repositories of Viz-specific
        domain models from raw Kedro objects before feeding them to the API serialisation layer.

        Args:
            registered_pipeline_id: The ID of the registered pipeline to add to the graph.
            pipeline: The Kedro pipeline instance to convert to graph models
                and add to relevant repositories representing the graph.
        """
        self.registered_pipelines.add_pipeline(registered_pipeline_id)
        modular_pipelines_repo_obj = self.modular_pipelines[registered_pipeline_id]
        modular_pipelines_repo_obj.populate_tree(pipeline)

        free_inputs = pipeline.inputs()

        for node in pipeline.nodes:
            # Add a Kedro node as a TaskNode to the NodesRepository
            # for a given registered pipeline ID
            task_node = self.add_node(
                registered_pipeline_id, node, modular_pipelines_repo_obj
            )

            # Add the task node created above to RegisteredPipelinesRepository
            self.registered_pipelines.add_node(registered_pipeline_id, task_node.id)

            # Add node's inputs as DataNode to the graph
            for input_ in node.inputs:
                # Add the input as an input to the task_node
                # Mark it as a transcoded dataset unless it's a free input
                # because free inputs to the pipeline can't be transcoded.
                is_free_input = input_ in free_inputs
                input_node = self.add_node_input(
                    registered_pipeline_id,
                    input_,
                    task_node,
                    modular_pipelines_repo_obj,
                    is_free_input,
                )
                self.registered_pipelines.add_node(
                    registered_pipeline_id, input_node.id
                )
                if isinstance(input_node, TranscodedDataNode):
                    input_node.transcoded_versions.add(self.catalog.get_dataset(input_))

            # Add node outputs as DataNode to the graph.
            # It follows similar logic to adding inputs.
            for output in node.outputs:
                output_node = self.add_node_output(
                    registered_pipeline_id,
                    output,
                    task_node,
                    modular_pipelines_repo_obj,
                )
                self.registered_pipelines.add_node(
                    registered_pipeline_id, output_node.id
                )
                if isinstance(output_node, TranscodedDataNode):
                    output_node.original_name = output
                    output_node.original_version = self.catalog.get_dataset(output)

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
            GraphNode.create_task_node(node, node_id, modular_pipeline_ids)
        )
        task_node.add_pipeline(registered_pipeline_id)
        self.tags.add_tags(task_node.tags)
        return task_node

    def add_node_input(
        self,
        registered_pipeline_id: str,
        input_dataset: str,
        task_node: TaskNode,
        modular_pipelines_repo_obj: ModularPipelinesRepository,
        is_free_input: bool = False,
    ) -> Union[DataNode, TranscodedDataNode, ParametersNode]:
        """Add a Kedro node's input as a DataNode, TranscodedDataNode or ParametersNode
        to the NodesRepository for a given registered pipeline ID.

        Args:
            registered_pipeline_id: The pipeline ID to which the node's input belongs.
            input_dataset: The input dataset of the TaskNode.
            task_node: The TaskNode to add input to.
            modular_pipelines_repo_obj: The modular pipelines repository
                    instance for the registered pipeline.
            is_free_input: Whether the input is a free input to the pipeline.
        Returns:
            The GraphNode instance representing the node's input that was added to the graph.
        """

        graph_node = self.add_dataset(
            registered_pipeline_id,
            input_dataset,
            modular_pipelines_repo_obj,
            is_free_input=is_free_input,
        )
        graph_node.tags.update(task_node.tags)
        self.edges[registered_pipeline_id].add_edge(
            GraphEdge(source=graph_node.id, target=task_node.id)
        )
        self.node_dependencies[registered_pipeline_id][graph_node.id].add(task_node.id)

        if isinstance(graph_node, ParametersNode):
            self.add_parameters_to_task_node(
                parameters_node=graph_node, task_node=task_node
            )
        return graph_node

    def add_node_output(
        self,
        registered_pipeline_id: str,
        output_dataset: str,
        task_node: TaskNode,
        modular_pipelines_repo_obj: ModularPipelinesRepository,
    ) -> Union[DataNode, TranscodedDataNode, ParametersNode]:
        """Add a Kedro node's output as a DataNode, TranscodedDataNode or ParametersNode
        to the NodesRepository for a given registered pipeline ID.

        Args:
            registered_pipeline_id: The pipeline ID to which the node's output belongs.
            output_dataset: The output dataset of the TaskNode.
            task_node: The TaskNode to add output to.
            modular_pipelines_repo_obj: The modular pipelines repository
                    instance for the registered pipeline.
        Returns:
            The GraphNode instance representing the node's output that was added to the graph.
        """
        graph_node = self.add_dataset(
            registered_pipeline_id, output_dataset, modular_pipelines_repo_obj
        )
        graph_node.tags.update(task_node.tags)
        self.edges[registered_pipeline_id].add_edge(
            GraphEdge(source=task_node.id, target=graph_node.id)
        )
        self.node_dependencies[registered_pipeline_id][task_node.id].add(graph_node.id)
        return graph_node

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
            obj = self.catalog.get_dataset(dataset_name)
        except DatasetError:
            # This is to handle dataset factory patterns when running
            # Kedro Viz in lite mode. The `get_dataset` function
            # of DataCatalog calls AbstractDataset.from_config
            # which tries to create a Dataset instance from the pattern
            obj = UnavailableDataset()

        layer = self.catalog.get_layer_for_dataset(dataset_name)
        graph_node: Union[DataNode, TranscodedDataNode, ParametersNode]
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

        if is_dataset_param(dataset_name):
            graph_node = GraphNode.create_parameters_node(
                dataset_id=dataset_id,
                dataset_name=dataset_name,
                layer=layer,
                tags=set(),
                parameters=obj,
                modular_pipelines=None,
            )
        else:
            graph_node = GraphNode.create_data_node(
                dataset_id=dataset_id,
                dataset_name=dataset_name,
                layer=layer,
                tags=set(),
                dataset=obj,
                stats=self.get_stats_for_data_node(_strip_transcoding(dataset_name)),
                modular_pipelines=modular_pipeline_ids,
                is_free_input=is_free_input,
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

    def get_default_selected_pipeline(self) -> RegisteredPipeline:
        """Return the default selected pipeline ID to display on first page load.
        If the DEFAULT_REGISTERED_PIPELINE_ID is present in user's project,
        use that. Otherwise, return the first one in the list of registered pipelines.

        Returns:
            The default selected RegisteredPipeline instance.
        """
        default_pipeline = RegisteredPipeline(id=DEFAULT_REGISTERED_PIPELINE_ID)
        return (
            default_pipeline
            if self.registered_pipelines.has_pipeline(default_pipeline.id)
            else self.registered_pipelines.as_list()[0]
        )

    def get_nodes_for_registered_pipeline(
        self, registered_pipeline_id: str = DEFAULT_REGISTERED_PIPELINE_ID
    ) -> List[GraphNode]:
        """Return all nodes for a given registered pipeline.

        Args:
            registered_pipeline_id: The registered pipeline ID to get nodes for.
        Returns:
            List of GraphNode objects in the given registered pipeline.
        """
        node_ids = self.registered_pipelines.get_node_ids_by_pipeline_id(
            registered_pipeline_id
        )
        return self.nodes.get_nodes_by_ids(node_ids)

    def get_edges_for_registered_pipeline(
        self, registered_pipeline_id: str = DEFAULT_REGISTERED_PIPELINE_ID
    ) -> List[GraphEdge]:
        """Return all edges for a given registered pipeline.

        Args:
            registered_pipeline_id: The registered pipeline ID to get edges for.
        Returns:
            List of GraphEdge objects in the given registered pipeline.
        """
        return self.edges[registered_pipeline_id].as_list()

    def get_node_dependencies_for_registered_pipeline(
        self, registered_pipeline_id: str = DEFAULT_REGISTERED_PIPELINE_ID
    ) -> Dict[str, Set]:
        """Return all node dependencies for a given registered pipeline.

        Args:
            registered_pipeline_id: The registered pipeline ID to get edges for.
        Returns:
            Dictionary of GraphNode objects and the nodes that they depend on
                in the given registered pipeline.
        """
        return self.node_dependencies[registered_pipeline_id]

    def get_sorted_layers_for_registered_pipeline(
        self, registered_pipeline_id: str = DEFAULT_REGISTERED_PIPELINE_ID
    ) -> List[str]:
        """Return layers in a topologically sorted order for a registered pipeline.

        Args:
            registered_pipeline_id: The registered pipeline ID to get sorted layers for.
        Returns:
            List of layers in a topologically sorted order for the given registered pipeline.
        """
        return layers_services.sort_layers(
            self.nodes.as_dict(),
            self.get_node_dependencies_for_registered_pipeline(registered_pipeline_id),
        )

    def create_modular_pipelines_tree_for_registered_pipeline(  # noqa: PLR0912
        self, registered_pipeline_id: str = DEFAULT_REGISTERED_PIPELINE_ID
    ) -> Dict[str, ModularPipelineNode]:
        """Create the modular pipelines tree for a specific registered pipeline.
        During the process, expand the compact tree into a full tree
        and add the modular pipeline nodes to the list of nodes
        as well as modular pipeline edges to the list of edges in the registered pipeline.
        N.B. The method is named `create_` to also imply that it has side effect on
        other repositories in the data access manager.

        Args:
            registered_pipeline_id: The registered pipeline ID to get modular pipelines for.
        Returns:
            The modular pipelines tree represented as a dictionary of nodes with child references.
        """

        edges = self.edges[registered_pipeline_id]
        node_dependencies = self.node_dependencies[registered_pipeline_id]
        modular_pipelines_tree = self.modular_pipelines[
            registered_pipeline_id
        ].as_dict()

        root_parameters = set()

        # turn all modular pipelines in the tree into a graph node for visualisation,
        # except for the artificial root node
        for (
            modular_pipeline_id,
            modular_pipeline_node,
        ) in modular_pipelines_tree.items():
            if modular_pipeline_id == ROOT_MODULAR_PIPELINE_ID:
                continue

            # Add the modular pipeline node to the global list of nodes if necessary
            # and update the list of pipelines it belongs to.
            # N.B. Ideally we will have different modular pipeline nodes for
            # different registered pipelines, but that requires a bit of a bigger refactor
            # so we will just use the same node for now.
            self.nodes.add_node(modular_pipeline_node)
            self.nodes.get_node_by_id(modular_pipeline_node.id).pipelines = {
                registered_pipeline_id
            }

            self.registered_pipelines.add_node(
                registered_pipeline_id, modular_pipeline_node.id
            )

            # only keep the modular pipeline's inputs belonging to the current registered pipeline
            for input_id in modular_pipeline_node.inputs:
                input_node = self.nodes.get_node_by_id(input_id)
                if input_node.belongs_to_pipeline(registered_pipeline_id):
                    edges.add_edge(
                        GraphEdge(source=input_id, target=modular_pipeline_id)
                    )
                    node_dependencies[input_id].add(modular_pipeline_id)
                if isinstance(input_node, ParametersNode):
                    root_parameters.add(input_id)

            # only keep the modular pipeline's outputs belonging to the current registered pipeline
            for output_id in modular_pipeline_node.outputs:
                output_node = self.nodes.get_node_by_id(output_id)
                if output_node.belongs_to_pipeline(registered_pipeline_id):
                    edges.add_edge(
                        GraphEdge(source=modular_pipeline_id, target=output_id)
                    )
                    node_dependencies[modular_pipeline_id].add(output_id)

        # After adding modular pipeline nodes into the graph,
        # There is a chance that the graph with these nodes contains cycles if
        # users construct their modular pipelines in a few particular ways.
        # To detect the cycles, we simply search for all reachable
        # descendants of a modular pipeline node and check if
        # any of them is an input into this modular pipeline.
        # If found, we will simply throw away the edge between
        # the bad input and the modular pipeline.
        # N.B.: when fully expanded, the graph will still be a fully connected valid DAG,
        # so no need to check non modular pipeline nodes.
        #
        # We leverage networkx to help with graph traversal
        digraph = nx.DiGraph()
        for edge in edges:
            digraph.add_edge(edge.source, edge.target)

        for modular_pipeline_id, modular_pipeline in modular_pipelines_tree.items():
            if not digraph.has_node(modular_pipeline_id):
                continue
            descendants = nx.descendants(digraph, modular_pipeline_id)
            bad_inputs = modular_pipeline.inputs.intersection(descendants)
            for bad_input in bad_inputs:
                digraph.remove_edge(bad_input, modular_pipeline_id)
                edges.remove_edge(
                    GraphEdge(source=bad_input, target=modular_pipeline_id)
                )
                node_dependencies[bad_input].remove(modular_pipeline_id)

        for node_id, node in self.nodes.as_dict().items():
            if (
                node.type == GraphNodeType.MODULAR_PIPELINE
                or not node.belongs_to_pipeline(registered_pipeline_id)
            ):
                continue
            if node.modular_pipelines is None or node_id in root_parameters:
                modular_pipelines_tree[ROOT_MODULAR_PIPELINE_ID].children.add(
                    ModularPipelineChild(
                        id=node_id, type=self.nodes.get_node_by_id(node_id).type
                    )
                )

        return modular_pipelines_tree
