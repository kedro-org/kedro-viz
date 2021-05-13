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
from dataclasses import InitVar, dataclass, field
from enum import Enum
from pathlib import Path
from typing import Any, Dict, List, Optional, Set, Union

from kedro.io import AbstractDataSet
from kedro.pipeline.node import Node as KedroNode


def _pretty_name(name: str) -> str:
    name = name.replace("-", " ").replace("_", " ")
    parts = [n.capitalize() for n in name.split()]
    return " ".join(parts)


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


class GraphNodeType(Enum):
    """Represents all possible node types in the graph representation
    of a Kedro pipeline"""

    TASK = "task"
    DATA = "data"
    PARAMETERS = "parameters"


@dataclass
class GraphNode(abc.ABC):
    """Represent a node in the graph representation of a Kedro pipeline"""

    id: str
    name: str
    full_name: str
    tags: Set[str]

    # in the future this will be modelled as a many-to-many relationship
    # in a database
    pipelines: List[str]

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
        The value will be set by the concrete implementation of this abstract class,
        hence the pylint disable.
        """
        return self._kedro_obj  # pylint: disable=no-member

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
    ) -> "DataNode":
        """Create a graph node of type DATA for a given Kedro DataSet instance.

        Args:
            full_name: The fullname of the dataset, including namespace, e.g.
                data_science.master_table.
            layer: The optional layer that the dataset belongs to.
            tags: The set of tags assigned to assign to the graph representation
                of this dataset. N.B. currently it's derived from the node's tags.
            dataset: A dataset in a Kedro pipeline.
        Returns:
            An instance of DataNode.
        """
        return DataNode(
            id=cls._hash(full_name),
            name=_pretty_name(full_name),
            full_name=full_name,
            tags=tags,
            layer=layer,
            pipelines=[],
            kedro_obj=dataset,
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
            An instance of Parameters.
        """
        return ParametersNode(
            id=cls._hash(full_name),
            name=_pretty_name(full_name),
            full_name=full_name,
            tags=tags,
            layer=layer,
            pipelines=[],
            kedro_obj=parameters,
        )

    def belong_to_pipeline(self, pipeline_id: str) -> bool:
        """Check whether this graph node belongs to a given pipeline_id."""
        return pipeline_id in self.pipelines

    def add_pipeline(self, pipeline_id: str):
        """Add a pipeline_id to the list of pipelines that this node belongs to."""
        if pipeline_id not in self.pipelines:
            self.pipelines.append(pipeline_id)

    def have_metadata(self) -> bool:
        """Check whether this graph node has metadata.
        Since metadata of a graph node is derived from the underlying Kedro object,
        we just need to check whether the underlying object exists.
        """
        return self.kedro_obj is not None


@dataclass
class GraphNodeMetadata(abc.ABC):
    """Abstract class to represents a graph node's metadata"""


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


@dataclass
class TaskNodeMetadata(GraphNodeMetadata):
    """Represent the metadata of a TaskNode"""

    code: str = field(init=False)
    filepath: str = field(init=False)
    parameters: Dict = field(init=False)
    task_node: InitVar[TaskNode]

    def __post_init__(self, task_node: TaskNode):
        kedro_node: KedroNode = task_node.kedro_obj
        self.code = inspect.getsource(kedro_node._func)
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


@dataclass
class DataNode(GraphNode):
    """Represent a graph node of type DATA"""

    layer: Optional[str]
    kedro_obj: InitVar[Optional[AbstractDataSet]]
    modular_pipelines: List[str] = field(init=False)
    type: str = GraphNodeType.DATA.value

    def __post_init__(self, kedro_obj: Optional[AbstractDataSet]):
        self._kedro_obj = kedro_obj

        # the modular pipelines that a data node belongs to
        # are derived from its namespace, which in turn
        # is derived from the dataset's name.
        self.modular_pipelines = self._expand_namespaces(
            self._get_namespace(self.full_name)
        )


@dataclass
class DataNodeMetadata(GraphNodeMetadata):
    """Represent the metadata of a DataNode"""

    type: str = field(init=False, default=None)
    filepath: str = field(init=False, default=None)
    data_node: InitVar[DataNode]

    def __post_init__(self, data_node: DataNode):
        dataset: AbstractDataSet = data_node.kedro_obj
        self.type = f"{dataset.__class__.__module__}.{dataset.__class__.__qualname__}"
        self.filepath = str(dataset._describe().get("filepath"))


@dataclass
class ParametersNode(GraphNode):
    """Represent a graph node of type PARAMETERS"""

    layer: Optional[str]
    kedro_obj: InitVar[AbstractDataSet]
    modular_pipelines: List[str] = field(init=False)
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
        return self.kedro_obj.load()


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
