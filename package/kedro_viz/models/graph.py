# Copyright 2021 QuantumBlack Visual Analytics Limited
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
# EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
# OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND
# NONINFRINGEMENT. IN NO EVENT WILL THE LICENSOR OR OTHER CONTRIBUTORS
# BE LIABLE FOR ANY CLAIM, DAMAGES, OR OTHER LIABILITY, WHETHER IN AN
# ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF, OR IN
# CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
#
# The QuantumBlack Visual Analytics Limited ("QuantumBlack") name and logo
# (either separately or in combination, "QuantumBlack Trademarks") are
# trademarks of QuantumBlack. The License does not grant you any right or
# license to the QuantumBlack Trademarks. You may not use the QuantumBlack
# Trademarks or any confusingly similar mark as a trademark for your product,
# or use the QuantumBlack Trademarks in any other manner that might cause
# confusion in the marketplace, including but not limited to in advertising,
# on websites, or on software.
#
# See the License for the specific language governing permissions and
# limitations under the License.
"""`kedro_viz.models.graph` defines data models to represent Kedro entities in a viz graph."""
# pylint: disable=protected-access
import abc
import hashlib
import inspect
import json
import logging
import re
from dataclasses import InitVar, dataclass, field
from datetime import datetime
from enum import Enum
from pathlib import Path
from types import FunctionType
from typing import TYPE_CHECKING, Any, Dict, List, Optional, Set, Union, cast

import pandas as pd
import plotly.express as px
import plotly.io as pio
from kedro.io import AbstractDataSet
from kedro.io.core import VERSION_FORMAT, get_filepath_str
from kedro.pipeline.node import Node as KedroNode
from kedro.pipeline.pipeline import TRANSCODING_SEPARATOR, _strip_transcoding
from pandas.core.frame import DataFrame

# only import MetricsDataSet at top-level for type-checking
# so it doesn't blow up if user doesn't have the dataset dependencies installed.
if TYPE_CHECKING:  # pragma: no cover
    from kedro.extras.datasets.tracking.metrics_dataset import MetricsDataSet


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


@dataclass
class RegisteredPipeline:
    """Represent a registered pipeline in a Kedro project"""

    id: str
    name: str = field(init=False)

    def __post_init__(self):
        self.name = _pretty_name(self.id)


@dataclass
class ModularPipeline:
    """Represent a modular pipeline within a registered pipeline"""

    id: str
    name: str = field(init=False)

    def __post_init__(self):
        # prettify the last bit of the modular pipaline name, i.e. without the namespace
        self.name = _pretty_name(self.id.split(".")[-1])


@dataclass
class Tag(RegisteredPipeline):
    """Represent a tag"""

    def __hash__(self) -> int:
        return hash(self.id)


class GraphNodeType(Enum):
    """Represent all possible node types in the graph representation of a Kedro pipeline"""

    TASK = "task"
    DATA = "data"
    PARAMETERS = "parameters"


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

    # the tags associated with this node
    tags: Set[str]

    # the list of registered pipeline IDs this node belongs to
    pipelines: List[str]

    # the list of modular pipeline this node belongs to
    modular_pipelines: List[str] = field(init=False)

    # the underlying Kedro object for this node
    _kedro_obj: Union[KedroNode, Optional[AbstractDataSet]] = field(
        init=False, default=None
    )

    @staticmethod
    def _hash(value: str):
        return hashlib.sha1(value.encode("UTF-8")).hexdigest()[:8]

    @staticmethod
    def _get_namespace(dataset_full_name: str) -> Optional[str]:
        """
        Extract the namespace from the full dataset/parameter name.
        """
        if "." not in dataset_full_name:
            return None

        # The last part of the namespace is the actual name of the dataset
        # e.g. in pipeline1.data_science.a, "pipeline1.data_science" indicates
        # the modular pipelines and "a" the name of the dataset.
        return dataset_full_name.rsplit(".", 1)[0]

    @staticmethod
    def _expand_namespaces(namespace: Optional[str]) -> List[str]:
        """
        Expand a node's namespace to the modular pipelines this node belongs to.
        For example, if the node's namespace is: "pipeline1.data_science"
        it should be expanded to: ["pipeline1", "pipeline1.data_science"]
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

    @property
    def kedro_obj(self) -> Union[KedroNode, Optional[AbstractDataSet]]:
        """For every node in the graph representation of a Kedro pipeline,
        there might be an underlying Kedro object stored at `self._kedro_obj`.
        For example, it could be a Node or a DataSet object.
        """
        return self._kedro_obj

    @classmethod
    def create_task_node(cls, node: KedroNode) -> "TaskNode":
        """Create a graph node of type TASK for a given Kedro Node instance.
        Args:
            node: A node in a Kedro pipeline.
        Returns:
            An instance of TaskNode.
        """
        return TaskNode(
            id=cls._hash(str(node)),
            name=_pretty_name(getattr(node, "short_name", node.name)),
            full_name=getattr(node, "short_name", node.name),
            tags=set(node.tags),
            pipelines=[],
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
                name=_pretty_name(dataset_name),
                full_name=dataset_name,
                tags=tags,
                layer=layer,
                pipelines=[],
                is_free_input=is_free_input,
            )

        return DataNode(
            id=cls._hash(full_name),
            name=_pretty_name(_strip_namespace(full_name)),
            full_name=full_name,
            tags=tags,
            layer=layer,
            pipelines=[],
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
            pipelines=[],
            kedro_obj=parameters,
        )

    def add_pipeline(self, pipeline_id: str):
        """Add a pipeline_id to the list of pipelines that this node belongs to."""
        if pipeline_id not in self.pipelines:
            self.pipelines.append(pipeline_id)

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

    kedro_obj: InitVar[KedroNode]
    modular_pipelines: List[str] = field(init=False)
    parameters: Dict = field(init=False, default_factory=dict)
    type: str = GraphNodeType.TASK.value

    def __post_init__(self, kedro_obj: KedroNode):
        self._kedro_obj = kedro_obj

        # the modular pipelines that a task node belongs to are derived from its namespace.
        self.modular_pipelines = self._expand_namespaces(kedro_obj.namespace)


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
class TaskNodeMetadata(GraphNodeMetadata):
    """Represent the metadata of a TaskNode"""

    # the source code of the node's function
    code: str = field(init=False)

    # path to the file where the node is defined
    filepath: str = field(init=False)

    # parameters of the node, if available
    parameters: Dict = field(init=False)

    # command to run the pipeline to this node
    run_command: Optional[str] = field(init=False, default=None)

    # the task node to which this metadata belongs
    task_node: InitVar[TaskNode]

    def __post_init__(self, task_node: TaskNode):
        kedro_node = cast(KedroNode, task_node.kedro_obj)
        self.code = inspect.getsource(
            _extract_wrapped_func(cast(FunctionType, kedro_node._func))
        )
        code_full_path = Path(inspect.getfile(kedro_node._func)).expanduser().resolve()
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
    is_free_input: bool

    # the layer that this data node belongs to
    layer: Optional[str]

    # the underlying Kedro's AbstractDataSet for this data node
    kedro_obj: InitVar[Optional[AbstractDataSet]]

    # the concrete type of the underlying kedro_obj
    dataset_type: Optional[str] = field(init=False)

    # the list of modular pipelines this data node belongs to
    modular_pipelines: List[str] = field(init=False)

    # command to run the pipeline to this node
    run_command: Optional[str] = field(init=False, default=None)

    # the type of this graph node, which is DATA
    type: str = GraphNodeType.DATA.value

    def __post_init__(self, kedro_obj: Optional[AbstractDataSet]):
        self._kedro_obj = kedro_obj
        self.dataset_type = (
            f"{kedro_obj.__class__.__module__}.{kedro_obj.__class__.__qualname__}"
            if self.kedro_obj
            else None
        )

        # the modular pipelines that a data node belongs to
        # are derived from its namespace, which in turn
        # is derived from the dataset's name.
        self.modular_pipelines = self._expand_namespaces(
            self._get_namespace(self.full_name)
        )

    def is_plot_node(self):
        """Check if the current node is a plot node.
        Currently it only recognises one underlying dataset as a plot node.
        In the future, we might want to make this generic.
        """
        return (
            self.dataset_type
            == "kedro.extras.datasets.plotly.plotly_dataset.PlotlyDataSet"
        )

    def is_metric_node(self):
        """Check if the current node is a metrics node."""
        return (
            self.dataset_type
            == "kedro.extras.datasets.tracking.metrics_dataset.MetricsDataSet"
        )


@dataclass
class TranscodedDataNode(GraphNode):
    """Represent a graph node of type DATA"""

    # whether the data node is a free input
    is_free_input: bool

    # the layer that this data node belongs to
    layer: Optional[str]

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
    plot: Optional[Dict] = field(init=False)

    metrics: Optional[Dict] = field(init=False)

    # command to run the pipeline to this data node
    run_command: Optional[str] = field(init=False, default=None)

    def __post_init__(self, data_node: DataNode):
        # pylint: disable=import-outside-toplevel
        self.type = data_node.dataset_type
        dataset = cast(AbstractDataSet, data_node.kedro_obj)
        dataset_description = dataset._describe()
        self.filepath = _parse_filepath(dataset_description)
        # Parse plot data
        if data_node.is_plot_node():
            from kedro.extras.datasets.plotly.plotly_dataset import PlotlyDataSet

            dataset = cast(PlotlyDataSet, dataset)
            if not dataset._exists():
                return

            load_path = get_filepath_str(dataset._get_load_path(), dataset._protocol)
            with dataset._fs.open(load_path, **dataset._fs_open_args_load) as fs_file:
                self.plot = json.load(fs_file)

        if data_node.is_metric_node():
            from kedro.extras.datasets.tracking.metrics_dataset import MetricsDataSet

            dataset = cast(MetricsDataSet, dataset)
            if not dataset._exists() or self.filepath is None:
                return
            metrics = self.load_latest_metrics_data(dataset)
            if not metrics:
                return
            self.metrics = metrics
            metrics_data = self.load_metrics_versioned_data(self.filepath)
            if not metrics_data:
                return
            self.plot = self.create_metrics_plot(
                pd.DataFrame.from_dict(metrics_data, orient="index")
            )

        # Run command is only available if a node is an output, i.e. not a free input
        if not data_node.is_free_input:
            self.run_command = f'kedro run --to-outputs="{data_node.full_name}"'

    @staticmethod
    def load_latest_metrics_data(
        dataset: "MetricsDataSet",
    ) -> Optional[Dict[str, float]]:
        """Load data for latest versions of the metrics dataset.
        Below operation is also on kedro.io.core -> fetched_latest_load_version()
        However it is a cached function and hence cannot be relied upon
        Args:
            dataset: the latest version of the metrics dataset
        Returns:
            A dictionary containing json data for the latest version
        """
        pattern = str(dataset._get_versioned_path("*"))
        version_paths = sorted(dataset._glob_function(pattern), reverse=True)
        most_recent = next(
            (path for path in version_paths if dataset._exists_function(path)), None
        )
        if not most_recent:
            return None
        with dataset._fs.open(most_recent, **dataset._fs_open_args_load) as fs_file:
            return json.load(fs_file)

    @staticmethod
    def load_metrics_versioned_data(
        filepath: str, num_versions: int = 10
    ) -> Optional[Dict[datetime, Any]]:
        """Load data for multiple versions of the metrics dataset
        Args:
            filepath: the path whether the dataset is located.
            num_versions: the maximum number of past versions we want to load.
        Returns:
            A dictionary containing the version and the json data inside each version
        """
        version_list = [
            path
            for path in sorted(Path(filepath).iterdir(), reverse=True)
            if path.is_dir()
        ]
        versions = {}
        for version in version_list[:num_versions]:
            try:
                timestamp = datetime.strptime(version.name, VERSION_FORMAT)
            except ValueError:
                logger.warning(
                    """Expected timestamp of format YYYY-MM-DDTHH:MM:SS.ffffff.
                    Skip when loading metrics."""
                )
                continue
            else:
                path = version / Path(filepath).name
                with open(path) as fs_file:
                    versions[timestamp] = json.load(fs_file)
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
        return json.loads(
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
        self.original_type = (
            f"{original_version.__class__.__module__}."
            f"{original_version.__class__.__qualname__}"
        )
        self.transcoded_types = [
            f"{transcoded_version.__class__.__module__}."
            f"{transcoded_version.__class__.__qualname__}"
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
    layer: Optional[str]

    # the underlying Kedro's AbstractDataSet for this parameters node
    # n.b. for parameters, this is always MemoryDataSet
    kedro_obj: InitVar[AbstractDataSet]

    # the list of modular pipelines this parameters node belongs to
    modular_pipelines: List[str] = field(init=False)

    # the type of this graph node, which is PARAMETERS
    type: str = GraphNodeType.PARAMETERS.value

    def __post_init__(self, kedro_obj: AbstractDataSet):
        self._kedro_obj = kedro_obj
        if self.is_all_parameters():
            self.modular_pipelines = []
        else:
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
        self._kedro_obj: AbstractDataSet
        if self._kedro_obj is None:
            logger.warning(
                "Cannot find parameter `%s` in the catalog.", self.parameter_name
            )
            return None
        return self._kedro_obj.load()


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
