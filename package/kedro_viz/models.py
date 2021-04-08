import abc
from dataclasses import dataclass, field, InitVar, asdict
import hashlib
import inspect
from pathlib import Path
from typing import Any, Dict, List, Optional, Union
from enum import Enum

from kedro.pipeline.node import Node as KedroNode
from kedro.io import AbstractDataSet


def _hash(value: str):
    return hashlib.sha1(value.encode("UTF-8")).hexdigest()[:8]


def _pretty_name(name: str) -> str:
    name = name.replace("-", " ").replace("_", " ")
    parts = [n.capitalize() for n in name.split()]
    return " ".join(parts)


def _expand_namespaces(namespace):
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


def _get_namespace(dataset_full_name):
    """
    Extract the namespace from the full dataset/parameter name.
    """
    if "." in dataset_full_name:
        # The last part of the namespace is the actual name of the dataset
        # e.g. in pipeline1.data_science.a, "pipeline1.data_science" indicates
        # the modular pipelines and "a" the name of the dataset.
        return dataset_full_name.rsplit(".", 1)[0]


class GraphNodeType(Enum):
    TASK = "task"
    DATA = "data"
    PARAMETERS = "parameters"


@dataclass
class GraphNode(abc.ABC):
    id: str
    name: str
    full_name: str
    tags: List[str]
    pipelines: List[str]

    @property
    def kedro_obj(self) -> Union[KedroNode, Optional[AbstractDataSet]]:
        return self._kedro_obj

    @classmethod
    def create_task_node(cls, node: KedroNode) -> "TaskNode":
        return TaskNode(
            id=_hash(str(node)),
            name=getattr(node, "short_name", node.name),
            full_name=getattr(node, "short_name", node.name),
            tags=list(sorted(node.tags)),
            pipelines=[],
            kedro_obj=node,
        )

    @classmethod
    def create_data_node(
        cls, full_name: str, layer: str, tags: List[str], dataset: AbstractDataSet
    ) -> "DataNode":
        return DataNode(
            id=_hash(full_name),
            name=_pretty_name(full_name),
            full_name=full_name,
            tags=tags,
            layer=layer,
            pipelines=[],
            kedro_obj=dataset,
        )

    @classmethod
    def create_parameters_node(
        cls, full_name: str, layer: str, tags: List[str], parameters: AbstractDataSet
    ) -> "ParametersNode":
        return ParametersNode(
            id=_hash(full_name),
            name=_pretty_name(full_name),
            full_name=full_name,
            tags=tags,
            layer=layer,
            pipelines=[],
            kedro_obj=parameters,
        )

    def add_pipeline(self, pipeline_key: str):
        self.pipelines.append(pipeline_key)

    def has_metadata(self) -> bool:
        return self.kedro_obj is not None


@dataclass
class GraphNodeMetadata(abc.ABC):
    pass


@dataclass
class TaskNode(GraphNode):
    kedro_obj: InitVar[KedroNode]
    modular_pipelines: List[str] = field(init=False)
    parameters: Dict = field(init=False, default_factory=dict)
    type: str = GraphNodeType.TASK.value

    def __post_init__(self, kedro_obj: KedroNode):
        self._kedro_obj = kedro_obj
        self.modular_pipelines = _expand_namespaces(
            _expand_namespaces(kedro_obj.namespace)
        )


@dataclass
class TaskNodeMetadata(GraphNodeMetadata):
    code: str = field(init=False)
    filepath: str = field(init=False)
    parameters: Dict = field(init=False)
    task_node: InitVar[TaskNode]

    def __post_init__(self, task_node: TaskNode):
        kedro_node: KedroNode = task_node.kedro_obj
        self.code = inspect.getsource(kedro_node._func)
        code_full_path = Path(inspect.getfile(kedro_node._func)).expanduser().resolve()
        filepath = code_full_path.relative_to(Path.cwd().parent)
        self.filepath = str(filepath)
        self.parameters = task_node.parameters


@dataclass
class DataNode(GraphNode):
    layer: str
    kedro_obj: InitVar[Optional[AbstractDataSet]]
    modular_pipelines: List[str] = field(init=False)
    type: str = GraphNodeType.DATA.value

    def __post_init__(self, kedro_obj: Optional[AbstractDataSet]):
        self._kedro_obj = kedro_obj
        self.modular_pipelines = _expand_namespaces(_get_namespace(self.full_name))


@dataclass
class DataNodeMetadata(GraphNodeMetadata):
    type: str = field(init=False, default=None)
    filepath: str = field(init=False, default=None)
    data_node: InitVar[DataNode]

    def __post_init__(self, data_node: DataNode):
        dataset: AbstractDataSet = data_node.kedro_obj
        self.type = f"{dataset.__class__.__module__}.{dataset.__class__.__qualname__}"
        self.filepath = str(dataset._describe().get("filepath"))


@dataclass
class ParametersNode(GraphNode):
    layer: str
    modular_pipelines: List[str] = field(init=False)
    kedro_obj: InitVar[AbstractDataSet]
    type: str = GraphNodeType.PARAMETERS.value

    def __post_init__(self, kedro_obj: AbstractDataSet):
        self._kedro_obj = kedro_obj
        if self.is_all_parameters():
            self.modular_pipelines = []
        else:
            self.modular_pipelines = _expand_namespaces(
                _get_namespace(self.parameter_name)
            )

    def is_all_parameters(self) -> bool:
        return self.full_name == "parameters"

    def is_single_parameter(self) -> bool:
        return not self.is_all_parameters()

    @property
    def parameter_name(self) -> str:
        return self.full_name.replace("params:", "")

    @property
    def parameter_value(self) -> Any:
        return self.kedro_obj.load()


@dataclass
class ParametersNodeMetadata(GraphNodeMetadata):
    parameters: Dict = field(init=False)
    parameters_node: InitVar[ParametersNode]

    def __post_init__(self, parameters_node: ParametersNode):
        if parameters_node.is_single_parameter():
            self.parameters = {
                parameters_node.parameter_name: parameters_node.parameter_value
            }
        else:
            self.parameters = parameters_node.parameter_value
