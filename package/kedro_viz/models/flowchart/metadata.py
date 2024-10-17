from pydantic import BaseModel, Field
from typing import Optional, Dict, Union, ClassVar
from pathlib import Path
import inspect
from kedro.pipeline.node import Node as KedroNode
from kedro.io.core import AbstractDataset
from kedro_viz.models.utils import get_dataset_type
from kedro_viz.models.flowchart.nodes import TaskNode, DataNode, TranscodedDataNode, ParametersNode
from kedro_viz.utils import _parse_filepath

class GraphNodeMetadata(BaseModel):
    """Base class for node metadata."""

class TaskNodeMetadata(GraphNodeMetadata):
    """Represent the metadata of a TaskNode."""

    task_node: TaskNode = Field(..., exclude=True)
    code: Optional[str] = Field(default=None)
    filepath: Optional[str] = Field(default=None)

    @classmethod
    def set_code(cls, _):
        if inspect.isfunction(cls.task_node.kedro_obj.func):
            return inspect.getsource(cls.task_node.kedro_obj.func)
        return None

    @classmethod
    def set_filepath(cls, _):
        if inspect.isfunction(cls.task_node.kedro_obj.func):
            return str(Path(inspect.getfile(cls.task_node.kedro_obj.func)))
        return None

class DataNodeMetadata(GraphNodeMetadata):
    """Represent the metadata of a DataNode."""

    data_node: DataNode = Field(..., exclude=True)
    filepath: Optional[str] = Field(default=None)
    preview: Optional[Union[Dict, str]] = Field(default=None)

    @classmethod
    def set_filepath(cls, _):
        return _parse_filepath(cls.data_node.kedro_obj._describe())

class TranscodedDataNodeMetadata(GraphNodeMetadata):
    """Represent the metadata of a TranscodedDataNode."""

    transcoded_data_node: TranscodedDataNode = Field(..., exclude=True)
    filepath: Optional[str] = Field(default=None)

    @classmethod
    def set_filepath(cls, _):
        return _parse_filepath(cls.transcoded_data_node.original_version._describe())

class ParametersNodeMetadata(GraphNodeMetadata):
    """Represent the metadata of a ParametersNode."""

    parameters_node: ParametersNode = Field(..., exclude=True)
    parameters: Optional[Dict] = Field(default=None)

    @classmethod
    def set_parameters(cls, _):
        if cls.parameters_node.is_single_parameter():
            return {cls.parameters_node.parameter_name: cls.parameters_node.parameter_value}
        return cls.parameters_node.parameter_value
