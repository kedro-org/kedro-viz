"""
`kedro_viz.models.flowchart.node_metadata` defines data models to represent
Kedro metadata in a visualization graph.
"""

import inspect
import logging
from abc import ABC
from pathlib import Path
from typing import ClassVar, Dict, List, Optional, Union, cast

from kedro.pipeline.node import Node as KedroNode
from pydantic import BaseModel, Field, field_validator, model_validator

try:
    # kedro 0.18.12 onwards
    from kedro.io.core import AbstractDataset
except ImportError:  # pragma: no cover
    # older versions
    from kedro.io.core import AbstractDataSet as AbstractDataset  # type: ignore

from kedro_viz.models.utils import get_dataset_type

from .model_utils import _extract_wrapped_func, _parse_filepath
from .nodes import DataNode, ParametersNode, TaskNode, TranscodedDataNode

logger = logging.getLogger(__name__)


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

    @model_validator(mode="before")
    @classmethod
    def check_task_node_exists(cls, values):
        assert "task_node" in values
        cls.set_task_and_kedro_node(values["task_node"])
        return values

    @classmethod
    def set_task_and_kedro_node(cls, task_node):
        cls.task_node = task_node
        cls.kedro_node = cast(KedroNode, task_node.kedro_obj)

    @field_validator("code")
    @classmethod
    def set_code(cls, code):
        # this is required to handle partial, curry functions
        if inspect.isfunction(cls.kedro_node.func):
            code = inspect.getsource(_extract_wrapped_func(cls.kedro_node.func))
            return code

        return None

    @field_validator("filepath")
    @classmethod
    def set_filepath(cls, filepath):
        # this is required to handle partial, curry functions
        if inspect.isfunction(cls.kedro_node.func):
            code_full_path = (
                Path(inspect.getfile(cls.kedro_node.func)).expanduser().resolve()
            )

            try:
                filepath = code_full_path.relative_to(Path.cwd().parent)
            except ValueError:  # pragma: no cover
                # if the filepath can't be resolved relative to the current directory,
                # e.g. either during tests or during launching development server
                # outside of a Kedro project, simply return the fullpath to the file.
                filepath = code_full_path

            return str(filepath)

        return None

    @field_validator("parameters")
    @classmethod
    def set_parameters(cls, _):
        return cls.task_node.parameters

    @field_validator("run_command")
    @classmethod
    def set_run_command(cls, _):
        return f"kedro run --to-nodes='{cls.kedro_node.name}'"

    @field_validator("inputs")
    @classmethod
    def set_inputs(cls, _):
        return cls.kedro_node.inputs

    @field_validator("outputs")
    @classmethod
    def set_outputs(cls, _):
        return cls.kedro_node.outputs


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
        cls.set_data_node_and_dataset(values["data_node"])
        return values

    @classmethod
    def set_is_all_previews_enabled(cls, value: bool):
        cls.is_all_previews_enabled = value

    @classmethod
    def set_data_node_and_dataset(cls, data_node):
        cls.data_node = data_node
        cls.dataset = cast(AbstractDataset, data_node.kedro_obj)

        # dataset.release clears the cache before loading to ensure that this issue
        # does not arise: https://github.com/kedro-org/kedro-viz/pull/573.
        cls.dataset.release()

    @field_validator("type")
    @classmethod
    def set_type(cls, _):
        return cls.data_node.dataset_type

    @field_validator("filepath")
    @classmethod
    def set_filepath(cls, _):
        dataset_description = cls.dataset._describe()
        return _parse_filepath(dataset_description)

    @field_validator("run_command")
    @classmethod
    def set_run_command(cls, _):
        if not cls.data_node.is_free_input:
            return f"kedro run --to-outputs={cls.data_node.name}"
        return None

    @field_validator("preview")
    @classmethod
    def set_preview(cls, _):
        if (
            not cls.data_node.is_preview_enabled()
            or not hasattr(cls.dataset, "preview")
            or not cls.is_all_previews_enabled
        ):
            return None

        try:
            preview_args = (
                cls.data_node.get_preview_args() if cls.data_node.viz_metadata else None
            )
            if preview_args is None:
                return cls.dataset.preview()
            return cls.dataset.preview(**preview_args)

        except Exception as exc:  # noqa: BLE001
            logger.warning(
                "'%s' could not be previewed. Full exception: %s: %s",
                cls.data_node.name,
                type(exc).__name__,
                exc,
            )
            return None

    @field_validator("preview_type")
    @classmethod
    def set_preview_type(cls, _):
        if (
            not cls.data_node.is_preview_enabled()
            or not hasattr(cls.dataset, "preview")
            or not cls.is_all_previews_enabled
        ):
            return None

        try:
            preview_type_annotation = inspect.signature(
                cls.dataset.preview
            ).return_annotation
            # Attempt to get the name attribute, if it exists.
            # Otherwise, use str to handle the annotation directly.
            preview_type_name = getattr(
                preview_type_annotation, "__name__", str(preview_type_annotation)
            )
            return preview_type_name

        except Exception as exc:  # noqa: BLE001 # pragma: no cover
            logger.warning(
                "'%s' did not have preview type. Full exception: %s: %s",
                cls.data_node.name,
                type(exc).__name__,
                exc,
            )
            return None

    @field_validator("stats")
    @classmethod
    def set_stats(cls, _):
        return cls.data_node.stats


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
        cls.transcoded_data_node = values["transcoded_data_node"]
        return values

    @field_validator("filepath")
    @classmethod
    def set_filepath(cls, _):
        dataset_description = cls.transcoded_data_node.original_version._describe()
        return _parse_filepath(dataset_description)

    @field_validator("run_command")
    @classmethod
    def set_run_command(cls, _):
        if not cls.transcoded_data_node.is_free_input:
            return f"kedro run --to-outputs={cls.transcoded_data_node.original_name}"
        return None

    @field_validator("original_type")
    @classmethod
    def set_original_type(cls, _):
        return get_dataset_type(cls.transcoded_data_node.original_version)

    @field_validator("transcoded_types")
    @classmethod
    def set_transcoded_types(cls, _):
        return [
            get_dataset_type(transcoded_version)
            for transcoded_version in cls.transcoded_data_node.transcoded_versions
        ]

    @field_validator("stats")
    @classmethod
    def set_stats(cls, _):
        return cls.transcoded_data_node.stats


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
        cls.parameters_node = values["parameters_node"]
        return values

    @field_validator("parameters")
    @classmethod
    def set_parameters(cls, _):
        if cls.parameters_node.is_single_parameter():
            return {
                cls.parameters_node.parameter_name: cls.parameters_node.parameter_value
            }
        return cls.parameters_node.parameter_value
