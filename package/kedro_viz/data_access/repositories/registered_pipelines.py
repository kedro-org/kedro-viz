"""`kedro_viz.data_access.repositories.registered_pipelines`
defines repository to centralise access to registered pipelines data."""
# pylint: disable=missing-class-docstring,missing-function-docstring
from collections import OrderedDict, defaultdict
from typing import Dict, List, Optional, Set

from kedro_viz.models.graph import RegisteredPipeline


class RegisteredPipelinesRepository:
    def __init__(self):
        self.pipelines_dict: Dict[str, RegisteredPipeline] = OrderedDict()
        self.pipelines_node_ids_mapping: Dict[str, Set[str]] = defaultdict(set)

    def add_pipeline(self, pipeline_id: str):
        self.pipelines_dict[pipeline_id] = RegisteredPipeline(id=pipeline_id)

    def add_node(self, pipeline_id: str, node_id: str):
        self.pipelines_node_ids_mapping[pipeline_id].add(node_id)

    def get_pipeline_by_id(self, pipeline_id: str) -> Optional[RegisteredPipeline]:
        return self.pipelines_dict.get(pipeline_id)

    def has_pipeline(self, pipeline_id: str) -> bool:
        return pipeline_id in self.pipelines_dict

    def as_list(self) -> List[RegisteredPipeline]:
        return list(self.pipelines_dict.values())

    def get_node_ids_by_pipeline_id(self, pipeline_id: str) -> Set[str]:
        return self.pipelines_node_ids_mapping[pipeline_id]
