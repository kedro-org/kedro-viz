"""`kedro_viz.models.flowchart` defines data models to represent Kedro entities in a viz graph."""
# pylint: disable=protected-access, missing-function-docstring
import abc
import hashlib
import inspect
import logging
from enum import Enum
from pathlib import Path
from types import FunctionType
from typing import Any, Dict, List, Optional, Set, Union, cast

from kedro.pipeline.node import Node as KedroNode
from kedro.pipeline.pipeline import TRANSCODING_SEPARATOR, _strip_transcoding
from pydantic import BaseModel, Field, root_validator, validator

from kedro_viz.models.utils import get_dataset_type

try:
    # kedro 0.18.11 onwards
    from kedro.io.core import DatasetError
except ImportError:  # pragma: no cover
    # older versions
    from kedro.io.core import DataSetError as DatasetError
try:
    # kedro 0.18.12 onwards
    from kedro.io.core import AbstractDataset
except ImportError:  # pragma: no cover
    # older versions
    from kedro.io.core import AbstractDataSet as AbstractDataset

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
    name: Optional[str] = Field(None, description="The name of the registered pipeline")

    @validator("name", always=True)
    def set_name(cls, _, values):
        assert "id" in values
        return values["id"]


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
        namespace (Optional[str]): The original namespace on this node. Defaults to `None`.
        modular_pipelines (Optional[List[str]]): The list of modular pipeline this node belongs to.

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

    # In Kedro, modular pipeline is implemented by declaring namespace on a node.
    # For example, node(func, namespace="uk.de") means this node belongs
    # to the modular pipeline "uk" and "uk.de"
    namespace: Optional[str] = Field(
        None, description="The original namespace on this node"
    )
    modular_pipelines: Optional[List[str]] = Field(
        None, description="The modular_pipelines this node belongs to"
    )

    class Config:
        """Pydantic Config for GraphNode"""

        arbitrary_types_allowed = True

    @staticmethod
    def _hash(value: str):
        return hashlib.sha1(value.encode("UTF-8")).hexdigest()[:8]

    @staticmethod
    def _get_namespace(dataset_name: str) -> Optional[str]:
        """Extract the namespace from the dataset/parameter name.
        Args:
            dataset_name: The name of the dataset.
        Returns:
            The namespace of this dataset, if available.
        Example:
            >>> GraphNode._get_namespace("pipeline.dataset")
            'pipeline'
        """
        if "." not in dataset_name:
            return None

        return dataset_name.rsplit(".", 1)[0]

    @staticmethod
    def _expand_namespaces(namespace: Optional[str]) -> List[str]:
        """Expand a node's namespace to the list of modular pipelines
        that this node belongs to.
        Args:
            namespace: The namespace of the node.
        Returns:
            The list of modular pipelines that this node belongs to.
        Example:
            >>> GraphNode._expand_namespaces("pipeline1.data_science")
            ['pipeline1', 'pipeline1.data_science']
        """
        if not namespace:
            return []
        namespace_list = []
        namespace_chunks = namespace.split(".")
        prefix = ""
        for chunk in namespace_chunks:
            if prefix:
                prefix = f"{prefix}.{chunk}"
            else:
                prefix = chunk
            namespace_list.append(prefix)
        return namespace_list

    @classmethod
    def create_task_node(cls, node: KedroNode) -> "TaskNode":
        """Create a graph node of type task for a given Kedro Node instance.
        Args:
            node: A node in a Kedro pipeline.
        Returns:
            An instance of TaskNode.
        """
        node_name = node._name or node._func_name
        return TaskNode(
            id=cls._hash(str(node)),
            name=node_name,
            tags=set(node.tags),
            kedro_obj=node,
        )

    @classmethod
    def create_data_node(
        cls,
        dataset_name: str,
        layer: Optional[str],
        tags: Set[str],
        dataset: AbstractDataset,
        stats: Optional[Dict],
        is_free_input: bool = False,
    ) -> Union["DataNode", "TranscodedDataNode"]:
        """Create a graph node of type data for a given Kedro Dataset instance.
        Args:
            dataset_name: The name of the dataset, including namespace, e.g.
                data_science.master_table.
            layer: The optional layer that the dataset belongs to.
            tags: The set of tags assigned to assign to the graph representation
                of this dataset. N.B. currently it's derived from the node's tags.
            dataset: A dataset in a Kedro pipeline.
            stats: The dictionary of dataset statistics, e.g.
                {"rows":2, "columns":3, "file_size":100}
            is_free_input: Whether the dataset is a free input in the pipeline
        Returns:
            An instance of DataNode.
        """
        is_transcoded_dataset = TRANSCODING_SEPARATOR in dataset_name
        if is_transcoded_dataset:
            name = _strip_transcoding(dataset_name)
            return TranscodedDataNode(
                id=cls._hash(name),
                name=name,
                tags=tags,
                layer=layer,
                is_free_input=is_free_input,
                stats=stats,
            )

        return DataNode(
            id=cls._hash(dataset_name),
            name=dataset_name,
            tags=tags,
            layer=layer,
            kedro_obj=dataset,
            is_free_input=is_free_input,
            stats=stats,
        )

    @classmethod
    def create_parameters_node(
        cls,
        dataset_name: str,
        layer: Optional[str],
        tags: Set[str],
        parameters: AbstractDataset,
    ) -> "ParametersNode":
        """Create a graph node of type parameters for a given Kedro parameters dataset instance.
        Args:
            dataset_name: The name of the dataset, including namespace, e.g.
                data_science.test_split_ratio
            layer: The optional layer that the parameters belong to.
            tags: The set of tags assigned to assign to the graph representation
                of this dataset. N.B. currently it's derived from the node's tags.
            parameters: A parameters dataset in a Kedro pipeline.
        Returns:
            An instance of ParametersNode.
        """
        return ParametersNode(
            id=cls._hash(dataset_name),
            name=dataset_name,
            tags=tags,
            layer=layer,
            kedro_obj=parameters,
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

    modular_pipelines: List[str] = Field(
        [], description="The modular pipelines this node belongs to"
    )
    parameters: Dict = Field(
        {}, description="A dictionary of parameter values for the task node"
    )

    # The type for Task node
    type: str = GraphNodeType.TASK.value

    @root_validator(pre=True)
    def check_kedro_obj_exists(cls, values):
        assert "kedro_obj" in values
        return values

    @validator("namespace", always=True)
    def set_namespace(cls, _, values):
        return values["kedro_obj"].namespace

    @validator("modular_pipelines", always=True)
    def set_modular_pipelines(cls, _, values):
        return cls._expand_namespaces(values["kedro_obj"].namespace)


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
    modular_pipelines: Optional[List[str]] = None

    # Model the modular pipelines tree using a child-references representation of a tree.
    # See: https://docs.mongodb.com/manual/tutorial/model-tree-structures-with-child-references/
    # for more details.
    # For example, if a node namespace is "uk.data_science",
    # the "uk" modular pipeline node's children are ["uk.data_science"]
    children: Set[ModularPipelineChild] = Field(
        set(), description="The children for the modular pipeline node"
    )

    # Keep track of a modular pipeline's inputs and outputs, both internal and external.
    # Internal inputs/outputs are IDs of the datasets not connected to any nodes external
    # to the pipeline.External inputs/outputs are IDs of the datasets used to connect
    # this modular pipeline to other modular pipelines in the whole registered pipeline.
    # In practical term, external inputs/outputs are the ones explicitly specified
    # when using the pipeline() factory function.
    # More information can be found here:
    # https://kedro.readthedocs.io/en/latest/06_nodes_and_pipelines/03_modular_pipelines.html#how-to-connect-existing-pipelines
    internal_inputs: Set[str] = Field(
        set(), description="The dataset inputs within the modular pipeline node"
    )
    internal_outputs: Set[str] = Field(
        set(), description="The dataset outputs within the modular pipeline node"
    )
    external_inputs: Set[str] = Field(
        set(),
        description="""The dataset inputs connecting the modular
        pipeline node with other modular pipelines""",
    )
    external_outputs: Set[str] = Field(
        set(),
        description="""The dataset outputs connecting the modular
        pipeline node with other modular pipelines""",
    )

    # The type for Modular Pipeline Node
    type: str = GraphNodeType.MODULAR_PIPELINE.value

    @property
    def inputs(self) -> Set[str]:
        """Return a set of inputs for this modular pipeline.
        Visually, these are inputs displayed as the inputs of the modular pipeline,
        both when collapsed and focused.
        Intuitively, the set of inputs for this modular pipeline is the set of all
        external and internal inputs, excluding the ones also serving as outputs.
        """
        return (self.external_inputs | self.internal_inputs) - self.internal_outputs

    @property
    def outputs(self) -> Set[str]:
        """Return a set of inputs for this modular pipeline.
        Follow the same logic as the inputs calculation.
        """
        return self.external_outputs | (self.internal_outputs - self.internal_inputs)


class TaskNodeMetadata(GraphNodeMetadata):
    """Represent the metadata of a TaskNode

    Args:
        task_node (TaskNode): Task node to which this metadata belongs to.

    Raises:
        AssertionError: If task_node is not supplied during instantiation
    """

    task_node: TaskNode = Field(..., exclude=True)

    # Source code of the node's function
    code: Optional[str]

    # Path to the file where the node is defined
    filepath: Optional[str]

    parameters: Optional[Dict] = Field(
        None, description="The parameters of the node, if available"
    )
    run_command: Optional[str] = Field(
        None, description="The command to run the pipeline to this node"
    )

    inputs: Optional[List[str]] = Field(None, description="The inputs to the TaskNode")
    outputs: Optional[List[str]] = Field(
        None, description="The outputs from the TaskNode"
    )

    @root_validator(pre=True)
    def check_task_node_exists(cls, values):
        assert "task_node" in values
        cls.set_task_and_kedro_node(values["task_node"])
        return values

    @classmethod
    def set_task_and_kedro_node(cls, task_node):
        cls.task_node = task_node
        cls.kedro_node = cast(KedroNode, task_node.kedro_obj)

    @validator("code", always=True)
    def set_code(cls, code):
        # this is required to handle partial, curry functions
        if inspect.isfunction(cls.kedro_node.func):
            code = inspect.getsource(_extract_wrapped_func(cls.kedro_node.func))
            return code

        return None

    @validator("filepath", always=True)
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

    @validator("parameters", always=True)
    def set_parameters(cls, _):
        return cls.task_node.parameters

    @validator("run_command", always=True)
    def set_run_command(cls, _):
        # if a node doesn't have a user-supplied `_name` attribute,
        # a human-readable run command `kedro run --to-nodes/nodes` is not available
        if cls.kedro_node._name is not None:
            if cls.task_node.namespace is not None:
                return f"kedro run --to-nodes={cls.task_node.namespace}.{cls.kedro_node._name}"
            return f"kedro run --to-nodes={cls.kedro_node._name}"

        return None

    @validator("inputs", always=True)
    def set_inputs(cls, _):
        return cls.kedro_node.inputs

    @validator("outputs", always=True)
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

    # The concrete type of the underlying kedro_obj.
    dataset_type: Optional[str]

    modular_pipelines: List[str] = Field(
        [], description="The modular pipelines this node belongs to"
    )

    # The metadata for data node
    viz_metadata: Optional[Dict]

    run_command: Optional[str] = Field(
        None, description="The command to run the pipeline to this node"
    )

    # The type for data node
    type: str = GraphNodeType.DATA.value

    @root_validator(pre=True)
    def check_kedro_obj_exists(cls, values):
        assert "kedro_obj" in values
        return values

    @validator("dataset_type", always=True)
    def set_dataset_type(cls, _, values):
        kedro_obj = values.get("kedro_obj")
        return get_dataset_type(kedro_obj)

    @validator("namespace", always=True)
    def set_namespace(cls, _, values):
        assert "name" in values

        # the modular pipelines that a data node belongs to
        # are derived from its namespace, which in turn
        # is derived from the dataset's name.
        name = values.get("name")
        return cls._get_namespace(name)

    @validator("modular_pipelines", always=True)
    def set_modular_pipelines(cls, _, values):
        assert "name" in values

        name = values.get("name")
        namespace = cls._get_namespace(name)
        return cls._expand_namespaces(namespace)

    @validator("viz_metadata", always=True)
    def set_viz_metadata(cls, _, values):
        kedro_obj = values.get("kedro_obj")

        if hasattr(kedro_obj, "metadata") and kedro_obj.metadata:
            return kedro_obj.metadata.get("kedro-viz", None)

        return None

    # TODO: improve this scheme.
    def is_plot_node(self):
        """Check if the current node is a plot node.
        Currently it only recognises one underlying dataset as a plot node.
        In the future, we might want to make this generic.
        """
        return self.dataset_type in (
            "plotly.plotly_dataset.PlotlyDataset",
            "plotly.json_dataset.JSONDataset",
            "plotly.plotly_dataset.PlotlyDataSet",
            "plotly.json_dataset.JSONDataSet",
        )

    def is_image_node(self):
        """Check if the current node is a matplotlib image node."""
        return self.dataset_type == "matplotlib.matplotlib_writer.MatplotlibWriter"

    def is_metric_node(self):
        """Check if the current node is a metrics node."""
        return self.dataset_type in (
            "tracking.metrics_dataset.MetricsDataset",
            "tracking.metrics_dataset.MetricsDataSet",
        )

    def is_json_node(self):
        """Check if the current node is a JSONDataset node."""
        return self.dataset_type in (
            "tracking.json_dataset.JSONDataset",
            "tracking.json_dataset.JSONDataSet",
        )

    def is_tracking_node(self):
        """Checks if the current node is a tracking data node"""
        return self.is_json_node() or self.is_metric_node()

    def is_preview_node(self):
        """Checks if the current node has a preview"""
        if not (self.viz_metadata and self.viz_metadata.get("preview_args", None)):
            return False

        return True

    def get_preview_args(self):
        """Gets the preview arguments for a dataset"""
        return self.viz_metadata.get("preview_args", None)


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

    modular_pipelines: List[str] = Field(
        [], description="The modular pipelines this node belongs to"
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

    @validator("namespace", always=True)
    def set_namespace(cls, _, values):
        assert "name" in values

        # the modular pipelines that a data node belongs to
        # are derived from its namespace, which in turn
        # is derived from the dataset's name.
        name = values.get("name")
        return cls._get_namespace(name)

    @validator("modular_pipelines", always=True)
    def set_modular_pipelines(cls, _, values):
        assert "name" in values

        name = values.get("name")
        namespace = cls._get_namespace(name)
        return cls._expand_namespaces(namespace)

    def has_metadata(self) -> bool:
        return True


class DataNodeMetadata(GraphNodeMetadata):
    """Represent the metadata of a DataNode

    Args:
        data_node (DataNode): Data node to which this metadata belongs to.

    Raises:
        AssertionError: If data_node is not supplied during instantiation
    """

    data_node: DataNode = Field(..., exclude=True)

    # The type of the data node
    type: Optional[str]

    # The path to the actual data file for the underlying dataset
    filepath: Optional[str]

    plot: Optional[Dict] = Field(
        None, description="The optional plot data if the underlying dataset has a plot"
    )

    # The image data if the underlying dataset has a image
    # currently only applicable for matplotlib.MatplotlibWriter
    image: Optional[str] = Field(
        None, description="The image data if the underlying dataset has a image"
    )
    tracking_data: Optional[Dict] = Field(
        None,
        description="The tracking data if the underlying dataset has a tracking dataset",
    )
    run_command: Optional[str] = Field(
        None, description="Command to run the pipeline to this node"
    )
    preview: Optional[Dict] = Field(
        None, description="Preview data for the underlying datanode"
    )
    stats: Optional[Dict] = Field(None, description="The statistics for the data node.")

    @root_validator(pre=True)
    def check_data_node_exists(cls, values):
        assert "data_node" in values
        cls.set_data_node_and_dataset(values["data_node"])
        return values

    @classmethod
    def set_data_node_and_dataset(cls, data_node):
        cls.data_node = data_node
        cls.dataset = cast(AbstractDataset, data_node.kedro_obj)

        # dataset.release clears the cache before loading to ensure that this issue
        # does not arise: https://github.com/kedro-org/kedro-viz/pull/573.
        cls.dataset.release()

    @validator("type", always=True)
    def set_type(cls, _):
        return cls.data_node.dataset_type

    @validator("filepath", always=True)
    def set_filepath(cls, _):
        dataset_description = cls.dataset._describe()
        return _parse_filepath(dataset_description)

    @validator("run_command", always=True)
    def set_run_command(cls, _):
        if not cls.data_node.is_free_input:
            return f"kedro run --to-outputs={cls.data_node.name}"
        return None

    @validator("plot", always=True)
    def set_plot(cls, _):
        if cls.data_node.is_plot_node():
            return cls.data_node.kedro_obj.load()
        return None

    @validator("image", always=True)
    def set_image(cls, _):
        if cls.data_node.is_image_node():
            return cls.data_node.kedro_obj.load()
        return None

    @validator("tracking_data", always=True)
    def set_tracking_data(cls, _):
        if cls.data_node.is_tracking_node():
            return cls.data_node.kedro_obj.load()
        return None

    @validator("preview", always=True)
    def set_preview(cls, _):
        if not (cls.data_node.is_preview_node() and hasattr(cls.dataset, "_preview")):
            return None

        try:
            return cls.dataset._preview(**cls.data_node.get_preview_args())

        except Exception as exc:  # pylint: disable=broad-except # pragma: no cover
            logger.warning(
                "'%s' could not be previewed. Full exception: %s: %s",
                cls.data_node.name,
                type(exc).__name__,
                exc,
            )
            return None

    @validator("stats", always=True)
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

    # The path to the actual data file for the underlying dataset.
    # Only available if the dataset has filepath set.
    filepath: Optional[str]

    run_command: Optional[str] = Field(
        None, description="Command to run the pipeline to this node"
    )
    original_type: Optional[str] = Field(
        None,
        description="The dataset type of the underlying transcoded data node original version",
    )
    transcoded_types: Optional[List[str]] = Field(
        None, description="The list of all dataset types for the transcoded versions"
    )

    # Statistics for the underlying data node
    stats: Optional[Dict] = Field(
        None, description="The statistics for the transcoded data node metadata."
    )

    @root_validator(pre=True)
    def check_transcoded_data_node_exists(cls, values):
        assert "transcoded_data_node" in values
        cls.transcoded_data_node = values["transcoded_data_node"]
        return values

    @validator("filepath", always=True)
    def set_filepath(cls, _):
        dataset_description = cls.transcoded_data_node.original_version._describe()
        return _parse_filepath(dataset_description)

    @validator("run_command", always=True)
    def set_run_command(cls, _):
        if not cls.transcoded_data_node.is_free_input:
            return f"kedro run --to-outputs={cls.transcoded_data_node.original_name}"
        return None

    @validator("original_type", always=True)
    def set_original_type(cls, _):
        return get_dataset_type(cls.transcoded_data_node.original_version)

    @validator("transcoded_types", always=True)
    def set_transcoded_types(cls, _):
        return [
            get_dataset_type(transcoded_version)
            for transcoded_version in cls.transcoded_data_node.transcoded_versions
        ]

    @validator("stats", always=True)
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

    modular_pipelines: List[str] = Field(
        [], description="The modular pipelines this node belongs to"
    )

    # The type for Parameters Node
    type: str = GraphNodeType.PARAMETERS.value

    @root_validator(pre=True)
    def check_kedro_obj_and_name_exists(cls, values):
        assert "kedro_obj" in values
        assert "name" in values
        return values

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        if self.is_all_parameters():
            self.namespace = None
            self.modular_pipelines = []
        else:
            self.namespace = self._get_namespace(self.parameter_name)
            self.modular_pipelines = self._expand_namespaces(
                self._get_namespace(self.parameter_name)
            )

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
        self.kedro_obj: AbstractDataset
        if not (self.kedro_obj and hasattr(self.kedro_obj, "load")):
            return None

        try:
            return self.kedro_obj.load()
        except (AttributeError, DatasetError):
            # This except clause triggers if the user passes a parameter that is not
            # defined in the catalog (DatasetError) it also catches any case where
            # the kedro_obj is None (AttributeError) -- GH#1231
            logger.warning(
                "Cannot find parameter `%s` in the catalog.", self.parameter_name
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
        None, description="The parameters dictionary for the parameters metadata node"
    )

    @root_validator(pre=True)
    def check_parameters_node_exists(cls, values):
        assert "parameters_node" in values
        cls.parameters_node = values["parameters_node"]
        return values

    @validator("parameters", always=True)
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
