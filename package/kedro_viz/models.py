# from sqlalchemy import Boolean, Column, ForeignKey, Integer, String
# from sqlalchemy.orm import relationship
#
#
# from .database import Base
#
#
# """
# {
#                 "type": "task",
#                 "id": task_id,
#                 "name": getattr(node, "short_name", node.name),
#                 "full_name": getattr(node, "_func_name", str(node)),
#                 "tags": sorted(node.tags),
#                 "pipelines": [pipeline_key],
#             }
# """
#
#
# class GraphNode(Base):
#     __tablename__ = "graph_nodes"
#
#     id = Column(String, primary_key=True, index=True)
#     name = Column(String, unique=True, index=True)
#     full_name = Column(String, unique=True)
#
#
# class GraphEdge(Base):
#     __tablename__ = "graph_edges"
#
import abc
from dataclasses import dataclass, field, InitVar, asdict
import hashlib
from typing import Dict, List, Union
from enum import Enum

from kedro.pipeline.node import Node
from kedro.io import AbstractDataSet


def _hash(value: str):
    return hashlib.sha1(value.encode("UTF-8")).hexdigest()[:8]


def _pretty_name(name: str) -> str:
    name = name.replace("-", " ").replace("_", " ")
    parts = [n.capitalize() for n in name.split()]
    return " ".join(parts)


def _expand_namespaces(namespace):
    """
    Expand a node's namespace to the modular pipelines this node belongs to.
    For example, if the node's namespace is: "pipeline1.data_science"
    it should be expanded to: ["pipeline1", "pipeline1.data_science"]
    """
    if not namespace:
        return []
    namespace_list = []
    namespace_chunks = namespace.split(".")
    prefix = ""
    for chunk in namespace_chunks:
        if prefix:
            prefix = f"{prefix}.{chunk}"
        else:
            prefix = chunk
        namespace_list.append(prefix)
    return namespace_list


def _get_namespace(dataset_full_name):
    """
    Extract the namespace from the full dataset/parameter name.
    """
    if "." in dataset_full_name:
        # The last part of the namespace is the actual name of the dataset
        # e.g. in pipeline1.data_science.a, "pipeline1.data_science" indicates
        # the modular pipelines and "a" the name of the dataset.
        return dataset_full_name.rsplit(".", 1)[0]


class GraphNodeType(Enum):
    TASK = "task"
    DATA = "data"
    PARAMETERS = "parameters"


@dataclass
class GraphNode(abc.ABC):
    id: str
    name: str
    full_name: str
    tags: List[str]
    pipelines: List[str]

    @classmethod
    def create_task_node(cls, node: Node) -> "TaskNode":
        return TaskNode(
            id=_hash(str(node)),
            name=getattr(node, "short_name", node.name),
            full_name=getattr(node, "short_name", node.name),
            tags=list(sorted(node.tags)),
            pipelines=[],
            kedro_obj=node,
        )

    @classmethod
    def create_data_node(
        cls, full_name: str, layer: str, tags: List[str], dataset: AbstractDataSet
    ) -> "DataNode":
        return DataNode(
            id=_hash(full_name),
            name=_pretty_name(full_name),
            full_name=full_name,
            tags=tags,
            layer=layer,
            pipelines=[],
            kedro_obj=dataset,
        )

    @classmethod
    def create_parameters_node(
        cls, full_name: str, layer: str, tags: List[str], dataset: AbstractDataSet
    ) -> "ParametersNode":
        return ParametersNode(
            id=_hash(full_name),
            name=_pretty_name(full_name),
            full_name=full_name,
            tags=tags,
            layer=layer,
            pipelines=[],
            kedro_obj=dataset,
        )

    def add_pipeline(self, pipeline_key: str):
        self.pipelines.append(pipeline_key)


@dataclass
class TaskNode(GraphNode):
    kedro_obj: InitVar[Node]
    modular_pipelines: List[str] = field(init=False)
    parameters: Dict = field(init=False, default_factory=dict)
    type: str = GraphNodeType.TASK.value

    def __post_init__(self, kedro_obj: Node):
        self._kedro_obj = kedro_obj
        self.modular_pipelines = _expand_namespaces(
            _expand_namespaces(kedro_obj.namespace)
        )

    @property
    def kedro_obj(self):
        return self._kedro_obj


@dataclass
class DataNode(GraphNode):
    layer: str
    kedro_obj: InitVar[AbstractDataSet]
    modular_pipelines: List[str] = field(init=False)
    type: str = GraphNodeType.DATA.value

    def __post_init__(self, kedro_obj: AbstractDataSet):
        self._kedro_obj = kedro_obj
        self.modular_pipelines = _expand_namespaces(_get_namespace(self.full_name))

    @property
    def kedro_obj(self):
        return self._kedro_obj


@dataclass
class ParametersNode(GraphNode):
    layer: str
    modular_pipelines: List[str] = field(init=False)
    kedro_obj: InitVar[AbstractDataSet]
    type: str = GraphNodeType.PARAMETERS.value

    def __post_init__(self, kedro_obj):
        self._kedro_obj = kedro_obj
        if self.is_all_parameters():
            self.modular_pipelines = []
        else:
            self.modular_pipelines = _expand_namespaces(
                _get_namespace(self.parameter_name)
            )

    def is_all_parameters(self) -> bool:
        return self.full_name == "parameters"

    def is_single_parameter(self) -> bool:
        return not self.is_all_parameters()

    @property
    def parameter_name(self) -> str:
        return self.full_name.replace("params:", "")

    @property
    def values(self) -> Dict:
        if self.is_single_parameter():
            return {"parameters": {self.parameter_name: self._kedro_obj.load()}}
        else:
            return {"parameters": self._kedro_obj.load()}

