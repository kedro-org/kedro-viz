"""`kedro_viz.models.flowchart.nodes` defines models to represent Kedro nodes in a viz graph."""

import logging
from abc import ABC
from typing import Any, Dict, Optional, Set, Union, cast

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

from kedro_viz.models.utils import get_dataset_type
from kedro_viz.utils import TRANSCODING_SEPARATOR, _strip_transcoding

from .model_utils import GraphNodeType

logger = logging.getLogger(__name__)


class GraphNode(BaseModel, ABC):
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


class ModularPipelineChild(BaseModel, frozen=True):
    """Represent a child of a modular pipeline.

    Args:
        id (str): Id of the modular pipeline child
        type (GraphNodeType): Type of modular pipeline child
    """

    id: str
    type: GraphNodeType


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
        except Exception as exc:  # noqa: BLE001 # pragma: no cover
            logger.error(
                "An error occurred when loading parameter `%s` in the catalog :: %s",
                self.parameter_name,
                exc,
            )
            return None


class ModularPipelineNode(GraphNode):
    """Represent a modular pipeline node in the graph"""

    # A modular pipeline doesn't belong to any other modular pipeline,
    # in the same sense as other types of GraphNode do.
    # Therefore, it's default to None.
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
