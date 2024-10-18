# kedro_viz/models/metadata.py

from abc import ABC
from pydantic import BaseModel, Field, ValidationInfo, field_validator, model_validator
from typing import Optional, Dict, Any, Union, List, ClassVar, cast
import logging

try:
    # kedro 0.18.11 onwards
    from kedro.io.core import DatasetError
except ImportError:  # pragma: no cover
    # older versions
    from kedro.io.core import DataSetError as DatasetError  # type: ignore

try:
    # kedro 0.18.12 onwards
    from kedro.io.core import AbstractDataset
except ImportError:  # pragma: no cover
    # older versions
    from kedro.io.core import AbstractDataSet as AbstractDataset  # type: ignore

from .nodes import TaskNode, DataNode, TranscodedDataNode, ParametersNode
from .utils import _extract_wrapped_func, _parse_filepath, get_dataset_type

logger = logging.getLogger(__name__)


class GraphNodeMetadata(BaseModel, ABC):
    """Abstract base class representing metadata of a graph node."""


class TaskNodeMetadata(GraphNodeMetadata):
    """Represent the metadata of a TaskNode."""

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
        if inspect.isfunction(cls.kedro_node.func):
            code = inspect.getsource(_extract_wrapped_func(cls.kedro_node.func))
            return code
        return None

    @field_validator("filepath")
    @classmethod
    def set_filepath(cls, filepath):
        if inspect.isfunction(cls.kedro_node.func):
            code_full_path = (
                Path(inspect.getfile(cls.kedro_node.func)).expanduser().resolve()
            )

            try:
                filepath = code_full_path.relative_to(Path.cwd().parent)
            except ValueError:
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
    """Represent the metadata of a DataNode."""

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
        description="Preview data for the underlying data node",
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

        except Exception as exc:
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
            preview_type_name = getattr(
                preview_type_annotation, "__name__", str(preview_type_annotation)
            )
            return preview_type_name

        except Exception as exc:
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
    """Represent the metadata of a TranscodedDataNode."""

    transcoded_data_node: TranscodedDataNode = Field(..., exclude=True)
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
        description="The dataset type of the original version",
    )
    transcoded_types: Optional[List[str]] = Field(
        default=None,
        validate_default=True,
        description="The list of all dataset types for the transcoded versions",
    )
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
    """Represent the metadata of a ParametersNode."""

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
