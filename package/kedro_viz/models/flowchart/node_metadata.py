"""
`kedro_viz.models.flowchart.node_metadata` defines data models to represent
Kedro metadata in a visualization graph.
"""

import inspect
import logging
from abc import ABC
from pathlib import Path
from typing import ClassVar, Dict, List, Optional, Union, cast

from kedro.io.core import AbstractDataset
from kedro.pipeline.node import Node as KedroNode
from pydantic import (
    BaseModel,
    Field,
    ValidationInfo,
    field_validator,
    model_validator,
)

from kedro_viz.integrations.utils import UnavailableDataset
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

    @staticmethod
    def _kedro_node(info: ValidationInfo) -> KedroNode:
        # Read from `info.data` (this instance's already-validated fields), not a class
        # attribute: field validators run per instance, so a class attribute would be
        # shared -- and overwritten -- by any other instance built concurrently.
        task_node = cast(TaskNode, info.data["task_node"])
        return cast(KedroNode, task_node.kedro_obj)

    @field_validator("code")
    @classmethod
    def set_code(cls, _, info: ValidationInfo):
        # this is required to handle partial, curry functions
        func = cls._kedro_node(info).func

        if inspect.ismethod(func):
            func = func.__func__

        if inspect.isfunction(func):
            return inspect.getsource(_extract_wrapped_func(func))

        return None

    @field_validator("filepath")
    @classmethod
    def set_filepath(cls, filepath, info: ValidationInfo):
        # this is required to handle partial, curry functions
        func = cls._kedro_node(info).func

        if inspect.ismethod(func):
            func = func.__func__

        if inspect.isfunction(func):
            code_full_path = Path(inspect.getfile(func)).expanduser().resolve()

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
    def set_parameters(cls, _, info: ValidationInfo):
        return cast(TaskNode, info.data["task_node"]).parameters

    @field_validator("run_command")
    @classmethod
    def set_run_command(cls, _, info: ValidationInfo):
        return f"kedro run --to-nodes='{cls._kedro_node(info).name}'"

    @field_validator("inputs")
    @classmethod
    def set_inputs(cls, _, info: ValidationInfo):
        return cls._kedro_node(info).inputs

    @field_validator("outputs")
    @classmethod
    def set_outputs(cls, _, info: ValidationInfo):
        return cls._kedro_node(info).outputs

    @field_validator("preview")
    @classmethod
    def set_preview(cls, _, info: ValidationInfo):
        task_node = cast(TaskNode, info.data["task_node"])
        try:
            task_node_preview_fn = getattr(cls._kedro_node(info), "preview", None)

            # for Kedro versions that do not support preview_fn
            if task_node_preview_fn is None:  # pragma: no cover
                return None

            preview_payload = task_node_preview_fn()

            if preview_payload is None:
                return None

            from kedro.pipeline.preview_contract import (
                ImagePreview,
                MermaidPreview,
                TextPreview,
            )

            if not isinstance(
                preview_payload, (TextPreview, MermaidPreview, ImagePreview)
            ):
                return None

            # serialized payload
            return preview_payload.to_dict()

        except ImportError:  # pragma: no cover
            logger.warning(
                "Task node previews are disabled because this Kedro version "
                "does not provide 'kedro.pipeline.preview_contract'."
            )
            return None

        except Exception as exc:  # noqa: BLE001
            logger.warning(
                "'%s' could not be previewed. Full exception: %s: %s",
                task_node.name,
                type(exc).__name__,
                exc,
            )
            return None


class DataNodeMetadata(GraphNodeMetadata):
    """Represent the metadata of a DataNode.

    Args:
        data_node (DataNode): Data node to which this metadata belongs to.

    Attributes:
        is_all_previews_enabled (bool): Class-level attribute to determine if
            previews are enabled for all nodes. This can be configured via CLI
            or UI to manage the preview settings.
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
    def release_dataset_cache(cls, values):
        # dataset.release clears the cache before loading to ensure that this issue
        # does not arise: https://github.com/kedro-org/kedro-viz/pull/573. Only a side
        # effect on the dataset itself -- nothing is stashed on the class.
        data_node = values.get("data_node") if isinstance(values, dict) else None
        if data_node is not None:
            cast(AbstractDataset, data_node.kedro_obj).release()
        return values

    @classmethod
    def set_is_all_previews_enabled(cls, value: bool):
        cls.is_all_previews_enabled = value

    @staticmethod
    def _dataset(info: ValidationInfo) -> AbstractDataset:
        data_node = cast(DataNode, info.data["data_node"])
        return cast(AbstractDataset, data_node.kedro_obj)

    @field_validator("type")
    @classmethod
    def set_type(cls, _, info: ValidationInfo):
        data_node = cast(DataNode, info.data["data_node"])
        dataset = cls._dataset(info)
        if isinstance(dataset, UnavailableDataset):
            # Logged here, not while a bulk project load happens to touch every
            # dataset, so this only fires for the node actually being requested.
            logger.warning(
                "Kedro-Viz: dataset '%s' could not be loaded and is shown as "
                "unavailable. Install its missing dependency for full functionality:\n%s",
                data_node.name,
                dataset.reason or "unknown error",
            )
        return data_node.dataset_type

    @field_validator("filepath")
    @classmethod
    def set_filepath(cls, _, info: ValidationInfo):
        dataset_description = cls._dataset(info)._describe()
        return _parse_filepath(dataset_description)

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
        data_node = cast(DataNode, info.data["data_node"])
        dataset = cls._dataset(info)
        if (
            not data_node.is_preview_enabled()
            or not hasattr(dataset, "preview")
            or not cls.is_all_previews_enabled
        ):
            return None

        try:
            preview_args = (
                data_node.get_preview_args() if data_node.viz_metadata else None
            )
            if preview_args is None:
                return dataset.preview()
            return dataset.preview(**preview_args)

        except Exception as exc:  # noqa: BLE001
            logger.warning(
                "'%s' could not be previewed. Full exception: %s: %s",
                data_node.name,
                type(exc).__name__,
                exc,
            )
            return None

    @field_validator("preview_type")
    @classmethod
    def set_preview_type(cls, _, info: ValidationInfo):
        data_node = cast(DataNode, info.data["data_node"])
        dataset = cls._dataset(info)
        if (
            not data_node.is_preview_enabled()
            or not hasattr(dataset, "preview")
            or not cls.is_all_previews_enabled
        ):
            return None

        try:
            preview_type_annotation = inspect.signature(
                dataset.preview
            ).return_annotation
            # Attempt to get the name attribute, if it exists.
            # Otherwise, use str to handle the annotation directly.
            return getattr(
                preview_type_annotation, "__name__", str(preview_type_annotation)
            )

        except Exception as exc:  # noqa: BLE001 # pragma: no cover
            logger.warning(
                "'%s' did not have preview type. Full exception: %s: %s",
                data_node.name,
                type(exc).__name__,
                exc,
            )
            return None

    @field_validator("stats")
    @classmethod
    def set_stats(cls, _, info: ValidationInfo):
        data_node = cast(DataNode, info.data["data_node"])
        return data_node.node_extras and data_node.node_extras.stats


class TranscodedDataNodeMetadata(GraphNodeMetadata):
    """Represent the metadata of a TranscodedDataNode.
    Args:
        transcoded_data_node: The transcoded data node to which this metadata belongs.
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

    @field_validator("filepath")
    @classmethod
    def set_filepath(cls, _, info: ValidationInfo):
        node = cast(TranscodedDataNode, info.data["transcoded_data_node"])
        dataset_description = cast(AbstractDataset, node.original_version)._describe()
        return _parse_filepath(dataset_description)

    @field_validator("run_command")
    @classmethod
    def set_run_command(cls, _, info: ValidationInfo):
        node = cast(TranscodedDataNode, info.data["transcoded_data_node"])
        if not node.is_free_input:
            return f"kedro run --to-outputs={node.original_name}"
        return None

    @field_validator("original_type")
    @classmethod
    def set_original_type(cls, _, info: ValidationInfo):
        node = cast(TranscodedDataNode, info.data["transcoded_data_node"])
        return get_dataset_type(cast(AbstractDataset, node.original_version))

    @field_validator("transcoded_types")
    @classmethod
    def set_transcoded_types(cls, _, info: ValidationInfo):
        node = cast(TranscodedDataNode, info.data["transcoded_data_node"])
        return [
            get_dataset_type(transcoded_version)
            for transcoded_version in node.transcoded_versions
        ]

    @field_validator("stats")
    @classmethod
    def set_stats(cls, _, info: ValidationInfo):
        node = cast(TranscodedDataNode, info.data["transcoded_data_node"])
        return node.node_extras and node.node_extras.stats


class ParametersNodeMetadata(GraphNodeMetadata):
    """Represent the metadata of a ParametersNode.

    Args:
        parameters_node (ParametersNode): The underlying parameters node
                for the parameters metadata node.
    """

    parameters_node: ParametersNode = Field(..., exclude=True)
    parameters: Optional[Dict] = Field(
        default=None,
        validate_default=True,
        description="The parameters dictionary for the parameters metadata node",
    )

    @field_validator("parameters")
    @classmethod
    def set_parameters(cls, _, info: ValidationInfo):
        node = cast(ParametersNode, info.data["parameters_node"])
        if node.is_single_parameter():
            return {node.parameter_name: node.parameter_value}
        return node.parameter_value
