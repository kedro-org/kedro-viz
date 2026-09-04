"""
`kedro_viz.models.flowchart.node_metadata` defines data models to represent
Kedro metadata in a visualization graph.
"""

from abc import ABC
from typing import ClassVar, Dict, List, Optional, Union, cast

from kedro.io.core import AbstractDataset
from kedro.pipeline.node import Node as KedroNode
from pydantic import BaseModel, Field, ValidationInfo, field_validator, model_validator

from .live_node_metadata import (
    get_data_node_filepath,
    get_data_node_preview,
    get_data_node_preview_type,
    get_data_node_type,
    get_task_code,
    get_task_filepath,
    get_task_preview,
    get_transcoded_data_node_filepath,
    get_transcoded_data_node_original_type,
    get_transcoded_data_node_types,
)
from .nodes import DataNode, ParametersNode, TaskNode, TranscodedDataNode


class GraphNodeMetadata(BaseModel, ABC):
    """Represent a graph node's metadata."""


class TaskNodeMetadata(GraphNodeMetadata):
    """Represent the metadata of a TaskNode.

    Args:
        task_node (TaskNode): Task node to which this metadata belongs to.

    Raises:
        AssertionError: If task_node is not supplied during instantiation.
    """

    task_node: TaskNode = Field(..., exclude=True)

    code: Optional[str] = Field(
        default=None,
        validate_default=True,
        description="Source code of the node's function",
    )

    filepath: Optional[str] = Field(
        default=None,
        validate_default=True,
        description="Path to the file where the node is defined",
    )

    parameters: Optional[Dict] = Field(
        default=None,
        validate_default=True,
        description="The parameters of the node, if available",
    )
    run_command: Optional[str] = Field(
        default=None,
        validate_default=True,
        description="The command to run the pipeline to this node",
    )

    inputs: Optional[List[str]] = Field(
        default=None, validate_default=True, description="The inputs to the TaskNode"
    )
    outputs: Optional[List[str]] = Field(
        default=None, validate_default=True, description="The outputs from the TaskNode"
    )

    preview: Optional[Dict] = Field(
        default=None,
        validate_default=True,
        description="Serialized preview payload of the TaskNode",
    )

    @model_validator(mode="before")
    @classmethod
    def check_task_node_exists(cls, values):
        assert "task_node" in values
        return values

    @field_validator("code")
    @classmethod
    def set_code(cls, _, info: ValidationInfo):
        return get_task_code(cast(TaskNode, info.data["task_node"]))

    @field_validator("filepath")
    @classmethod
    def set_filepath(cls, _, info: ValidationInfo):
        return get_task_filepath(cast(TaskNode, info.data["task_node"]))

    @field_validator("parameters")
    @classmethod
    def set_parameters(cls, _, info: ValidationInfo):
        return cast(TaskNode, info.data["task_node"]).parameters

    @field_validator("run_command")
    @classmethod
    def set_run_command(cls, _, info: ValidationInfo):
        task_node = cast(TaskNode, info.data["task_node"])
        kedro_node = cast(KedroNode, task_node.kedro_obj)
        return f"kedro run --to-nodes='{kedro_node.name}'"

    @field_validator("inputs")
    @classmethod
    def set_inputs(cls, _, info: ValidationInfo):
        task_node = cast(TaskNode, info.data["task_node"])
        return cast(KedroNode, task_node.kedro_obj).inputs

    @field_validator("outputs")
    @classmethod
    def set_outputs(cls, _, info: ValidationInfo):
        task_node = cast(TaskNode, info.data["task_node"])
        return cast(KedroNode, task_node.kedro_obj).outputs

    @field_validator("preview")
    @classmethod
    def set_preview(cls, _, info: ValidationInfo):
        return get_task_preview(cast(TaskNode, info.data["task_node"]))


class DataNodeMetadata(GraphNodeMetadata):
    """Represent the metadata of a DataNode.

    Args:
        data_node (DataNode): Data node to which this metadata belongs to.

    Attributes:
        is_all_previews_enabled (bool): Class-level attribute to determine if
            previews are enabled for all nodes. This can be configured via CLI
            or UI to manage the preview settings.

    Raises:
        AssertionError: If data_node is not supplied during instantiation.
    """

    data_node: DataNode = Field(..., exclude=True)

    is_all_previews_enabled: ClassVar[bool] = True

    type: Optional[str] = Field(
        default=None, validate_default=True, description="The type of the data node"
    )

    filepath: Optional[str] = Field(
        default=None,
        validate_default=True,
        description="The path to the actual data file for the underlying dataset",
    )

    run_command: Optional[str] = Field(
        default=None,
        validate_default=True,
        description="Command to run the pipeline to this node",
    )

    preview: Optional[Union[Dict, str]] = Field(
        default=None,
        validate_default=True,
        description="Preview data for the underlying datanode",
    )

    preview_type: Optional[str] = Field(
        default=None,
        validate_default=True,
        description="Type of preview for the dataset",
    )

    stats: Optional[Dict] = Field(
        default=None,
        validate_default=True,
        description="The statistics for the data node.",
    )

    @model_validator(mode="before")
    @classmethod
    def check_data_node_exists(cls, values):
        assert "data_node" in values
        # dataset.release clears the cache before loading to ensure that this issue
        # does not arise: https://github.com/kedro-org/kedro-viz/pull/573.
        data_node = cast(DataNode, values["data_node"])
        cast(AbstractDataset, data_node.kedro_obj).release()
        return values

    @classmethod
    def set_is_all_previews_enabled(cls, value: bool):
        cls.is_all_previews_enabled = value

    @field_validator("type")
    @classmethod
    def set_type(cls, _, info: ValidationInfo):
        return get_data_node_type(cast(DataNode, info.data["data_node"]))

    @field_validator("filepath")
    @classmethod
    def set_filepath(cls, _, info: ValidationInfo):
        return get_data_node_filepath(cast(DataNode, info.data["data_node"]))

    @field_validator("run_command")
    @classmethod
    def set_run_command(cls, _, info: ValidationInfo):
        data_node = cast(DataNode, info.data["data_node"])
        if not data_node.is_free_input:
            return f"kedro run --to-outputs={data_node.name}"
        return None

    @field_validator("preview")
    @classmethod
    def set_preview(cls, _, info: ValidationInfo):
        return get_data_node_preview(
            cast(DataNode, info.data["data_node"]),
            include_previews=cls.is_all_previews_enabled,
        )

    @field_validator("preview_type")
    @classmethod
    def set_preview_type(cls, _, info: ValidationInfo):
        return get_data_node_preview_type(
            cast(DataNode, info.data["data_node"]),
            include_previews=cls.is_all_previews_enabled,
        )

    @field_validator("stats")
    @classmethod
    def set_stats(cls, _, info: ValidationInfo):
        data_node = cast(DataNode, info.data["data_node"])
        return data_node.node_extras and data_node.node_extras.stats


class TranscodedDataNodeMetadata(GraphNodeMetadata):
    """Represent the metadata of a TranscodedDataNode.
    Args:
        transcoded_data_node: The transcoded data node to which this metadata belongs.

    Raises:
        AssertionError: If `transcoded_data_node` is not supplied during instantiation.
    """

    transcoded_data_node: TranscodedDataNode = Field(..., exclude=True)

    # Only available if the dataset has filepath set.
    filepath: Optional[str] = Field(
        default=None,
        validate_default=True,
        description="The path to the actual data file for the underlying dataset",
    )

    run_command: Optional[str] = Field(
        default=None,
        validate_default=True,
        description="Command to run the pipeline to this node",
    )
    original_type: Optional[str] = Field(
        default=None,
        validate_default=True,
        description="The dataset type of the underlying transcoded data node original version",
    )
    transcoded_types: Optional[List[str]] = Field(
        default=None,
        validate_default=True,
        description="The list of all dataset types for the transcoded versions",
    )

    # Statistics for the underlying data node
    stats: Optional[Dict] = Field(
        default=None,
        validate_default=True,
        description="The statistics for the transcoded data node metadata.",
    )

    @model_validator(mode="before")
    @classmethod
    def check_transcoded_data_node_exists(cls, values):
        assert "transcoded_data_node" in values
        return values

    @field_validator("filepath")
    @classmethod
    def set_filepath(cls, _, info: ValidationInfo):
        return get_transcoded_data_node_filepath(
            cast(TranscodedDataNode, info.data["transcoded_data_node"])
        )

    @field_validator("run_command")
    @classmethod
    def set_run_command(cls, _, info: ValidationInfo):
        data_node = cast(TranscodedDataNode, info.data["transcoded_data_node"])
        if not data_node.is_free_input:
            return f"kedro run --to-outputs={data_node.original_name}"
        return None

    @field_validator("original_type")
    @classmethod
    def set_original_type(cls, _, info: ValidationInfo):
        return get_transcoded_data_node_original_type(
            cast(TranscodedDataNode, info.data["transcoded_data_node"])
        )

    @field_validator("transcoded_types")
    @classmethod
    def set_transcoded_types(cls, _, info: ValidationInfo):
        return get_transcoded_data_node_types(
            cast(TranscodedDataNode, info.data["transcoded_data_node"])
        )

    @field_validator("stats")
    @classmethod
    def set_stats(cls, _, info: ValidationInfo):
        data_node = cast(TranscodedDataNode, info.data["transcoded_data_node"])
        return data_node.node_extras and data_node.node_extras.stats


class ParametersNodeMetadata(GraphNodeMetadata):
    """Represent the metadata of a ParametersNode.

    Args:
        parameters_node (ParametersNode): The underlying parameters node
                for the parameters metadata node.

    Raises:
        AssertionError: If parameters_node is not supplied during instantiation.
    """

    parameters_node: ParametersNode = Field(..., exclude=True)
    parameters: Optional[Dict] = Field(
        default=None,
        validate_default=True,
        description="The parameters dictionary for the parameters metadata node",
    )

    @model_validator(mode="before")
    @classmethod
    def check_parameters_node_exists(cls, values):
        assert "parameters_node" in values
        return values

    @field_validator("parameters")
    @classmethod
    def set_parameters(cls, _, info: ValidationInfo):
        parameters_node = cast(ParametersNode, info.data["parameters_node"])
        if parameters_node.is_single_parameter():
            return {parameters_node.parameter_name: parameters_node.parameter_value}
        return parameters_node.parameter_value
