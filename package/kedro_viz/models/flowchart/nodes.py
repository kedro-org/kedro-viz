from abc import ABC
from pydantic import (
    BaseModel,
    Field,
    ConfigDict,
    ValidationInfo,
    field_validator,
    model_validator,
)
from typing import Optional, Set, Union, Dict, Any, ClassVar, List, cast
from fastapi.encoders import jsonable_encoder
import logging

try:
    # kedro 0.18.11 onwards
    from kedro.pipeline.node import Node as KedroNode
except ImportError:  # pragma: no cover
    # Handle older versions or custom implementations
    KedroNode = Any  # Replace with appropriate import or definition

try:
    # kedro 0.18.12 onwards
    from kedro.io.core import AbstractDataset
except ImportError:  # pragma: no cover
    # older versions
    from kedro.io.core import AbstractDataSet as AbstractDataset  # type: ignore

from .entities import NamedEntity
from .enums import GraphNodeType
from .utils import _parse_filepath, _extract_wrapped_func, get_dataset_type
from kedro_viz.utils import TRANSCODING_SEPARATOR, _strip_transcoding
from .modular_pipelines import ModularPipelineChild

logger = logging.getLogger(__name__)


class GraphNode(BaseModel, ABC):
    """Abstract base class representing a node in the graph."""

    id: str
    name: str
    type: str
    tags: Set[str] = Field(set())
    kedro_obj: Optional[Union[KedroNode, AbstractDataset]] = Field(
        None,
        description="The underlying Kedro object for each graph node, if any",
        exclude=True,
    )
    pipelines: Set[str] = Field(set())
    modular_pipelines: Optional[Set[str]] = Field(
        default=None,
        validate_default=True,
    )
    model_config = ConfigDict(arbitrary_types_allowed=True)

    @classmethod
    def create_task_node(
        cls, node: KedroNode, node_id: str, modular_pipelines: Optional[Set[str]]
    ) -> "TaskNode":
        node_name = node._name or node._func_name
        return TaskNode(
            id=node_id,
            name=node_name,
            tags=set(node.tags),
            kedro_obj=node,
            modular_pipelines=modular_pipelines,
        )

    @classmethod
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
    def create_parameters_node(
        cls,
        dataset_id: str,
        dataset_name: str,
        layer: Optional[str],
        tags: Set[str],
        parameters: AbstractDataset,
        modular_pipelines: Optional[Set[str]],
    ) -> "ParametersNode":
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
        return ModularPipelineNode(id=modular_pipeline_id, name=modular_pipeline_id)

    def add_pipeline(self, pipeline_id: str):
        self.pipelines.add(pipeline_id)

    def belongs_to_pipeline(self, pipeline_id: str) -> bool:
        return pipeline_id in self.pipelines

    def has_metadata(self) -> bool:
        return self.kedro_obj is not None


class TaskNode(GraphNode):
    """Represent a graph node of type task."""

    parameters: Dict = Field(
        {}, description="A dictionary of parameter values for the task node"
    )
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


class DataNode(GraphNode):
    """Represent a graph node of type data."""

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
        return self.viz_metadata.get("preview_args", None)

    def is_preview_enabled(self):
        return (
            self.viz_metadata is None or self.viz_metadata.get("preview") is not False
        )


class TranscodedDataNode(GraphNode):
    """Represent a graph node of type data for transcoded datasets."""

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
    transcoded_versions: Set[AbstractDataset] = Field(
        set(), description="The transcoded versions of the data nodes"
    )
    type: str = GraphNodeType.DATA.value

    def has_metadata(self) -> bool:
        return True


class ParametersNode(GraphNode):
    """Represent a graph node of type parameters."""

    layer: Optional[str] = Field(
        None, description="The layer that this parameters node belongs to"
    )
    type: str = GraphNodeType.PARAMETERS.value

    @model_validator(mode="before")
    @classmethod
    def check_kedro_obj_and_name_exists(cls, values):
        assert "kedro_obj" in values
        assert "name" in values
        return values

    def is_all_parameters(self) -> bool:
        return self.name == "parameters"

    def is_single_parameter(self) -> bool:
        return not self.is_all_parameters()

    @property
    def parameter_name(self) -> str:
        return self.name.replace("params:", "")

    @property
    def parameter_value(self) -> Any:
        if not (self.kedro_obj and hasattr(self.kedro_obj, "load")):
            return None

        try:
            actual_parameter_value = self.kedro_obj.load()
            return jsonable_encoder(actual_parameter_value)
        except (TypeError, ValueError, RecursionError):
            return str(actual_parameter_value)
        except Exception as exc:
            logger.error(
                "An error occurred when loading parameter `%s` in the catalog :: %s",
                self.parameter_name,
                exc,
            )
            return None


class ModularPipelineNode(GraphNode):
    """Represent a modular pipeline node in the graph."""

    modular_pipelines: Optional[Set[str]] = None
    children: Set[ModularPipelineChild] = Field(
        set(), description="The children for the modular pipeline node"
    )
    inputs: Set[str] = Field(
        set(), description="The input datasets to the modular pipeline node"
    )
    outputs: Set[str] = Field(
        set(), description="The output datasets from the modular pipeline node"
    )
    type: str = GraphNodeType.MODULAR_PIPELINE.value
