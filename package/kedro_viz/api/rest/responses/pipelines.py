"""`kedro_viz.api.rest.responses.pipelines` contains response classes
and utility functions for the `/main` and `/pipelines/* REST endpoints"""

import json
import logging
from typing import Dict, List, Optional, Union

from fastapi.responses import JSONResponse
from pydantic import ConfigDict

from kedro_viz.api.rest.responses.base import BaseAPIResponse
from kedro_viz.api.rest.responses.utils import get_encoded_response
from kedro_viz.data_access import data_access_manager

logger = logging.getLogger(__name__)


class BaseGraphNodeAPIResponse(BaseAPIResponse):
    """
    BaseGraphNodeAPIResponse is a data model for representing the response of a graph node in the API.

    Attributes:
        id (str): The unique identifier of the graph node.
        name (str): The name of the graph node.
        tags (List[str]): A list of tags associated with the graph node.
        pipelines (List[str]): A list of pipelines that the graph node belongs to.
        type (str): The type of the graph node.
        modular_pipelines (Optional[List[str]]): A list of modular pipelines associated with the graph node.
                                                 This value will be None if the node is a ModularPipeline node.
    """

    id: str
    name: str
    tags: List[str]
    pipelines: List[str]
    type: str

    # If a node is a ModularPipeline node, this value will be None, hence Optional.
    modular_pipelines: Optional[List[str]] = None


class TaskNodeAPIResponse(BaseGraphNodeAPIResponse):
    """
    TaskNodeAPIResponse is a subclass of BaseGraphNodeAPIResponse that represents the response for a task node in the API.

    Attributes:
        parameters (Dict): A dictionary containing the parameters for the task node.
    """

    parameters: Dict
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "id": "6ab908b8",
                "name": "split_data_node",
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
    )


class DataNodeAPIResponse(BaseGraphNodeAPIResponse):
    """
    DataNodeAPIResponse is a subclass of BaseGraphNodeAPIResponse that represents the response model for a data node in the API.

    Attributes:
        layer (Optional[str]): The layer to which the data node belongs. Default is None.
        dataset_type (Optional[str]): The type of dataset. Default is None.
        stats (Optional[Dict]): Statistics related to the dataset, such as number of rows, columns, and file size. Default is None.
    """

    layer: Optional[str] = None
    dataset_type: Optional[str] = None
    stats: Optional[Dict] = None
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "id": "d7b83b05",
                "name": "master_table",
                "tags": [],
                "pipelines": ["__default__", "dp", "ds"],
                "modular_pipelines": [],
                "type": "data",
                "layer": "primary",
                "dataset_type": "kedro_datasets.pandas.csv_dataset.CSVDataset",
                "stats": {"rows": 10, "columns": 2, "file_size": 2300},
            }
        }
    )


NodeAPIResponse = Union[
    TaskNodeAPIResponse,
    DataNodeAPIResponse,
]


class GraphEdgeAPIResponse(BaseAPIResponse):
    """
    GraphEdgeAPIResponse represents the response model for an edge in the graph.

    Attributes:
        source (str): The source node id for the edge.
        target (str): The target node id for the edge.
    """

    source: str
    target: str


class NamedEntityAPIResponse(BaseAPIResponse):
    """Model an API field that has an ID and a name.
    For example, used for representing modular pipelines and pipelines in the API response.
    """

    id: str
    name: Optional[str] = None


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
    """
    GraphAPIResponse is a data model for the response of the graph API.

    Attributes:
        nodes (List[NodeAPIResponse]): A list of nodes in the graph.
        edges (List[GraphEdgeAPIResponse]): A list of edges connecting the nodes in the graph.
        layers (List[str]): A list of layers in the graph.
        tags (List[NamedEntityAPIResponse]): A list of tags associated with the graph entities.
        pipelines (List[NamedEntityAPIResponse]): A list of pipelines in the graph.
        modular_pipelines (ModularPipelinesTreeAPIResponse): A tree structure representing modular pipelines.
        selected_pipeline (str): The identifier of the selected pipeline.
    """

    nodes: List[NodeAPIResponse]
    edges: List[GraphEdgeAPIResponse]
    layers: List[str]
    tags: List[NamedEntityAPIResponse]
    pipelines: List[NamedEntityAPIResponse]
    modular_pipelines: ModularPipelinesTreeAPIResponse
    selected_pipeline: str


def get_pipeline_response(
    pipeline_id: Union[str, None] = None,
) -> Union[GraphAPIResponse, JSONResponse]:
    """API response for `/api/pipelines/pipeline_id`."""
    if pipeline_id is None:
        pipeline_id = data_access_manager.get_default_selected_pipeline().id

    if not data_access_manager.registered_pipelines.has_pipeline(pipeline_id):
        return JSONResponse(status_code=404, content={"message": "Invalid pipeline ID"})

    modular_pipelines_tree = (
        data_access_manager.create_modular_pipelines_tree_for_registered_pipeline(
            pipeline_id
        )
    )

    return GraphAPIResponse(
        nodes=data_access_manager.get_nodes_for_registered_pipeline(pipeline_id),
        edges=data_access_manager.get_edges_for_registered_pipeline(pipeline_id),
        tags=data_access_manager.tags.as_list(),
        layers=data_access_manager.get_sorted_layers_for_registered_pipeline(
            pipeline_id
        ),
        pipelines=data_access_manager.registered_pipelines.as_list(),
        modular_pipelines=modular_pipelines_tree,
        selected_pipeline=pipeline_id,
    )


def get_kedro_project_json_data():
    """Decodes the default response and returns the Kedro project JSON data.
    This will be used in VSCode extension to get current Kedro project data."""
    encoded_response = get_encoded_response(get_pipeline_response())

    try:
        response_str = encoded_response.decode("utf-8")
        json_data = json.loads(response_str)
    except UnicodeDecodeError as exc:  # pragma: no cover
        json_data = None
        logger.error("Failed to decode response string. Error: %s", str(exc))
    except json.JSONDecodeError as exc:  # pragma: no cover
        json_data = None
        logger.error("Failed to parse JSON data. Error: %s", str(exc))

    return json_data
