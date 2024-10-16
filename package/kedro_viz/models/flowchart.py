"""`kedro_viz.models.flowchart` defines data models to represent Kedro entities in a viz graph."""

# pylint: disable=protected-access, missing-function-docstring
import abc
import inspect
import logging
from enum import Enum
from pathlib import Path
from types import FunctionType
from typing import Any, ClassVar, Dict, List, Optional, Set, Union, cast

from fastapi.encoders import jsonable_encoder
from kedro.pipeline.node import Node as KedroNode
from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    ValidationInfo,
    field_validator,
    model_validator,
)

from kedro_viz.models.utils import get_dataset_type
from kedro_viz.utils import TRANSCODING_SEPARATOR, _strip_transcoding

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

logger = logging.getLogger(__name__)


def _parse_filepath(dataset_description: Dict[str, Any]) -> Optional[str]:
    filepath = dataset_description.get("filepath") or dataset_description.get("path")
    return str(filepath) if filepath else None


class NamedEntity(BaseModel):
    """Represent a named entity (Tag/Registered Pipeline) in a Kedro project
    Args:
        id (str): Id of the registered pipeline

    Raises:
        AssertionError: If id is not supplied during instantiation
    """

    id: str
    name: Optional[str] = Field(
        default=None,
        validate_default=True,
        description="The name of the registered pipeline",
    )

    @field_validator("name")
    @classmethod
    def set_name(cls, _, info: ValidationInfo):
        assert "id" in info.data
        return info.data["id"]


class RegisteredPipeline(NamedEntity):
    """Represent a registered pipeline in a Kedro project"""


class GraphNodeType(str, Enum):
    """Represent all possible node types in the graph representation of a Kedro pipeline.
    The type needs to inherit from str as well so FastAPI can serialise it. See:
    https://fastapi.tiangolo.com/tutorial/path-params/#working-with-python-enumerations
    """

    TASK = "task"
    DATA = "data"
    PARAMETERS = "parameters"
    MODULAR_PIPELINE = (
        "modularPipeline"  # camelCase so it can be referred directly to in the frontend
    )


class ModularPipelineChild(BaseModel, frozen=True):
    """Represent a child of a modular pipeline.

    Args:
        id (str): Id of the modular pipeline child
        type (GraphNodeType): Type of modular pipeline child
    """

    id: str
    type: GraphNodeType


class Tag(NamedEntity):
    """Represent a tag in a Kedro project"""

    def __hash__(self) -> int:
        return hash(self.id)


class GraphNode(BaseModel, abc.ABC):
    """Represent a node in the graph representation of a Kedro pipeline.
    All node models except the metadata node models should inherit from this class

    Args:
        id (str): A unique identifier for the node in the graph,
                obtained by hashing the node's string representation.
        name (str): The full name of this node obtained from the underlying Kedro object
        type (str): The type of the graph node
        tags (Set[str]): The tags associated with this node. Defaults to `set()`.
        kedro_obj (Optional[Union[KedroNode, AbstractDataset]]): The underlying Kedro object
                for each graph node, if any. Defaults to `None`.
        pipelines (Set[str]): The set of registered pipeline IDs this
                node belongs to. Defaults to `set()`.
        modular_pipelines (Optional[Set(str)]): A set of modular pipeline names
                this node belongs to.

    """

    id: str
    name: str
    type: str
    tags: Set[str] = Field(set(), description="The tags associated with this node")
    kedro_obj: Optional[Union[KedroNode, AbstractDataset]] = Field(
        None,
        description="The underlying Kedro object for each graph node, if any",
        exclude=True,
    )
    pipelines: Set[str] = Field(
        set(), description="The set of registered pipeline IDs this node belongs to"
    )

    modular_pipelines: Optional[Set[str]] = Field(
        default=None,
        validate_default=True,
        description="The modular_pipelines this node belongs to",
    )
    model_config = ConfigDict(arbitrary_types_allowed=True)

    @classmethod
    def create_task_node(
        cls, node: KedroNode, node_id: str, modular_pipelines: Optional[Set[str]]
    ) -> "TaskNode":
        """Create a graph node of type task for a given Kedro Node instance.
        Args:
            node: A node in a Kedro pipeline.
            node_id: Id of the task node.
            modular_pipelines: A set of modular_pipeline_ids the node belongs to.
        Returns:
            An instance of TaskNode.
        """
        node_name = node._name or node._func_name
        return TaskNode(
            id=node_id,
            name=node_name,
            tags=set(node.tags),
            kedro_obj=node,
            modular_pipelines=modular_pipelines,
        )

    @classmethod
    # pylint: disable=too-many-positional-arguments
    def create_data_node(
        cls,
        dataset_id: str,
        dataset_name: str,
        layer: Optional[str],
        tags: Set[str],
        dataset: AbstractDataset,
        stats: Optional[Dict],
        modular_pipelines: Optional[Set[str]],
        is_free_input: bool = False,
    ) -> Union["DataNode", "TranscodedDataNode"]:
        """Create a graph node of type data for a given Kedro Dataset instance.
        Args:
            dataset_id: A hashed id for the dataset node
            dataset_name: The name of the dataset, including namespace, e.g.
                data_science.master_table.
            layer: The optional layer that the dataset belongs to.
            tags: The set of tags assigned to assign to the graph representation
                of this dataset. N.B. currently it's derived from the node's tags.
            dataset: A dataset in a Kedro pipeline.
            stats: The dictionary of dataset statistics, e.g.
                {"rows":2, "columns":3, "file_size":100}
            modular_pipelines: A set of modular_pipeline_ids the node belongs to.
            is_free_input: Whether the dataset is a free input in the pipeline
        Returns:
            An instance of DataNode.
        """
        is_transcoded_dataset = TRANSCODING_SEPARATOR in dataset_name
        if is_transcoded_dataset:
            name = _strip_transcoding(dataset_name)
            return TranscodedDataNode(
                id=dataset_id,
                name=name,
                tags=tags,
                layer=layer,
                is_free_input=is_free_input,
                stats=stats,
                modular_pipelines=modular_pipelines,
            )

        return DataNode(
            id=dataset_id,
            name=dataset_name,
            tags=tags,
            layer=layer,
            kedro_obj=dataset,
            is_free_input=is_free_input,
            stats=stats,
            modular_pipelines=modular_pipelines,
        )

    @classmethod
    # pylint: disable=too-many-positional-arguments
    def create_parameters_node(
        cls,
        dataset_id: str,
        dataset_name: str,
        layer: Optional[str],
        tags: Set[str],
        parameters: AbstractDataset,
        modular_pipelines: Optional[Set[str]],
    ) -> "ParametersNode":
        """Create a graph node of type parameters for a given Kedro parameters dataset instance.
        Args:
            dataset_id: A hashed id for the parameters node
            dataset_name: The name of the dataset, including namespace, e.g.
                data_science.test_split_ratio
            layer: The optional layer that the parameters belong to.
            tags: The set of tags assigned to assign to the graph representation
                of this dataset. N.B. currently it's derived from the node's tags.
            parameters: A parameters dataset in a Kedro pipeline.
            modular_pipelines: A set of modular_pipeline_ids the node belongs to.
        Returns:
            An instance of ParametersNode.
        """
        return ParametersNode(
            id=dataset_id,
            name=dataset_name,
            tags=tags,
            layer=layer,
            kedro_obj=parameters,
            modular_pipelines=modular_pipelines,
        )

    @classmethod
    def create_modular_pipeline_node(
        cls, modular_pipeline_id: str
    ) -> "ModularPipelineNode":
        """Create a graph node of type modularPipeline for a given modular pipeline ID.
        This is used to visualise all modular pipelines in a Kedro project on the graph.
        Args:
            modular_pipeline_id: The ID of the modular pipeline to convert into a graph node.
        Returns:
            An instance of ModularPipelineNode.
        Example:
            >>> node = GraphNode.create_modular_pipeline_node("pipeline.data_science")
            >>> assert node.id == "pipeline.data_science"
            >>> assert node.name == "pipeline.data_science"
            >>> assert node.type == GraphNodeType.MODULAR_PIPELINE
        """
        return ModularPipelineNode(id=modular_pipeline_id, name=modular_pipeline_id)

    def add_pipeline(self, pipeline_id: str):
        """Add a pipeline_id to the list of pipelines that this node belongs to."""
        self.pipelines.add(pipeline_id)

    def belongs_to_pipeline(self, pipeline_id: str) -> bool:
        """Check whether this graph node belongs to a given pipeline_id."""
        return pipeline_id in self.pipelines

    def has_metadata(self) -> bool:
        """Check whether this graph node has metadata.
        Since metadata of a graph node is derived from the underlying Kedro object,
        we just need to check whether the underlying object exists.
        """
        return self.kedro_obj is not None


class GraphNodeMetadata(BaseModel, abc.ABC):
    """Represent a graph node's metadata"""


class TaskNode(GraphNode):
    """Represent a graph node of type task

    Raises:
        AssertionError: If kedro_obj is not supplied during instantiation
    """

    parameters: Dict = Field(
        {}, description="A dictionary of parameter values for the task node"
    )

    # The type for Task node
    type: str = GraphNodeType.TASK.value

    namespace: Optional[str] = Field(
        default=None,
        validate_default=True,
        description="The original namespace on this node",
    )

    @model_validator(mode="before")
    @classmethod
    def check_kedro_obj_exists(cls, values):
        assert "kedro_obj" in values
        return values

    @field_validator("namespace")
    @classmethod
    def set_namespace(cls, _, info: ValidationInfo):
        return info.data["kedro_obj"].namespace


def _extract_wrapped_func(func: FunctionType) -> FunctionType:
    """Extract a wrapped decorated function to inspect the source code if available.
    Adapted from https://stackoverflow.com/a/43506509/1684058
    """
    if func.__closure__ is None:
        return func
    closure = (c.cell_contents for c in func.__closure__)
    wrapped_func = next((c for c in closure if isinstance(c, FunctionType)), None)
    # return the original function if it's not a decorated function
    return func if wrapped_func is None else wrapped_func


class ModularPipelineNode(GraphNode):
    """Represent a modular pipeline node in the graph"""

    # A modular pipeline doesn't belong to any other modular pipeline,
    # in the same sense as other types of GraphNode do.
    # Therefore it's default to None.
    # The parent-child relationship between modular pipeline themselves is modelled explicitly.
    modular_pipelines: Optional[Set[str]] = None

    # Model the modular pipelines tree using a child-references representation of a tree.
    # See: https://docs.mongodb.com/manual/tutorial/model-tree-structures-with-child-references/
    # for more details.
    # For example, if a node namespace is "uk.data_science",
    # the "uk" modular pipeline node's children are ["uk.data_science"]
    children: Set[ModularPipelineChild] = Field(
        set(), description="The children for the modular pipeline node"
    )

    inputs: Set[str] = Field(
        set(), description="The input datasets to the modular pipeline node"
    )

    outputs: Set[str] = Field(
        set(), description="The output datasets from the modular pipeline node"
    )

    # The type for Modular Pipeline Node
    type: str = GraphNodeType.MODULAR_PIPELINE.value


class TaskNodeMetadata(GraphNodeMetadata):
    """Represent the metadata of a TaskNode

    Args:
        task_node (TaskNode): Task node to which this metadata belongs to.

    Raises:
        AssertionError: If task_node is not supplied during instantiation
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


# pylint: disable=missing-function-docstring
class DataNode(GraphNode):
    """Represent a graph node of type data

    Args:
        layer (Optional[str]): The layer that this data node belongs to. Defaults to `None`.
        is_free_input (bool): Determines whether the data node is a free input. Defaults to `False`.
        stats (Optional[Dict]): Statistics for the data node. Defaults to `None`.

    Raises:
        AssertionError: If kedro_obj, name are not supplied during instantiation
    """

    layer: Optional[str] = Field(
        None, description="The layer that this data node belongs to"
    )
    is_free_input: bool = Field(
        False, description="Determines whether the data node is a free input"
    )
    stats: Optional[Dict] = Field(None, description="The statistics for the data node.")

    dataset_type: Optional[str] = Field(
        default=None,
        validate_default=True,
        description="The concrete type of the underlying kedro_obj",
    )

    viz_metadata: Optional[Dict] = Field(
        default=None, validate_default=True, description="The metadata for data node"
    )

    run_command: Optional[str] = Field(
        None, description="The command to run the pipeline to this node"
    )

    # The type for data node
    type: str = GraphNodeType.DATA.value

    @model_validator(mode="before")
    @classmethod
    def check_kedro_obj_exists(cls, values):
        assert "kedro_obj" in values
        return values

    @field_validator("dataset_type")
    @classmethod
    def set_dataset_type(cls, _, info: ValidationInfo):
        kedro_obj = cast(AbstractDataset, info.data.get("kedro_obj"))
        return get_dataset_type(kedro_obj)

    @field_validator("viz_metadata")
    @classmethod
    def set_viz_metadata(cls, _, info: ValidationInfo):
        kedro_obj = cast(AbstractDataset, info.data.get("kedro_obj"))

        if hasattr(kedro_obj, "metadata") and kedro_obj.metadata:
            return kedro_obj.metadata.get("kedro-viz", None)

        return None

    def get_preview_args(self):
        """Gets the preview arguments for a dataset"""
        return self.viz_metadata.get("preview_args", None)

    def is_preview_enabled(self):
        """Checks if the dataset has a preview enabled at the node level."""
        return (
            self.viz_metadata is None or self.viz_metadata.get("preview") is not False
        )


class TranscodedDataNode(GraphNode):
    """Represent a graph node of type data

    Args:
        layer (Optional[str]): The layer that this transcoded data
                node belongs to. Defaults to `None`.
        is_free_input (bool): Determines whether the transcoded data
                node is a free input. Defaults to `False`.
        stats (Optional[Dict]): Statistics for the data node

    Raises:
        AssertionError: If name is not supplied during instantiation

    """

    layer: Optional[str] = Field(
        None, description="The layer that this transcoded data node belongs to"
    )
    is_free_input: bool = Field(
        False, description="Determines whether the transcoded data node is a free input"
    )
    stats: Optional[Dict] = Field(None, description="The statistics for the data node.")
    original_version: Optional[AbstractDataset] = Field(
        None,
        description="The original Kedro's AbstractDataset for this transcoded data node",
    )
    original_name: Optional[str] = Field(
        None, description="The original name for the generated run command"
    )

    run_command: Optional[str] = Field(
        None, description="The command to run the pipeline to this node"
    )
    # The transcoded versions of the transcoded data nodes.
    transcoded_versions: Set[AbstractDataset] = Field(
        set(), description="The transcoded versions of the transcoded data nodes"
    )

    # The type for data node
    type: str = GraphNodeType.DATA.value

    def has_metadata(self) -> bool:
        return True


class DataNodeMetadata(GraphNodeMetadata):
    """Represent the metadata of a DataNode

    Args:
        data_node (DataNode): Data node to which this metadata belongs to.

    Attributes:
        is_all_previews_enabled (bool): Class-level attribute to determine if
            previews are enabled for all nodes. This can be configured via CLI
            or UI to manage the preview settings.

    Raises:
        AssertionError: If data_node is not supplied during instantiation
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

        except Exception as exc:  # pylint: disable=broad-except
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

        except Exception as exc:  # pylint: disable=broad-except # pragma: no cover
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
    """Represent the metadata of a TranscodedDataNode
    Args:
        transcoded_data_node (TranscodedDataNode): The underlying transcoded
                data node to which this metadata belongs to.

    Raises:
        AssertionError: If transcoded_data_node is not supplied during instantiation
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


class ParametersNode(GraphNode):
    """Represent a graph node of type parameters
    Args:
        layer (Optional[str]): The layer that this parameters node belongs to. Defaults to `None`.

    Raises:
        AssertionError: If kedro_obj, name are not supplied during instantiation
    """

    layer: Optional[str] = Field(
        None, description="The layer that this parameters node belongs to"
    )

    # The type for Parameters Node
    type: str = GraphNodeType.PARAMETERS.value

    @model_validator(mode="before")
    @classmethod
    def check_kedro_obj_and_name_exists(cls, values):
        assert "kedro_obj" in values
        assert "name" in values
        return values

    def is_all_parameters(self) -> bool:
        """Check whether the graph node represent all parameters in the pipeline"""
        return self.name == "parameters"

    def is_single_parameter(self) -> bool:
        """Check whether the graph node represent a single parameter in the pipeline"""
        return not self.is_all_parameters()

    @property
    def parameter_name(self) -> str:
        """Get a normalised parameter name without the "params:" prefix"""
        return self.name.replace("params:", "")

    @property
    def parameter_value(self) -> Any:
        """Load the parameter value from the underlying dataset"""
        if not (self.kedro_obj and hasattr(self.kedro_obj, "load")):
            return None

        try:
            actual_parameter_value = self.kedro_obj.load()
            # Return only json serializable value
            return jsonable_encoder(actual_parameter_value)
        except (TypeError, ValueError, RecursionError):
            # In case the parameter is not JSON serializable,
            # return the string representation
            return str(actual_parameter_value)
        except (AttributeError, DatasetError):
            # This except clause triggers if the user passes a parameter that is not
            # defined in the catalog (DatasetError) it also catches any case where
            # the kedro_obj is None (AttributeError) -- GH#1231
            logger.warning(
                "Cannot find parameter `%s` in the catalog.", self.parameter_name
            )
            return None
        # pylint: disable=broad-exception-caught
        except Exception as exc:  # pragma: no cover
            logger.error(
                "An error occurred when loading parameter `%s` in the catalog :: %s",
                self.parameter_name,
                exc,
            )
            return None


class ParametersNodeMetadata(GraphNodeMetadata):
    """Represent the metadata of a ParametersNode

    Args:
        parameters_node (ParametersNode): The underlying parameters node
                for the parameters metadata node.

    Raises:
        AssertionError: If parameters_node is not supplied during instantiation
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


class GraphEdge(BaseModel, frozen=True):
    """Represent an edge in the graph

    Args:
        source (str): The id of the source node.
        target (str): The id of the target node.
    """

    source: str
    target: str
