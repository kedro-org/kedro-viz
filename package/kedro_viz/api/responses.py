"""`kedro_viz.api.responses` defines API response types"""
# pylint: disable=missing-class-docstring,too-few-public-methods
import abc
from typing import Dict, List, Optional, Union

from pydantic import BaseModel

from kedro_viz.data_access import data_access_manager


class APIErrorMessage(BaseModel):
    message: str


class BaseAPIResponse(BaseModel, abc.ABC):
    class Config:
        orm_mode = True


class BaseGraphNodeAPIResponse(BaseAPIResponse):
    id: str
    name: str
    full_name: str
    tags: List[str]
    pipelines: List[str]
    type: str

    # If a node is a ModularPipeline node, this value will be None, hence Optional.
    modular_pipelines: Optional[List[str]]


class TaskNodeAPIResponse(BaseGraphNodeAPIResponse):
    parameters: Dict

    class Config:
        schema_extra = {
            "example": {
                "id": "6ab908b8",
                "name": "split_data_node",
                "full_name": "split_data_node",
                "tags": [],
                "pipelines": ["__default__", "ds"],
                "modular_pipelines": [],
                "type": "task",
                "parameters": {
                    "test_size": 0.2,
                    "random_state": 3,
                    "features": [
                        "engines",
                        "passenger_capacity",
                        "crew",
                        "d_check_complete",
                        "moon_clearance_complete",
                        "iata_approved",
                        "company_rating",
                        "review_scores_rating",
                    ],
                },
            }
        }


class DataNodeAPIResponse(BaseGraphNodeAPIResponse):
    layer: Optional[str]
    dataset_type: Optional[str]

    class Config:
        schema_extra = {
            "example": {
                "id": "d7b83b05",
                "name": "Master Table",
                "full_name": "master_table",
                "tags": [],
                "pipelines": ["__default__", "dp", "ds"],
                "modular_pipelines": [],
                "type": "data",
                "layer": "primary",
                "dataset_type": "kedro.extras.datasets.pandas.csv_dataset.CSVDataSet",
            }
        }


NodeAPIResponse = Union[
    TaskNodeAPIResponse,
    DataNodeAPIResponse,
]


class TaskNodeMetadataAPIResponse(BaseAPIResponse):
    code: Optional[str]
    filepath: Optional[str]
    parameters: Optional[Dict]
    inputs: List[str]
    outputs: List[str]
    run_command: Optional[str]

    class Config:
        schema_extra = {
            "example": {
                "code": "def split_data(data: pd.DataFrame, parameters: Dict) -> Tuple:",
                "filepath": "proj/src/new_kedro_project/pipelines/data_science/nodes.py",
                "parameters": {"test_size": 0.2},
                "inputs": ["params:input1", "input2"],
                "outputs": ["output1"],
                "run_command": 'kedro run --to-nodes="split_data"',
            }
        }


class DataNodeMetadataAPIResponse(BaseAPIResponse):
    filepath: str
    type: str
    plot: Optional[Dict]
    image: Optional[str]
    tracking_data: Optional[Dict]
    run_command: Optional[str]

    class Config:
        schema_extra = {
            "example": {
                "filepath": "/my-kedro-project/data/03_primary/master_table.csv",
                "type": "kedro.extras.datasets.pandas.csv_dataset.CSVDataSet",
                "run_command": 'kedro run --to-outputs="master_table"',
            }
        }


class TranscodedDataNodeMetadataAPIReponse(BaseAPIResponse):
    filepath: str
    original_type: str
    transcoded_types: List[str]
    run_command: Optional[str]


class ParametersNodeMetadataAPIResponse(BaseAPIResponse):
    parameters: Dict

    class Config:
        schema_extra = {
            "example": {
                "parameters": {
                    "test_size": 0.2,
                    "random_state": 3,
                    "features": [
                        "engines",
                        "passenger_capacity",
                        "crew",
                        "d_check_complete",
                        "moon_clearance_complete",
                        "iata_approved",
                        "company_rating",
                        "review_scores_rating",
                    ],
                }
            }
        }


NodeMetadataAPIResponse = Union[
    TaskNodeMetadataAPIResponse,
    DataNodeMetadataAPIResponse,
    TranscodedDataNodeMetadataAPIReponse,
    ParametersNodeMetadataAPIResponse,
]


class GraphEdgeAPIResponse(BaseAPIResponse):
    source: str
    target: str


class NamedEntityAPIResponse(BaseAPIResponse):
    """Model an API field that has an ID and a name.
    For example, used for representing modular pipelines and pipelines in the API response.
    """

    id: str
    name: Optional[str]


class ModularPipelineChildAPIResponse(BaseAPIResponse):
    """Model a child in a modular pipeline's children field in the API response."""

    id: str
    type: str


class ModularPipelinesTreeNodeAPIResponse(BaseAPIResponse):
    """Model a node in the tree representation of modular pipelines in the API response."""

    id: str
    name: str
    inputs: List[str]
    outputs: List[str]
    children: List[ModularPipelineChildAPIResponse]


# Represent the modular pipelines in the API response as a tree.
# The root node is always designated with the __root__ key.
# Example:
# {
#     "__root__": {
#            "id": "__root__",
#            "name": "Root",
#            "inputs": [],
#            "outputs": [],
#            "children": [
#                {"id": "d577578a", "type": "parameters"},
#                {"id": "data_science", "type": "modularPipeline"},
#                {"id": "f1f1425b", "type": "parameters"},
#                {"id": "data_engineering", "type": "modularPipeline"},
#            ],
#        },
#        "data_engineering": {
#            "id": "data_engineering",
#            "name": "Data Engineering",
#            "inputs": ["d577578a"],
#            "outputs": [],
#            "children": [],
#        },
#        "data_science": {
#            "id": "data_science",
#            "name": "Data Science",
#            "inputs": ["f1f1425b"],
#            "outputs": [],
#            "children": [],
#        },
#    }
# }
ModularPipelinesTreeAPIResponse = Dict[str, ModularPipelinesTreeNodeAPIResponse]


class GraphAPIResponse(BaseAPIResponse):
    nodes: List[NodeAPIResponse]
    edges: List[GraphEdgeAPIResponse]
    layers: List[str]
    tags: List[NamedEntityAPIResponse]
    pipelines: List[NamedEntityAPIResponse]
    modular_pipelines: ModularPipelinesTreeAPIResponse
    selected_pipeline: str


def get_default_response() -> GraphAPIResponse:
    """Default response for `/api/main`."""
    default_selected_pipeline_id = (
        data_access_manager.get_default_selected_pipeline().id
    )

    modular_pipelines_tree = (
        data_access_manager.create_modular_pipelines_tree_for_registered_pipeline(
            default_selected_pipeline_id
        )
    )

    return GraphAPIResponse(
        nodes=data_access_manager.get_nodes_for_registered_pipeline(
            default_selected_pipeline_id
        ),
        edges=data_access_manager.get_edges_for_registered_pipeline(
            default_selected_pipeline_id
        ),
        tags=data_access_manager.tags.as_list(),
        layers=data_access_manager.get_sorted_layers_for_registered_pipeline(
            default_selected_pipeline_id
        ),
        pipelines=data_access_manager.registered_pipelines.as_list(),
        modular_pipelines=modular_pipelines_tree,
        selected_pipeline=default_selected_pipeline_id,
    )
