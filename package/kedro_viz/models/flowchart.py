"""`kedro_viz.models.flowchart` defines data models to represent Kedro entities in a viz graph."""
# pylint: disable=protected-access
import abc
import hashlib
import inspect
import logging
from dataclasses import InitVar, dataclass, field
from enum import Enum
from pathlib import Path
from types import FunctionType
from typing import Any, Dict, List, Optional, Set, Union, cast

from kedro.pipeline.node import Node as KedroNode
from kedro.pipeline.pipeline import TRANSCODING_SEPARATOR, _strip_transcoding

from kedro_viz.models.utils import get_dataset_type
from pydantic import BaseModel, validator, Field, root_validator

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

class RegisteredPipeline(BaseModel):
    """Represent a registered pipeline in a Kedro project

    Args:
        id (str): Id of the registered pipeline
        name (Optional[str]): Display name of the registered pipeline

    Raises:
        AssertionError: If id is not supplied during instantiation
    """

    id: str
    name: Optional[str]

    @validator("name", pre=True, always=True)
    def set_name(cls, name, values):
        assert "id" in values
        return values["id"]


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


class Tag(RegisteredPipeline):
    """Represent a tag"""

    def __hash__(self) -> int:
        return hash(self.id)


# pylint: disable=too-many-instance-attributes
class GraphNode(BaseModel, abc.ABC):
    """Represent a node in the graph representation of a Kedro pipeline.
    All node models except the metadata node models should inherit from this class

    Args:
        id (str): A unique identifier for the node in the graph, obtained by hashing the node's string representation.
        name (str): The full name of this node obtained from the underlying Kedro object
        type (str): The type of the graph node
        kedro_obj (Optional[Union[KedroNode, AbstractDataset]]): The underlying Kedro object for each graph node, if any. Defaults to `None`.
        tags (Set[str]): The tags associated with this node. Defaults to `set()`.
        pipelines (Set[str]): The set of registered pipeline IDs this node belongs to. Defaults to `set()`.
        namespace (Optional[str]): The original namespace on this node. Defaults to `None`.
        modular_pipelines (Optional[List[str]]): The list of modular pipeline this node belongs to.

    """

    id: str
    name: str
    type: str
    kedro_obj: Optional[Union[KedroNode, AbstractDataset]] = Field(
        None, description="The underlying Kedro object for each graph node, if any"
    )
    tags: Set[str] = Field(set(), description="The tags associated with this node")
    pipelines: Set[str] = Field(
        set(), description="The set of registered pipeline IDs this node belongs to"
    )

    # In Kedro, modular pipeline is implemented by declaring namespace on a node.
    # For example, node(func, namespace="uk.de") means this node belongs
    # to the modular pipeline "uk" and "uk.de"
    namespace: Optional[str] = Field(
        None, description="The original namespace on this node"
    )
    modular_pipelines: Optional[List[str]]

    class Config:
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
        """Create a graph node of type TASK for a given Kedro Node instance.
        Args:
            node: A node in a Kedro pipeline.
        Returns:
            An instance of TaskNode.
        """
        node_name = node._name or node._func_name
        import pdb

        pdb.set_trace()
        created_node = TaskNode(
            id=cls._hash(str(node)),
            name=node_name,
            tags=set(node.tags),
            kedro_obj=node,
        )
        return created_node

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
        """Create a graph node of type DATA for a given Kedro Dataset instance.
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
        """Create a graph node of type PARAMETERS for a given Kedro parameters dataset instance.
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
        """Create a graph node of type MODULAR_PIPELINE for a given modular pipeline ID.
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
    """Represent a graph node of type TASK
    Args:
        modular_pipelines (List[str]): The list of modular pipeline the task node belongs to.
        parameters (Dict): A dictionary of parameter values for the task node. Defaults to `dict`.
        type (str): The type of the task node. Defaults to `Literal['task']`.

    Raises:
        AssertionError: If kedro_obj is not supplied during instantiation
    """

    modular_pipelines: List[str]
    parameters: Dict = Field(
        dict, description="A dictionary of parameter values for the task node"
    )
    type: str = GraphNodeType.TASK.value

    @root_validator(pre=True)
    def check_kedro_obj_exists(cls, values):
        assert "kedro_obj" in values
        return values

    @validator("namespace", pre=True, always=True)
    def set_namespace(cls, namespace, values):
        return values["kedro_obj"].namespace

    @validator("modular_pipelines", pre=True, always=True)
    def set_modular_pipelines(cls, modular_pipelines, values):
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
    """Represent a modular pipeline node in the graph

    Args:
        type (str): The type of the modular pipeline node. Defaults to `Literal['modularPipeline']`.
        modular_pipelines (Optional[List[str]]): The parent-child relationship between modular pipelines. Defaults to `None`.
        children (Set[ModularPipelineChild]): Children for the modular pipeline node. Defaults to `set()`.
        internal_inputs (Set[str]): Ids of the dataset inputs within the modular pipeline node.
        internal_outputs (Set[str]): Ids of the dataset outputs within the modular pipeline node.
        external_inputs (Set[str]): Ids of the dataset inputs connecting the modular pipeline node with other modular pipelines.
        external_outputs (Set[str]): Ids of the dataset outputs connecting the modular pipeline node with other modular pipelines.

    """

    type: str = GraphNodeType.MODULAR_PIPELINE.value

    # A modular pipeline doesn't belong to any other modular pipeline,
    # in the same sense as other types of GraphNode do.
    # Therefore it's default to None.
    # The parent-child relationship between modular pipeline themselves is modelled explicitly.
    modular_pipelines: Optional[List[str]] = Field(
        None, description="The parent-child relationship between modular pipelines"
    )

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
        description="The dataset inputs connecting the modular pipeline node with other modular pipelines",
    )
    external_outputs: Set[str] = Field(
        set(),
        description="The dataset outputs connecting the modular pipeline node with other modular pipelines",
    )

    @property
    def inputs(self) -> Set[str]:
        """Return a set of inputs for this modular pipeline.
        Visually, these are inputs displayed as the inputs of the modular pipeline,
        both when collapsed and focused.
        Intuitively, the set of inputs for this modular pipeline is the set of all
        external and internal inputs, excluding the ones also serving as outputs.
        """
        return (self.external_inputs | self.internal_inputs) - (
            self.external_outputs | self.internal_outputs
        )

    @property
    def outputs(self) -> Set[str]:
        """Return a set of inputs for this modular pipeline.
        Follow the same logic as the inputs calculation.
        """
        return (self.external_outputs | self.internal_outputs) - (
            self.external_inputs | self.internal_inputs
        )


class TaskNodeMetadata(GraphNodeMetadata):
    """Represent the metadata of a TaskNode

    Args:
        code (Optional[str]): Source code of the node's function
        filepath (Optional[str]): Path to the file where the node is defined
        parameters (Optional[Dict]): Parameters of the node, if available
        run_command (Optional[str]): Command to run the pipeline to this node
        inputs (List[str]): Inputs to the TaskNode
        outputs (List[str]): Outputs from the TaskNode
        task_node (TaskNode): Task node to which this metadata belongs

    Raises:
        AssertionError: If task_node is not supplied during instantiation
    """

    code: Optional[str]
    filepath: Optional[str]
    parameters: Optional[Dict] = Field(
        None, description="The parameters of the node, if available"
    )
    run_command: Optional[str] = Field(
        None, description="The command to run the pipeline to this node"
    )
    inputs: List[str]
    outputs: List[str]
    task_node: TaskNode

    @root_validator(pre=True)
    def check_task_node_exists(cls, values):
        assert "task_node" in values
        cls.set_task_node(values["task_node"])
        return values

    @validator("code", pre=True, always=True)
    def set_code(cls):
        # this is required to handle partial, curry functions
        if inspect.isfunction(cls.kedro_node.func):
            code = inspect.getsource(_extract_wrapped_func(cls.kedro_node.func))
            return code

        return None

    @validator("filepath", pre=True, always=True)
    def set_filepath(cls):
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

    @validator("parameters", pre=True, always=True)
    def set_parameters(cls):
        return cls.task_node.parameters

    @validator("run_command", pre=True, always=True)
    def set_run_command(cls):
        # if a node doesn't have a user-supplied `_name` attribute,
        # a human-readable run command `kedro run --to-nodes/nodes` is not available
        if cls.kedro_node._name is not None:
            if cls.task_node.namespace is not None:
                return f"kedro run --to-nodes={cls.task_node.namespace}.{cls.kedro_node._name}"
            return f"kedro run --to-nodes={cls.kedro_node._name}"

        return None

    @validator("inputs", pre=True, always=True)
    def set_inputs(cls):
        return cls.kedro_node.inputs

    @validator("outputs", pre=True, always=True)
    def set_outputs(cls):
        return cls.kedro_node.outputs

    @classmethod
    def set_task_node(cls, task_node):
        cls.task_node = task_node
        cls.kedro_node = cast(KedroNode, task_node.kedro_obj)

# pylint: disable=too-many-instance-attributes
class DataNode(GraphNode):
    """Represent a graph node of type DATA
    
    Args:
        is_free_input (bool): Determines whether the data node is a free input. Defaults to `False`.
        layer (Optional[str]): The layer that this data node belongs to. Defaults to `None`.
        dataset_type (Optional[str]): The concrete type of the underlying kedro_obj.
        modular_pipelines (List[str]): The list of modular pipelines this data node belongs to.
        viz_metadata (Optional[Dict]): The metadata for data node
        run_command (Optional[str]): Command to run the pipeline to this node. Defaults to `None`.
        type (str): The type of the data node. Defaults to `Literal['data']`.
        stats (Optional[Dict]): Statistics for the data node. Defaults to `None`.
    
    Raises:
        AssertionError: If kedro_obj, name are not supplied during instantiation
    """

    is_free_input: bool = Field(False, description="Determines whether the data node is a free input")
    layer: Optional[str] = Field(None, description="The layer that this data node belongs to")
    dataset_type: Optional[str]
    modular_pipelines: List[str]
    viz_metadata: Optional[Dict]
    run_command: Optional[str] = Field(None, description="The command to run the pipeline to this node.")
    type: str = GraphNodeType.DATA.value
    stats: Optional[Dict] = Field(None, description="The statistics for the data node.")

    @root_validator(pre=True)
    def check_kedro_obj_exists(cls, values):
        assert "kedro_obj" in values
        return values
    
    @validator('dataset_type', pre=True, always=True)
    def set_dataset_type(cls, dataset_type, values):
        kedro_obj = values.get('kedro_obj')
        return get_dataset_type(kedro_obj)

    @validator('namespace', pre=True, always=True)
    def set_namespace(cls, namespace, values):
        assert "name" in values

        # the modular pipelines that a data node belongs to
        # are derived from its namespace, which in turn
        # is derived from the dataset's name.
        name = values.get('name')
        return cls._get_namespace(name)

    @validator('modular_pipelines', pre=True, always=True)
    def set_modular_pipelines(cls, modular_pipelines, values):
        assert "name" in values

        name = values.get('name')
        namespace = cls._get_namespace(name)
        return cls._expand_namespaces(namespace)

    @validator('viz_metadata', pre=True, always=True)
    def set_viz_metadata(cls, viz_metadata, values):
        kedro_obj = values.get('kedro_obj')
        
        try:
            return kedro_obj.metadata["kedro-viz"]
        except (AttributeError, KeyError):  # pragma: no cover
            logger.debug("Kedro-viz metadata not found for %s", values.get('name'))
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
        try:
            is_preview = bool(self.viz_metadata["preview_args"])
        except (AttributeError, KeyError):
            return False
        return is_preview

    def get_preview_args(self):
        """Gets the preview arguments for a dataset"""
        return self.viz_metadata["preview_args"]

class TranscodedDataNode(GraphNode):
    """Represent a graph node of type DATA
    
    Args:
        is_free_input (bool): Determines whether the transcoded data node is a free input. Defaults to `False`.
        layer (Optional[str]): The layer that this transcoded data node belongs to. Defaults to `None`.
        original_version (AbstractDataset): The original Kedro's AbstractDataset for this transcoded data node.
        original_name (str): The original name for the generated run command.
        transcoded_versions (Set[AbstractDataset]): The transcoded versions of the transcoded data nodes. Defaults to `None`.
        modular_pipelines (List[str]): The list of modular pipelines this transcoded data node belongs to.
        viz_metadata (Optional[Dict]): The metadata for data node
        run_command (Optional[str]): Command to run the pipeline to this node. Defaults to `None`.
        type (str): The type of the data node. Defaults to `Literal['data']`.
        stats (Optional[Dict]): Statistics for the data node
    
    Raises:
        AssertionError: If name is not supplied during instantiation

    """

    is_free_input: bool = Field(False, description="Determines whether the transcoded data node is a free input")
    layer: Optional[str] = Field(None, description="The layer that this transcoded data node belongs to")
    original_version: AbstractDataset
    original_name: str
    transcoded_versions: Set[AbstractDataset] = Field(None, description="The transcoded versions of the transcoded data nodes")
    modular_pipelines: List[str]
    run_command: Optional[str] = Field(None, description="The command to run the pipeline to this node.")
    type: str = GraphNodeType.DATA.value
    stats: Optional[Dict] = Field(None, description="The statistics for the data node.")

    @validator('namespace', pre=True, always=True)
    def set_namespace(cls, namespace, values):
        assert "name" in values

        # the modular pipelines that a data node belongs to
        # are derived from its namespace, which in turn
        # is derived from the dataset's name.
        name = values.get('name')
        return cls._get_namespace(name)

    @validator('modular_pipelines', pre=True, always=True)
    def set_modular_pipelines(cls, modular_pipelines, values):
        assert "name" in values

        name = values.get('name')
        namespace = cls._get_namespace(name)
        return cls._expand_namespaces(namespace)
    
    def has_metadata(self) -> bool:
        return True
    
@dataclass
class DataNodeMetadata(GraphNodeMetadata):
    """Represent the metadata of a DataNode"""

    # the dataset type for this data node, e.g. CSVDataset
    type: Optional[str] = field(init=False)

    # the path to the actual data file for the underlying dataset.
    # only available if the dataset has filepath set.
    filepath: Optional[str] = field(init=False)

    # the underlying data node to which this metadata belongs
    data_node: InitVar[DataNode]

    # the optional plot data if the underlying dataset has a plot.
    # currently only applicable for PlotlyDataset
    plot: Optional[Dict] = field(init=False, default=None)

    # the optional image data if the underlying dataset has a image.
    # currently only applicable for matplotlib.MatplotlibWriter
    image: Optional[str] = field(init=False, default=None)

    tracking_data: Optional[Dict] = field(init=False, default=None)

    # command to run the pipeline to this data node
    run_command: Optional[str] = field(init=False, default=None)

    preview: Optional[Dict] = field(init=False, default=None)

    stats: Optional[Dict] = field(init=False, default=None)

    # TODO: improve this scheme.
    def __post_init__(self, data_node: DataNode):
        self.type = data_node.dataset_type
        dataset = cast(AbstractDataset, data_node.kedro_obj)
        dataset_description = dataset._describe()
        self.filepath = _parse_filepath(dataset_description)
        self.stats = data_node.stats

        # Run command is only available if a node is an output, i.e. not a free input
        if not data_node.is_free_input:
            self.run_command = f"kedro run --to-outputs={data_node.name}"

        # Only check for existence of dataset if we might want to load it.
        if not (
            data_node.is_plot_node()
            or data_node.is_image_node()
            or data_node.is_tracking_node()
            or data_node.is_preview_node()
        ):
            return

        # dataset.release clears the cache before loading to ensure that this issue
        # does not arise: https://github.com/kedro-org/kedro-viz/pull/573.
        dataset.release()
        if not dataset.exists():
            return

        if data_node.is_plot_node():
            self.plot = dataset.load()
        elif data_node.is_image_node():
            self.image = dataset.load()
        elif data_node.is_tracking_node():
            self.tracking_data = dataset.load()
        elif data_node.is_preview_node():
            try:
                if hasattr(dataset, "_preview"):
                    self.preview = dataset._preview(**data_node.get_preview_args())

            except Exception as exc:  # pylint: disable=broad-except # pragma: no cover
                logger.warning(
                    "'%s' could not be previewed. Full exception: %s: %s",
                    data_node.name,
                    type(exc).__name__,
                    exc,
                )

class TranscodedDataNodeMetadata(GraphNodeMetadata):
    """Represent the metadata of a TranscodedDataNode
    Args:
        filepath (Optional[str]): The path to the actual data file for the underlying dataset. Only available if the dataset has filepath set.
        run_command (Optional[str]): Command to run the pipeline to this node.
        original_type (str): The dataset type of the underlying transcoded data node original version.
        transcoded_types (List[str]): The list of all dataset types for the transcoded versions.
        stats (Optional[Dict]): Statistics for the transcoded data node metadata. Defaults to `None`.
        transcoded_data_node (TranscodedDataNode): The underlying transcoded data node to which this metadata belongs to.
    
    Raises:
        AssertionError: If transcoded_data_node is not supplied during instantiation
    """

    filepath: Optional[str]
    run_command: Optional[str]
    original_type: str
    transcoded_types: List[str] 
    stats: Optional[Dict] = Field(None, description="The statistics for the transcoded data node metadata.")
    transcoded_data_node: InitVar[TranscodedDataNode]

    @root_validator(pre=True)
    def check_transcoded_data_node_exists(cls, values):
        assert "transcoded_data_node" in values
        return values
    
    @validator('original_type', pre=True, always=True)
    def set_original_type(cls, transcoded_data_node):
        return get_dataset_type(transcoded_data_node.original_version)

    @validator('transcoded_types', pre=True, always=True)
    def set_transcoded_types(cls, transcoded_data_node):
        return [
            get_dataset_type(transcoded_version)
            for transcoded_version in transcoded_data_node.transcoded_versions
        ]

    @validator('filepath', pre=True, always=True)
    def set_filepath(cls, transcoded_data_node):
        dataset_description = transcoded_data_node.original_version._describe()
        return _parse_filepath(dataset_description)

    @validator('run_command', pre=True, always=True)
    def set_run_command(cls, transcoded_data_node):
        if not transcoded_data_node.is_free_input:
            return f"kedro run --to-outputs={transcoded_data_node.original_name}"
        return None
class ParametersNode(GraphNode):
    """Represent a graph node of type PARAMETERS
    Args:
        layer (Optional[str]): The layer that this parameters node belongs to. Defaults to `None`.
        modular_pipelines (List[str]): The list of modular pipelines this parameters node belongs to.
        type (str): The type of the parameters node. Defaults to `Literal['parameters']`.
    
    Raises:
        AssertionError: If kedro_obj, name are not supplied during instantiation
    """

    layer: Optional[str] = Field(None, description="The layer that this parameters node belongs to")
    modular_pipelines: List[str]
    type: str = GraphNodeType.PARAMETERS.value

    @root_validator(pre=True)
    def check_kedro_obj_and_name_exists(cls, values):
        assert "kedro_obj" in values
        assert "name" in values
        return values
    
    @validator('namespace', pre=True, always=True)
    def set_namespace(cls):
        if cls.is_all_parameters():
            return None
        return cls._get_namespace(cls.parameter_name)

    @validator('modular_pipelines', pre=True, always=True)
    def set_modular_pipelines(cls):
        if cls.is_all_parameters():
            return []
        return cls._expand_namespaces(cls._get_namespace(cls.parameter_name))

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
        parameters (Dict): The parameters dictionary for the parameters metadata node.
        parameters_node (ParametersNode): The underlying parameters node for the parameters metadata node.
    
    Raises:
        AssertionError: If parameters_node is not supplied during instantiation
    """

    parameters: Dict
    parameters_node: ParametersNode

    @root_validator(pre=True)
    def check_parameters_node_exists(cls, values):
        assert "parameters_node" in values
        return values
    
    @validator('parameters', pre=True, always=True)
    def set_parameters(cls, parameters_node):
        if parameters_node.is_single_parameter():
            return {
                parameters_node.parameter_name: parameters_node.parameter_value
            }
        else:
            return parameters_node.parameter_value

class GraphEdge(BaseModel, frozen=True):
    """Represent an edge in the graph

    Args:
        source (str): The id of the source node.
        target (str): The id of the target node.
    """

    source: str
    target: str
