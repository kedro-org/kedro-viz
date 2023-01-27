"""`kedro_viz.models.flowchart` defines data models to represent Kedro entities in a viz graph."""
# pylint: disable=protected-access
import abc
import hashlib
import inspect
import json as json_stdlib
import logging
import re
from dataclasses import InitVar, dataclass, field
from datetime import datetime
from enum import Enum
from pathlib import Path
from types import FunctionType
from typing import Any, Dict, List, Optional, Set, Union, cast

import pandas as pd
import plotly.express as px
import plotly.io as pio
from kedro.io import AbstractDataSet
from kedro.io.core import VERSION_FORMAT, DataSetError
from kedro.pipeline.node import Node as KedroNode
from kedro.pipeline.pipeline import TRANSCODING_SEPARATOR, _strip_transcoding
from pandas.core.frame import DataFrame

logger = logging.getLogger(__name__)


def _pretty_name(name: str) -> str:
    name = name.replace("-", " ").replace("_", " ").replace(":", ": ")
    parts = [n.capitalize() for n in name.split()]
    return " ".join(parts)


def _strip_namespace(name: str) -> str:
    pattern = re.compile(r"[A-Za-z0-9-_]+\.")
    return re.sub(pattern, "", name)


def _parse_filepath(dataset_description: Dict[str, Any]) -> Optional[str]:
    filepath = dataset_description.get("filepath") or dataset_description.get("path")
    return str(filepath) if filepath else None


def _get_dataset_type(kedro_object) -> str:
    """Get dataset class and the two last parts of the module part."""
    class_name = f"{kedro_object.__class__.__qualname__}"
    _, dataset_type, dataset_file = f"{kedro_object.__class__.__module__}".rsplit(
        ".", 2
    )
    return f"{dataset_type}.{dataset_file}.{class_name}"


@dataclass
class RegisteredPipeline:
    """Represent a registered pipeline in a Kedro project"""

    id: str
    name: str = field(init=False)

    def __post_init__(self):
        self.name = _pretty_name(self.id)


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


@dataclass(frozen=True)
class ModularPipelineChild:
    """Represent a child of a modular pipeline."""

    id: str
    type: GraphNodeType


@dataclass
class Tag(RegisteredPipeline):
    """Represent a tag"""

    def __hash__(self) -> int:
        return hash(self.id)


# pylint: disable=too-many-instance-attributes
@dataclass
class GraphNode(abc.ABC):
    """Represent a node in the graph representation of a Kedro pipeline"""

    # a unique identifier for the node in the graph
    # obtained by hashing the node's string representation
    id: str

    # the pretty name of a node
    name: str

    # the full name of this node obtained from the underlying Kedro object
    full_name: str

    # the type of the graph node
    type: str

    # the underlying Kedro object for each graph node, if any
    kedro_obj: Optional[Union[KedroNode, AbstractDataSet]] = field(default=None)

    # the tags associated with this node
    tags: Set[str] = field(default_factory=set)

    # the set of registered pipeline IDs this node belongs to
    pipelines: Set[str] = field(default_factory=set)

    # The original namespace on this node.
    # N.B.: in Kedro, modular pipeline is implemented by declaring namespace on a node.
    # For example, node(func, namespace="uk.de") means this node belongs
    # to the modular pipeline "uk" and "uk.de"
    namespace: Optional[str] = field(init=False, default=None)

    # The list of modular pipeline this node belongs to.
    modular_pipelines: Optional[List[str]] = field(init=False)

    @staticmethod
    def _hash(value: str):
        return hashlib.sha1(value.encode("UTF-8")).hexdigest()[:8]

    @staticmethod
    def _get_namespace(dataset_full_name: str) -> Optional[str]:
        """Extract the namespace from the full dataset/parameter name.
        Args:
            dataset_full_name: The full name of the dataset.
        Returns:
            The namespace of this dataset, if available.
        Example:
            >>> GraphNode._get_namespace("pipeline.dataset")
            'pipeline'
        """
        if "." not in dataset_full_name:
            return None

        return dataset_full_name.rsplit(".", 1)[0]

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
        return TaskNode(
            id=cls._hash(str(node)),
            name=_pretty_name(node_name),
            full_name=node_name,
            tags=set(node.tags),
            kedro_obj=node,
        )

    @classmethod
    def create_data_node(
        cls,
        full_name: str,
        layer: Optional[str],
        tags: Set[str],
        dataset: AbstractDataSet,
        is_free_input: bool = False,
    ) -> Union["DataNode", "TranscodedDataNode"]:
        """Create a graph node of type DATA for a given Kedro DataSet instance.
        Args:
            full_name: The fullname of the dataset, including namespace, e.g.
                data_science.master_table.
            layer: The optional layer that the dataset belongs to.
            tags: The set of tags assigned to assign to the graph representation
                of this dataset. N.B. currently it's derived from the node's tags.
            dataset: A dataset in a Kedro pipeline.
            is_free_input: Whether the dataset is a free input in the pipeline
        Returns:
            An instance of DataNode.
        """
        is_transcoded_dataset = TRANSCODING_SEPARATOR in full_name
        if is_transcoded_dataset:
            dataset_name = _strip_transcoding(full_name)
            return TranscodedDataNode(
                id=cls._hash(dataset_name),
                name=_pretty_name(_strip_namespace(dataset_name)),
                full_name=dataset_name,
                tags=tags,
                layer=layer,
                is_free_input=is_free_input,
            )

        return DataNode(
            id=cls._hash(full_name),
            name=_pretty_name(_strip_namespace(full_name)),
            full_name=full_name,
            tags=tags,
            layer=layer,
            kedro_obj=dataset,
            is_free_input=is_free_input,
        )

    @classmethod
    def create_parameters_node(
        cls,
        full_name: str,
        layer: Optional[str],
        tags: Set[str],
        parameters: AbstractDataSet,
    ) -> "ParametersNode":
        """Create a graph node of type PARAMETERS for a given Kedro parameters dataset instance.
        Args:
            full_name: The fullname of the dataset, including namespace, e.g.
                data_science.test_split_ratio
            layer: The optional layer that the parameters belong to.
            tags: The set of tags assigned to assign to the graph representation
                of this dataset. N.B. currently it's derived from the node's tags.
            parameters: A parameters dataset in a Kedro pipeline.
        Returns:
            An instance of ParametersNode.
        """
        return ParametersNode(
            id=cls._hash(full_name),
            name=_pretty_name(_strip_namespace(full_name)),
            full_name=full_name,
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
            >>> assert node.name == "Data Science"
            >>> assert node.type == GraphNodeType.MODULAR_PIPELINE
        """
        return ModularPipelineNode(
            id=modular_pipeline_id,
            name=_pretty_name(_strip_namespace(modular_pipeline_id)),
            full_name=modular_pipeline_id,
        )

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


@dataclass
class GraphNodeMetadata(abc.ABC):
    """Represent a graph node's metadata"""


@dataclass
class TaskNode(GraphNode):
    """Represent a graph node of type TASK"""

    modular_pipelines: List[str] = field(init=False)
    parameters: Dict = field(init=False, default_factory=dict)
    type: str = GraphNodeType.TASK.value

    def __post_init__(self):
        self.namespace = self.kedro_obj.namespace

        # the modular pipelines that a task node belongs to are derived from its namespace.
        self.modular_pipelines = self._expand_namespaces(self.kedro_obj.namespace)


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


@dataclass
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
    children: Set[ModularPipelineChild] = field(default_factory=set)

    # Keep track of a modular pipeline's inputs and outputs, both internal and external.
    # Internal inputs/outputs are IDs of the datasets not connected to any nodes external
    # to the pipeline.External inputs/outputs are IDs of the datasets used to connect
    # this modular pipeline to other modular pipelines in the whole registered pipeline.
    # In practical term, external inputs/outputs are the ones explicitly specified
    # when using the pipeline() factory function.
    # More information can be found here:
    # https://kedro.readthedocs.io/en/latest/06_nodes_and_pipelines/03_modular_pipelines.html#how-to-connect-existing-pipelines
    internal_inputs: Set[str] = field(default_factory=set)
    internal_outputs: Set[str] = field(default_factory=set)
    external_inputs: Set[str] = field(default_factory=set)
    external_outputs: Set[str] = field(default_factory=set)

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


@dataclass
class TaskNodeMetadata(GraphNodeMetadata):
    """Represent the metadata of a TaskNode"""

    # the source code of the node's function
    code: Optional[str] = field(init=False)

    # path to the file where the node is defined
    filepath: Optional[str] = field(init=False)

    # parameters of the node, if available
    parameters: Optional[Dict] = field(init=False, default=None)

    # command to run the pipeline to this node
    run_command: Optional[str] = field(init=False, default=None)

    inputs: List[str] = field(init=False)

    outputs: List[str] = field(init=False)

    # the task node to which this metadata belongs
    task_node: InitVar[TaskNode]

    def __post_init__(self, task_node: TaskNode):
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
        self.inputs = [
            _pretty_name(_strip_namespace(name)) for name in kedro_node.inputs
        ]
        self.outputs = [
            _pretty_name(_strip_namespace(name)) for name in kedro_node.outputs
        ]

        # if a node doesn't have a user-supplied `_name` attribute,
        # a human-readable run command `kedro run --to-nodes/nodes` is not available
        if kedro_node._name is not None:
            self.run_command = f'kedro run --to-nodes="{kedro_node._name}"'


# pylint: disable=too-many-instance-attributes
@dataclass
class DataNode(GraphNode):
    """Represent a graph node of type DATA"""

    # whether the data node is a free input
    is_free_input: bool = field(default=False)

    # the layer that this data node belongs to
    layer: Optional[str] = field(default=None)

    # the concrete type of the underlying kedro_obj
    dataset_type: Optional[str] = field(init=False)

    # the list of modular pipelines this data node belongs to
    modular_pipelines: List[str] = field(init=False)

    # command to run the pipeline to this node
    run_command: Optional[str] = field(init=False, default=None)

    # the type of this graph node, which is DATA
    type: str = GraphNodeType.DATA.value

    def __post_init__(self):

        self.dataset_type = (
            _get_dataset_type(self.kedro_obj) if self.kedro_obj else None
        )

        # the modular pipelines that a data node belongs to
        # are derived from its namespace, which in turn
        # is derived from the dataset's name.
        self.namespace = self._get_namespace(self.full_name)
        self.modular_pipelines = self._expand_namespaces(
            self._get_namespace(self.full_name)
        )

    # TODO: improve this scheme.
    def is_plot_node(self):
        """Check if the current node is a plot node.
        Currently it only recognises one underlying dataset as a plot node.
        In the future, we might want to make this generic.
        """
        return self.dataset_type in (
            "plotly.plotly_dataset.PlotlyDataSet",
            "plotly.json_dataset.JSONDataSet",
        )

    def is_image_node(self):
        """Check if the current node is a matplotlib image node."""
        return self.dataset_type == "matplotlib.matplotlib_writer.MatplotlibWriter"

    def is_metric_node(self):
        """Check if the current node is a metrics node."""
        return self.dataset_type == "tracking.metrics_dataset.MetricsDataSet"

    def is_json_node(self):
        """Check if the current node is a JSONDataSet node."""
        return self.dataset_type == "tracking.json_dataset.JSONDataSet"

    def is_tracking_node(self):
        """Checks if the current node is a tracking data node"""
        return self.is_json_node() or self.is_metric_node()


@dataclass
class TranscodedDataNode(GraphNode):
    """Represent a graph node of type DATA"""

    # whether the data node is a free input
    is_free_input: bool = field(default=False)

    # the layer that this data node belongs to
    layer: Optional[str] = field(default=None)

    # the original Kedro's AbstractDataSet for this transcoded data node
    original_version: AbstractDataSet = field(init=False)

    # keep track of the original name for the generated run command
    original_name: str = field(init=False)

    # the transcoded versions of this transcoded data nodes
    transcoded_versions: Set[AbstractDataSet] = field(init=False, default_factory=set)

    # the list of modular pipelines this data node belongs to
    modular_pipelines: List[str] = field(init=False)

    # command to run the pipeline to this node
    run_command: Optional[str] = field(init=False, default=None)

    # the type of this graph node, which is DATA
    type: str = GraphNodeType.DATA.value

    def has_metadata(self) -> bool:
        return True

    def __post_init__(self):
        # the modular pipelines that a data node belongs to
        # are derived from its namespace, which in turn
        # is derived from the dataset's name.
        self.namespace = self._get_namespace(self.full_name)
        self.modular_pipelines = self._expand_namespaces(
            self._get_namespace(self.full_name)
        )


@dataclass
class DataNodeMetadata(GraphNodeMetadata):
    """Represent the metadata of a DataNode"""

    # the dataset type for this data node, e.g. CSVDataSet
    type: Optional[str] = field(init=False)

    # the path to the actual data file for the underlying dataset.
    # only available if the dataset has filepath set.
    filepath: Optional[str] = field(init=False)

    # the underlying data node to which this metadata belongs
    data_node: InitVar[DataNode]

    # the optional plot data if the underlying dataset has a plot.
    # currently only applicable for PlotlyDataSet
    plot: Optional[Dict] = field(init=False, default=None)

    # the optional image data if the underlying dataset has a image.
    # currently only applicable for matplotlib.MatplotlibWriter
    image: Optional[str] = field(init=False, default=None)

    tracking_data: Optional[Dict] = field(init=False, default=None)

    # command to run the pipeline to this data node
    run_command: Optional[str] = field(init=False, default=None)

    # TODO: improve this scheme.
    def __post_init__(self, data_node: DataNode):
        self.type = data_node.dataset_type
        dataset = cast(AbstractDataSet, data_node.kedro_obj)
        dataset_description = dataset._describe()
        self.filepath = _parse_filepath(dataset_description)

        # Run command is only available if a node is an output, i.e. not a free input
        if not data_node.is_free_input:
            self.run_command = f'kedro run --to-outputs="{data_node.full_name}"'

        # Only check for existence of dataset if we might want to load it.
        if not (
            data_node.is_plot_node()
            or data_node.is_image_node()
            or data_node.is_tracking_node()
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

            if data_node.is_metric_node():
                metrics_data = self.load_versioned_tracking_data(self.filepath)
                if not metrics_data:
                    return
                self.plot = self.create_metrics_plot(
                    pd.DataFrame.from_dict(metrics_data, orient="index")
                )

    # TODO: improve this scheme.
    @staticmethod
    def load_versioned_tracking_data(
        filepath: Optional[str] = None, num_versions: int = 10
    ) -> Optional[Dict[datetime, Any]]:
        """Load data for multiple versions of the metrics dataset
        Args:
            filepath: the path whether the dataset is located.
            num_versions: the maximum number of past versions we want to load.
        Returns:
            A dictionary containing the version and the json data inside each version
        """
        if not filepath:
            return None  # pragma: no cover

        version_list = [
            path
            for path in sorted(Path(filepath).iterdir(), reverse=True)
            if path.is_dir()
        ]
        versions = {}
        for version in version_list[:num_versions]:
            try:
                run_id = datetime.strptime(version.name, VERSION_FORMAT)
            except ValueError:
                logger.warning(
                    """Expected run_id (timestamp) of format YYYY-MM-DDTHH:MM:SS.ffffff.
                    Skip when loading tracking data."""
                )
                continue
            else:
                path = version / Path(filepath).name
                with open(path, encoding="utf8") as fs_file:
                    versions[run_id] = json_stdlib.load(fs_file)
        return versions

    @staticmethod
    def create_metrics_plot(data_frame: DataFrame) -> Dict[str, Any]:
        """
        Args:
            data_frame: dataframe with the metrics data from all versions
        Returns:
            a plotly line chart object with metrics data
        """
        renamed_df = data_frame.reset_index().rename(columns={"index": "version"})
        melted_sorted_df = pd.melt(
            renamed_df, id_vars="version", var_name="metrics"
        ).sort_values(by="version")
        return json_stdlib.loads(
            pio.to_json(
                px.line(
                    melted_sorted_df,
                    x="version",
                    y="value",
                    color="metrics",
                    title="Metrics trend",
                )
            )
        )


@dataclass
class TranscodedDataNodeMetadata(GraphNodeMetadata):
    """Represent the metadata of a TranscodedDataNode"""

    # the path to the actual data file for the underlying dataset.
    # only available if the dataset has filepath set.
    filepath: Optional[str] = field(init=False)

    run_command: Optional[str] = field(init=False)

    original_type: str = field(init=False)

    transcoded_types: List[str] = field(init=False)

    # the underlying data node to which this metadata belongs
    transcoded_data_node: InitVar[TranscodedDataNode]

    def __post_init__(self, transcoded_data_node: TranscodedDataNode):
        original_version = transcoded_data_node.original_version

        self.original_type = _get_dataset_type(original_version)
        self.transcoded_types = [
            _get_dataset_type(transcoded_version)
            for transcoded_version in transcoded_data_node.transcoded_versions
        ]

        dataset_description = original_version._describe()
        self.filepath = _parse_filepath(dataset_description)

        if not transcoded_data_node.is_free_input:
            self.run_command = (
                f'kedro run --to-outputs="{transcoded_data_node.original_name}"'
            )


@dataclass
class ParametersNode(GraphNode):
    """Represent a graph node of type PARAMETERS"""

    # the layer that this parameters node belongs to
    layer: Optional[str] = field(default=None)

    # the list of modular pipelines this parameters node belongs to
    modular_pipelines: List[str] = field(init=False)

    # the type of this graph node, which is PARAMETERS
    type: str = GraphNodeType.PARAMETERS.value

    def __post_init__(self):
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
        return self.full_name == "parameters"

    def is_single_parameter(self) -> bool:
        """Check whether the graph node represent a single parameter in the pipeline"""
        return not self.is_all_parameters()

    @property
    def parameter_name(self) -> str:
        """Get a normalised parameter name without the "params:" prefix"""
        return self.full_name.replace("params:", "")

    @property
    def parameter_value(self) -> Any:
        """Load the parameter value from the underlying dataset"""
        self.kedro_obj: AbstractDataSet
        try:
            return self.kedro_obj.load()
        except (AttributeError, DataSetError):
            # This except clause triggers if the user passes a parameter that is not
            # defined in the catalog (DataSetError) it also catches any case where
            # the kedro_obj is None (AttributeError) -- GH#1231
            logger.warning(
                "Cannot find parameter `%s` in the catalog.", self.parameter_name
            )
            return None


@dataclass
class ParametersNodeMetadata:
    """Represent the metadata of a ParametersNode"""

    parameters: Dict = field(init=False)
    parameters_node: InitVar[ParametersNode]

    def __post_init__(self, parameters_node: ParametersNode):
        if parameters_node.is_single_parameter():
            self.parameters = {
                parameters_node.parameter_name: parameters_node.parameter_value
            }
        else:
            self.parameters = parameters_node.parameter_value


@dataclass(frozen=True)
class GraphEdge:
    """Represent an edge in the graph"""

    source: str
    target: str
