"""`kedro_viz.models.flowchart_pydantic` defines pydantic data models to represent Kedro entities in a viz graph."""
# pylint: disable=protected-access
import hashlib
import inspect
import logging
from enum import Enum
from pathlib import Path
from types import FunctionType
from typing import Any, Dict, List, Optional, Set, Union, cast

from kedro.pipeline.node import Node as KedroNode
from kedro.pipeline.pipeline import TRANSCODING_SEPARATOR, _strip_transcoding
from pydantic import BaseModel

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


class GraphEdge(BaseModel):
    """Represent an edge in the graph"""

    source: str
    target: str


class RegisteredPipeline(BaseModel):
    """Represent a registered pipeline in a Kedro project"""

    id: str

    def __init__(self, **data):
        super().__init__(**data)
        self.name = self.id


class ModularPipelineChild(BaseModel):
    """Represent a child of a modular pipeline."""

    id: str
    type: GraphNodeType


class Tag(RegisteredPipeline):
    """Represent a tag"""

    def __hash__(self) -> int:
        return hash(self.id)


# pylint: disable=too-many-instance-attributes
class GraphNode(BaseModel):
    """Represent a node in the graph representation of a Kedro pipeline"""

    # a unique identifier for the node in the graph
    # obtained by hashing the node's string representation
    id: str

    # the full name of this node obtained from the underlying Kedro object
    name: str

    # the type of the graph node
    type: str

    # the underlying Kedro object for each graph node, if any
    kedro_obj: Optional[Union[KedroNode, AbstractDataset]] = None

    # the tags associated with this node
    tags: Set[str] = set()

    # the set of registered pipeline IDs this node belongs to
    pipelines: Set[str] = set()

    # The original namespace on this node.
    # N.B.: in Kedro, modular pipeline is implemented by declaring namespace on a node.
    # For example, node(func, namespace="uk.de") means this node belongs
    # to the modular pipeline "uk" and "uk.de"
    namespace: Optional[str] = None

    # The list of modular pipeline this node belongs to.
    modular_pipelines: Optional[List[str]] = []

    @classmethod
    def _hash(cls, value: str):
        return hashlib.sha1(value.encode("UTF-8")).hexdigest()[:8]

    @classmethod
    def _get_namespace(cls, dataset_name: str) -> Optional[str]:
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

    @classmethod
    def _expand_namespaces(cls, namespace: Optional[str]) -> List[str]:
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
        """Create a graph node of type DATA for a given Kedro DataSet instance.
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
        """Checks whether this graph node belongs to a given pipeline_id."""
        return pipeline_id in self.pipelines

    def has_metadata(self) -> bool:
        """Checks whether this graph node has metadata.
        Since metadata of a graph node is derived from the underlying Kedro object,
        we just need to check whether the underlying object exists.
        """
        return self.kedro_obj is not None


class TaskNode(GraphNode):
    """Represent a graph node of type TASK"""

    modular_pipelines: List[str] = []
    parameters: Dict = {}
    type: str = GraphNodeType.TASK.value

    def __init__(self, **data):
        super().__init__(**data)
        self.namespace = self.kedro_obj.namespace

        # the modular pipelines that a task node belongs to are derived from its namespace.
        self.modular_pipelines = self._expand_namespaces(self.kedro_obj.namespace)


class DataNode(GraphNode):
    """Represent a graph node of type DATA"""

    # whether the data node is a free input
    is_free_input: bool = False

    # the layer that this data node belongs to
    layer: Optional[str] = None

    # the concrete type of the underlying kedro_obj
    dataset_type: Optional[str] = None

    # the list of modular pipelines this data node belongs to
    modular_pipelines: List[str] = []

    viz_metadata: Optional[Dict] = None

    # command to run the pipeline to this node
    run_command: Optional[str] = None

    # the type of this graph node, which is DATA
    type: str = GraphNodeType.DATA.value

    # statistics for the data node
    stats: Optional[Dict] = None

    def __init__(self, **data):
        super().__init__(**data)
        self.dataset_type = get_dataset_type(self.kedro_obj)

        # the modular pipelines that a data node belongs to
        # are derived from its namespace, which in turn
        # is derived from the dataset's name.
        self.namespace = self._get_namespace(self.name)
        self.modular_pipelines = self._expand_namespaces(self._get_namespace(self.name))
        metadata = getattr(self.kedro_obj, "metadata", None)
        if metadata:
            try:
                self.viz_metadata = metadata["kedro-viz"]
            except (AttributeError, KeyError):  # pragma: no cover
                logger.debug("Kedro-viz metadata not found for %s", self.name)

    # TODO: improve this scheme.
    def is_plot_node(self):
        """Checks if the current node is a plot node.
        Currently it only recognises one underlying dataset as a plot node.
        In the future, we might want to make this generic.
        """
        return self.dataset_type in (
            "plotly.plotly_dataset.PlotlyDataSet",
            "plotly.json_dataset.JSONDataSet",
        )

    def is_image_node(self):
        """Checks if the current node is a matplotlib image node."""
        return self.dataset_type == "matplotlib.matplotlib_writer.MatplotlibWriter"

    def is_metric_node(self):
        """Checks if the current node is a metrics node."""
        return self.dataset_type == "tracking.metrics_dataset.MetricsDataSet"

    def is_json_node(self):
        """Checks if the current node is a JSONDataSet node."""
        return self.dataset_type == "tracking.json_dataset.JSONDataSet"

    def is_tracking_node(self):
        """Checks if the current node is a tracking data node."""
        return self.is_json_node() or self.is_metric_node()

    def is_preview_node(self):
        """Checks if the current node has a preview."""
        try:
            is_preview = bool(self.viz_metadata["preview_args"])
        except (AttributeError, KeyError):
            return False
        return is_preview

    def get_preview_args(self):
        """Gets the preview arguments for a dataset."""
        return self.viz_metadata["preview_args"]


class TranscodedDataNode(GraphNode):
    """Represent a graph node of type DATA"""

    # whether the data node is a free input
    is_free_input: bool = False

    # the layer that this data node belongs to
    layer: Optional[str] = None

    # the original Kedro's AbstractDataset for this transcoded data node
    original_version: AbstractDataset = None

    # keep track of the original name for the generated run command
    original_name: str = ""

    # the transcoded versions of this transcoded data nodes
    transcoded_versions: Set[AbstractDataset] = set()

    # the list of modular pipelines this data node belongs to
    modular_pipelines: List[str] = []

    # command to run the pipeline to this node
    run_command: Optional[str] = None

    # the type of this graph node, which is DATA
    type: str = GraphNodeType.DATA.value

    # statistics for the data node
    stats: Optional[Dict] = None

    def __init__(self, **data):
        # the modular pipelines that a data node belongs to
        # are derived from its namespace, which in turn
        # is derived from the dataset's name.
        super().__init__(**data)
        self.namespace = self._get_namespace(self.name)
        self.modular_pipelines = self._expand_namespaces(self._get_namespace(self.name))

    def has_metadata(self) -> bool:
        return True


class ParametersNode(GraphNode):
    """Represent a graph node of type PARAMETERS"""

    layer: Optional[str] = None
    modular_pipelines: List[str] = []
    type: str = GraphNodeType.PARAMETERS.value

    def __init__(self, **data):
        super().__init__(**data)

        if self.is_all_parameters():
            self.namespace = None
            self.modular_pipelines = []
        else:
            self.namespace = self._get_namespace(self.parameter_name)
            self.modular_pipelines = self._expand_namespaces(
                self._get_namespace(self.parameter_name)
            )

    def is_all_parameters(self) -> bool:
        """Checks whether the graph node represents all parameters in the pipeline"""
        return self.name == "parameters"

    def is_single_parameter(self) -> bool:
        """Checks whether the graph node represents a single parameter in the pipeline"""
        return not self.is_all_parameters()

    @property
    def parameter_name(self) -> str:
        """Get a normalized parameter name without the "params:" prefix"""
        return self.name.replace("params:", "")

    @property
    def parameter_value(self) -> Any:
        """Load the parameter value from the underlying dataset"""
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


class ModularPipelineNode(GraphNode):
    """Represent a modular pipeline node in the graph"""

    type: str = GraphNodeType.MODULAR_PIPELINE.value

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
    children: Set[ModularPipelineChild] = set()

    # Keep track of a modular pipeline's inputs and outputs, both internal and external.
    # Internal inputs/outputs are IDs of the datasets not connected to any nodes external
    # to the pipeline.External inputs/outputs are IDs of the datasets used to connect
    # this modular pipeline to other modular pipelines in the whole registered pipeline.
    # In practical term, external inputs/outputs are the ones explicitly specified
    # when using the pipeline() factory function.
    # More information can be found here:
    # https://kedro.readthedocs.io/en/latest/06_nodes_and_pipelines/03_modular_pipelines.html#how-to-connect-existing-pipelines
    internal_inputs: Set[str] = set()
    internal_outputs: Set[str] = set()
    external_inputs: Set[str] = set()
    external_outputs: Set[str] = set()

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
        """Return a set of outputs for this modular pipeline.
        Follow the same logic as the inputs calculation.
        """
        return (self.external_outputs | self.internal_outputs) - (
            self.external_inputs | self.internal_inputs
        )


# Metadata classes
class GraphNodeMetadata(BaseModel):
    """Represent a graph node's metadata"""


class TaskNodeMetadata(GraphNodeMetadata):
    """Represent the metadata of a TaskNode"""

    # the source code of the node's function
    code: Optional[str]

    # path to the file where the node is defined
    filepath: Optional[str]

    # parameters of the node, if available
    parameters: Optional[Dict] = None

    # command to run the pipeline to this node
    run_command: Optional[str] = None

    inputs: List[str]

    outputs: List[str]

    def __init__(self, task_node: TaskNode, **data):
        super().__init__(**data)

        kedro_node = cast(KedroNode, task_node.kedro_obj)

        # this is required to handle partial, curry functions
        if inspect.isfunction(kedro_node.func):
            self.code = inspect.getsource(_extract_wrapped_func(kedro_node.func))
            code_full_path = (
                Path(inspect.getfile(kedro_node.func)).expanduser().resolve()
            )
            try:
                filepath = code_full_path.relative_to(Path.cwd().parent)
            except ValueError:  # pragma: no cover
                # if the filepath can't be resolved relative to the current directory,
                # e.g. either during tests or during launching development server
                # outside of a Kedro project, simply return the fullpath to the file.
                filepath = code_full_path

            self.filepath = str(filepath)

        self.parameters = task_node.parameters
        self.inputs = kedro_node.inputs
        self.outputs = kedro_node.outputs

        # if a node doesn't have a user-supplied `_name` attribute,
        # a human-readable run command `kedro run --to-nodes/nodes` is not available
        if kedro_node._name is not None:
            self.run_command = (
                f"kedro run --to-nodes={task_node.namespace}.{kedro_node._name}"
            )


class DataNodeMetadata(GraphNodeMetadata):
    """Represent the metadata of a DataNode"""

    # the dataset type for this data node, e.g. CSVDataSet
    type: Optional[str]

    # the path to the actual data file for the underlying dataset.
    # only available if the dataset has filepath set.
    filepath: Optional[str]

    # the optional plot data if the underlying dataset has a plot.
    # currently only applicable for PlotlyDataSet
    plot: Optional[Dict] = None

    # the optional image data if the underlying dataset has a image.
    # currently only applicable for matplotlib.MatplotlibWriter
    image: Optional[str] = None

    tracking_data: Optional[Dict] = None

    # command to run the pipeline to this data node
    run_command: Optional[str] = None

    preview: Optional[Dict] = None

    stats: Optional[Dict] = None

    # TODO: improve this scheme.
    def __init__(self, data_node: DataNode, **data):
        super().__init__(**data)

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
    """Represent the metadata of a TranscodedDataNode"""

    # the path to the actual data file for the underlying dataset.
    # only available if the dataset has filepath set.
    filepath: Optional[str]

    run_command: Optional[str]

    original_type: str

    transcoded_types: List[str]

    stats: Optional[Dict] = None

    def __init__(self, transcoded_data_node: TranscodedDataNode, **data):
        super().__init__(**data)

        original_version = transcoded_data_node.original_version

        self.original_type = get_dataset_type(original_version)
        self.transcoded_types = [
            get_dataset_type(transcoded_version)
            for transcoded_version in transcoded_data_node.transcoded_versions
        ]

        dataset_description = original_version._describe()
        self.filepath = _parse_filepath(dataset_description)
        self.stats = transcoded_data_node.stats

        if not transcoded_data_node.is_free_input:
            self.run_command = (
                f"kedro run --to-outputs={transcoded_data_node.original_name}"
            )


class ParametersNodeMetadata(BaseModel):
    """Represent the metadata of a ParametersNode"""

    parameters: Dict

    def __init__(self, parameters_node: ParametersNode, **data):
        super().__init__(**data)

        if parameters_node.is_single_parameter():
            self.parameters = {
                parameters_node.parameter_name: parameters_node.parameter_value
            }
        else:
            self.parameters = parameters_node.parameter_value
