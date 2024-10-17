from abc import ABC
from pydantic import BaseModel, Field
from typing import Set, Optional, Dict, Union
from kedro.pipeline.node import Node as KedroNode
from kedro.io.core import AbstractDataset
from kedro_viz.utils import TRANSCODING_SEPARATOR, _strip_transcoding


class GraphNode(BaseModel, ABC):
    """Represent a node in the graph representation of a Kedro pipeline."""

    id: str
    name: str
    type: str
    tags: Set[str] = Field(set())
    kedro_obj: Optional[Union[KedroNode, AbstractDataset]] = Field(None, exclude=True)
    pipelines: Set[str] = Field(set())
    modular_pipelines: Optional[Set[str]] = Field(default=None)

    @classmethod
    def create_task_node(
            cls, node: KedroNode, node_id: str, modular_pipelines: Optional[Set[str]]
    ) -> "TaskNode":
        """Create a graph node of type task for a given Kedro Node instance."""
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
        """Create a graph node of type data for a given Kedro Dataset instance."""
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


class TaskNode(GraphNode):
    """Represent a graph node of type task."""

    parameters: Dict = Field({}, description="A dictionary of parameter values")
    type: str = "task"


class DataNode(GraphNode):
    """Represent a graph node of type data."""

    layer: Optional[str] = Field(None)
    is_free_input: bool = Field(False)
    stats: Optional[Dict] = Field(None)


class TranscodedDataNode(GraphNode):
    """Represent a graph node of type transcoded data."""

    layer: Optional[str] = Field(None)
    is_free_input: bool = Field(False)
    stats: Optional[Dict] = Field(None)
    original_version: Optional[AbstractDataset] = Field(
        None, description="The original Kedro's AbstractDataset for this transcoded data node"
    )
    original_name: Optional[str] = Field(
        None, description="The original name for the generated run command"
    )
    transcoded_versions: Set[AbstractDataset] = Field(
        set(), description="The transcoded versions of the transcoded data nodes"
    )
