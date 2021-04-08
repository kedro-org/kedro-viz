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
from dataclasses import dataclass
import hashlib
from typing import List, Union
from enum import Enum

from kedro.pipeline.node import Node


def _hash(value: str):
    return hashlib.sha1(value.encode("UTF-8")).hexdigest()[:8]


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
    type: str

    @classmethod
    def create(
        cls, node_type: GraphNodeType, *args, **kwargs
    ) -> Union["TaskNode", "DataNode"]:
        if node_type == GraphNodeType.TASK:
            return cls.create_task_node(*args, **kwargs)
        raise NotImplemented

    @classmethod
    def create_task_node(cls, node: Node) -> "TaskNode":
        return TaskNode(
            id=_hash(str(node)),
            name=getattr(node, "short_name", node.name),
            full_name=getattr(node, "short_name", node.name),
            tags=list(sorted(node.tags)),
            pipelines=[],
        )

    """
    {
                "type": "parameters" if is_param else "data",
                "id": node_id,
                "name": _pretty_name(namespace),
                "full_name": namespace,
                "tags": sorted(tag_names),
                "layer": namespace_to_layer[namespace],
                "pipelines": [pipeline_key],
            }
    """
    @classmethod
    def create_data_node(cls, )

    def add_pipeline(self, pipeline_key: str):
        self.pipelines.append(pipeline_key)


@dataclass
class TaskNode(GraphNode):
    type: str = GraphNodeType.TASK.value


@dataclass
class DataNode(GraphNode):
    type: str = GraphNodeType.DATA.value
