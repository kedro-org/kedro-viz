from pydantic import BaseModel

from typing import List, Dict, Optional, Union
from kedro_viz.models import TaskNode
import abc


class BaseAPIResponse(BaseModel, abc.ABC):
    class Config:
        orm_mode = True


class BaseGraphNodeAPIResponse(BaseAPIResponse):
    id: str
    name: str
    full_name: str
    tags: List[str]
    pipelines: List[str]
    modular_pipelines: List[str]
    type: str


class TaskNodeAPIResponse(BaseGraphNodeAPIResponse):
    parameters: Dict


class DataNodeAPIResponse(BaseGraphNodeAPIResponse):
    layer: Optional[str]


class GraphEdgeAPIResponse(BaseAPIResponse):
    source: str
    target: str


class NamedEntityAPIResponse(BaseModel):
    id: str
    name: Optional[str]


class GraphAPIResponse(BaseAPIResponse):
    nodes: List[Union[TaskNodeAPIResponse, DataNodeAPIResponse]]
    edges: List[GraphEdgeAPIResponse]
    tags: List[NamedEntityAPIResponse]
