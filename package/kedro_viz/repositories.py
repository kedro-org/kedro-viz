from collections import defaultdict
from dataclasses import asdict
from typing import Dict, List, Set, Union, Optional
from semver import VersionInfo


import kedro
from kedro.io import DataCatalog, AbstractDataSet, DataSetNotFoundError
from kedro.pipeline import Pipeline
from kedro.pipeline.node import Node as KedroNode

from kedro_viz.models import GraphEdge, GraphNode, TaskNode, DataNode, ParametersNode


KEDRO_VERSION = VersionInfo.parse(kedro.__version__)


class GraphNodesRepository:
    def __init__(self):
        self.nodes_dict: Dict[str, GraphNode] = {}
        self.nodes_list: List[GraphNode] = []

    def _has_node(self, node: GraphNode) -> bool:
        return node.id in self.nodes_dict

    def add(self, node: GraphNode) -> GraphNode:
        if not self._has_node(node):
            self.nodes_dict[node.id] = node
            self.nodes_list.append(node)
        return self.nodes_dict[node.id]

    def get(self, node_id: str) -> GraphNode:
        return self.nodes_dict[node_id]

    def as_list(self):
        res = []
        for node in self.nodes_list:
            d = asdict(node)
            d["tags"] = list(d["tags"])
            res.append(d)
        return res

    def as_dict(self):
        res = {}
        for node_id, node in self.nodes_dict.items():
            d = asdict(node)
            d["tags"] = list(d["tags"])
            res[node_id] = d
        return res


class GraphEdgesRepository:
    def __init__(self):
        self.edges_list: Set[GraphEdge] = set()

    def add(self, edge: GraphEdge):
        self.edges_list.add(edge)

    def as_list(self) -> List[GraphEdge]:
        return list(self.edges_list)


class CatalogRepository:
    _catalog: DataCatalog

    def __init__(self):
        self._layers_mapping = None

    def get(self) -> DataCatalog:
        return self._catalog

    def set(self, value: DataCatalog):
        self._catalog = value

    @staticmethod
    def strip_encoding(dataset_name: str) -> str:
        return dataset_name.split("@")[0]

    @property
    def layers_mapping(self):
        """Return layer mapping: dataset_full_name -> layer it belongs to in the catalog
        """
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

    def get_dataset(self, dataset_name: str) -> AbstractDataSet:
        if KEDRO_VERSION.match(">=0.16.0"):
            try:
                dataset_obj = self._catalog._get_dataset(dataset_name)
            except DataSetNotFoundError:
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


class GraphRepository:
    def __init__(self):
        self.catalog = CatalogRepository()
        self.nodes = GraphNodesRepository()
        self.edges = GraphEdgesRepository()
        self.tags = set()
        self.modular_pipelines = set()
        self.node_dependencies = defaultdict(set)

    def add_catalog(self, catalog: DataCatalog):
        self.catalog.set(catalog)

    def add_pipelines(self, pipelines: List[Pipeline]):
        for pipeline_key, pipeline in pipelines.items():
            self.add_pipeline(pipeline_key, pipeline)

    def add_pipeline(self, pipeline_key: str, pipeline: Pipeline):
        for node in sorted(pipeline.nodes, key=lambda n: n.name):
            task_node = self.add_node(pipeline_key, node)

            for input in node.inputs:
                self.add_node_input(pipeline_key, input, task_node)

            for output in node.outputs:
                self.add_node_output(pipeline_key, output, task_node)

    def add_node(self, pipeline_key: str, node: KedroNode) -> TaskNode:
        task_node: TaskNode = self.nodes.add(GraphNode.create_task_node(node))
        task_node.add_pipeline(pipeline_key)
        self.tags.update(task_node.tags)
        self.modular_pipelines.update(task_node.modular_pipelines)
        return task_node

    def add_node_input(
        self, pipeline_key: str, input_dataset: str, task_node: TaskNode
    ):
        graph_node = self.add_dataset(pipeline_key, input_dataset)
        graph_node.tags.update(task_node.tags)
        self.edges.add(GraphEdge(source=graph_node.id, target=task_node.id))
        self.node_dependencies[graph_node.id].add(task_node.id)

        if isinstance(graph_node, ParametersNode):
            self.add_parameters_to_task_node(
                parameters_node=graph_node, task_node=task_node
            )

    def add_node_output(
        self, pipeline_key: str, output_dataset: str, task_node: TaskNode
    ):
        graph_node = self.add_dataset(pipeline_key, output_dataset)
        graph_node.tags.update(task_node.tags)
        self.edges.add(GraphEdge(source=task_node.id, target=graph_node.id))
        self.node_dependencies[task_node.id].add(graph_node.id)

    def add_dataset(
        self, pipeline_key: str, dataset_name: str
    ) -> Union[DataNode, ParametersNode]:
        obj = self.catalog.get_dataset(dataset_name)
        layer = self.catalog.get_layer_for_dataset(dataset_name)
        if self.catalog.is_dataset_param(dataset_name):
            graph_node = GraphNode.create_parameters_node(
                full_name=dataset_name, layer=layer, tags=set(), parameters=obj,
            )
        else:
            graph_node = GraphNode.create_data_node(
                full_name=dataset_name, layer=layer, tags=set(), dataset=obj,
            )
            self.modular_pipelines.update(
                graph_node.modular_pipelines
            )  # todo lim: WHY?
        graph_node = self.nodes.add(graph_node)
        graph_node.add_pipeline(pipeline_key)
        return graph_node

    def add_parameters_to_task_node(
        self, parameters_node: ParametersNode, task_node: TaskNode
    ):
        if parameters_node.is_all_parameters():
            task_node.parameters = parameters_node.parameter_value
        else:
            task_node.parameters[
                parameters_node.parameter_name
            ] = parameters_node.parameters_value


graph_repository = GraphRepository()
