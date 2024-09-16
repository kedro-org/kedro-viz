"""`kedro_viz.api.rest.responses` defines REST response types."""

# pylint: disable=missing-class-docstring,invalid-name
import abc
import json
import logging
from typing import Any, Dict, List, Optional, Union

import orjson
from fastapi.encoders import jsonable_encoder
from fastapi.responses import JSONResponse, ORJSONResponse
from pydantic import BaseModel, ConfigDict

from kedro_viz.api.rest.utils import get_package_compatibilities
from kedro_viz.data_access import data_access_manager
from kedro_viz.models.flowchart import (
    DataNode,
    DataNodeMetadata,
    ParametersNodeMetadata,
    TaskNode,
    TaskNodeMetadata,
    TranscodedDataNode,
    TranscodedDataNodeMetadata,
)
from kedro_viz.models.metadata import Metadata, PackageCompatibility

logger = logging.getLogger(__name__)


class APIErrorMessage(BaseModel):
    message: str


class BaseAPIResponse(BaseModel, abc.ABC):
    model_config = ConfigDict(from_attributes=True)


class BaseGraphNodeAPIResponse(BaseAPIResponse):
    id: str
    name: str
    tags: List[str]
    pipelines: List[str]
    type: str

    # If a node is a ModularPipeline node, this value will be None, hence Optional.
    modular_pipelines: Optional[List[str]] = None


class TaskNodeAPIResponse(BaseGraphNodeAPIResponse):
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


class TaskNodeMetadataAPIResponse(BaseAPIResponse):
    code: Optional[str] = None
    filepath: Optional[str] = None
    parameters: Optional[Dict] = None
    inputs: List[str]
    outputs: List[str]
    run_command: Optional[str] = None
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "code": "def split_data(data: pd.DataFrame, parameters: Dict) -> Tuple:",
                "filepath": "proj/src/new_kedro_project/pipelines/data_science/nodes.py",
                "parameters": {"test_size": 0.2},
                "inputs": ["params:input1", "input2"],
                "outputs": ["output1"],
                "run_command": "kedro run --to-nodes=split_data",
            }
        }
    )


class DataNodeMetadataAPIResponse(BaseAPIResponse):
    filepath: Optional[str] = None
    type: str
    run_command: Optional[str] = None
    preview: Optional[Union[Dict, str]] = None
    preview_type: Optional[str] = None
    stats: Optional[Dict] = None
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "filepath": "/my-kedro-project/data/03_primary/master_table.csv",
                "type": "kedro_datasets.pandas.csv_dataset.CSVDataset",
                "run_command": "kedro run --to-outputs=master_table",
            }
        }
    )


class TranscodedDataNodeMetadataAPIReponse(BaseAPIResponse):
    filepath: Optional[str] = None
    original_type: str
    transcoded_types: List[str]
    run_command: Optional[str] = None
    stats: Optional[Dict] = None


class ParametersNodeMetadataAPIResponse(BaseAPIResponse):
    parameters: Dict
    model_config = ConfigDict(
        json_schema_extra={
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
    )


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
    nodes: List[NodeAPIResponse]
    edges: List[GraphEdgeAPIResponse]
    layers: List[str]
    tags: List[NamedEntityAPIResponse]
    pipelines: List[NamedEntityAPIResponse]
    modular_pipelines: ModularPipelinesTreeAPIResponse
    selected_pipeline: str


class MetadataAPIResponse(BaseAPIResponse):
    has_missing_dependencies: bool = False
    package_compatibilities: List[PackageCompatibility] = []
    model_config = ConfigDict(
        json_schema_extra={
            "has_missing_dependencies": False,
            "package_compatibilities": [
                {
                    "package_name": "fsspec",
                    "package_version": "2024.6.1",
                    "is_compatible": True,
                },
                {
                    "package_name": "kedro-datasets",
                    "package_version": "4.0.0",
                    "is_compatible": True,
                },
            ],
        }
    )


class EnhancedORJSONResponse(ORJSONResponse):
    @staticmethod
    def encode_to_human_readable(content: Any) -> bytes:
        """A method to encode the given content to JSON, with the
        proper formatting to write a human-readable file.

        Returns:
            A bytes object containing the JSON to write.

        """
        return orjson.dumps(
            content,
            option=orjson.OPT_INDENT_2
            | orjson.OPT_NON_STR_KEYS
            | orjson.OPT_SERIALIZE_NUMPY,
        )


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


def get_node_metadata_response(node_id: str):
    """API response for `/api/nodes/node_id`."""
    node = data_access_manager.nodes.get_node_by_id(node_id)
    if not node:
        return JSONResponse(status_code=404, content={"message": "Invalid node ID"})

    if not node.has_metadata():
        return JSONResponse(content={})

    if isinstance(node, TaskNode):
        return TaskNodeMetadata(task_node=node)

    if isinstance(node, DataNode):
        return DataNodeMetadata(data_node=node)

    if isinstance(node, TranscodedDataNode):
        return TranscodedDataNodeMetadata(transcoded_data_node=node)

    return ParametersNodeMetadata(parameters_node=node)


def get_selected_pipeline_response(registered_pipeline_id: str):
    """API response for `/api/pipeline/pipeline_id`."""
    if not data_access_manager.registered_pipelines.has_pipeline(
        registered_pipeline_id
    ):
        return JSONResponse(status_code=404, content={"message": "Invalid pipeline ID"})

    modular_pipelines_tree = (
        data_access_manager.create_modular_pipelines_tree_for_registered_pipeline(
            registered_pipeline_id
        )
    )

    return GraphAPIResponse(
        nodes=data_access_manager.get_nodes_for_registered_pipeline(
            registered_pipeline_id
        ),
        edges=data_access_manager.get_edges_for_registered_pipeline(
            registered_pipeline_id
        ),
        tags=data_access_manager.tags.as_list(),
        layers=data_access_manager.get_sorted_layers_for_registered_pipeline(
            registered_pipeline_id
        ),
        pipelines=data_access_manager.registered_pipelines.as_list(),
        selected_pipeline=registered_pipeline_id,
        modular_pipelines=modular_pipelines_tree,
    )


def get_metadata_response():
    """API response for `/api/metadata`."""
    package_compatibilities = get_package_compatibilities()
    Metadata.set_package_compatibilities(package_compatibilities)
    return Metadata()


def get_encoded_response(response: Any) -> bytes:
    """Encodes and enhances the default response using human-readable format."""
    jsonable_response = jsonable_encoder(response)
    encoded_response = EnhancedORJSONResponse.encode_to_human_readable(
        jsonable_response
    )

    return encoded_response


def write_api_response_to_fs(file_path: str, response: Any, remote_fs: Any):
    """Get encoded responses and writes it to a file"""
    encoded_response = get_encoded_response(response)

    with remote_fs.open(file_path, "wb") as file:
        file.write(encoded_response)


def get_kedro_project_json_data():
    """Decodes the default response and returns the Kedro project JSON data.
    This will be used in VSCode extension to get current Kedro project data."""
    encoded_response = get_encoded_response(get_default_response())

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


def save_api_main_response_to_fs(main_path: str, remote_fs: Any):
    """Saves API /main response to a directory."""
    try:
        write_api_response_to_fs(main_path, get_default_response(), remote_fs)
    except Exception as exc:  # pragma: no cover
        logger.exception("Failed to save default response. Error: %s", str(exc))
        raise exc


def save_api_node_response_to_fs(
    nodes_path: str, remote_fs: Any, is_all_previews_enabled: bool
):
    """Saves API /nodes/{node} response to a directory."""
    # Set if preview is enabled/disabled for all data nodes
    DataNodeMetadata.set_is_all_previews_enabled(is_all_previews_enabled)

    for nodeId in data_access_manager.nodes.get_node_ids():
        try:
            write_api_response_to_fs(
                f"{nodes_path}/{nodeId}", get_node_metadata_response(nodeId), remote_fs
            )
        except Exception as exc:  # pragma: no cover
            logger.exception(
                "Failed to save node data for node ID %s. Error: %s", nodeId, str(exc)
            )
            raise exc


def save_api_pipeline_response_to_fs(pipelines_path: str, remote_fs: Any):
    """Saves API /pipelines/{pipeline} response to a directory."""
    for pipelineId in data_access_manager.registered_pipelines.get_pipeline_ids():
        try:
            write_api_response_to_fs(
                f"{pipelines_path}/{pipelineId}",
                get_selected_pipeline_response(pipelineId),
                remote_fs,
            )
        except Exception as exc:  # pragma: no cover
            logger.exception(
                "Failed to save pipeline data for pipeline ID %s. Error: %s",
                pipelineId,
                str(exc),
            )
            raise exc


def save_api_responses_to_fs(path: str, remote_fs: Any, is_all_previews_enabled: bool):
    """Saves all Kedro Viz API responses to a directory."""
    try:
        logger.debug(
            """Saving/Uploading api files to %s""",
            path,
        )

        main_path = f"{path}/api/main"
        nodes_path = f"{path}/api/nodes"
        pipelines_path = f"{path}/api/pipelines"

        if "file" in remote_fs.protocol:
            remote_fs.makedirs(path, exist_ok=True)
            remote_fs.makedirs(nodes_path, exist_ok=True)
            remote_fs.makedirs(pipelines_path, exist_ok=True)

        save_api_main_response_to_fs(main_path, remote_fs)
        save_api_node_response_to_fs(nodes_path, remote_fs, is_all_previews_enabled)
        save_api_pipeline_response_to_fs(pipelines_path, remote_fs)

    except Exception as exc:  # pragma: no cover
        logger.exception(
            "An error occurred while preparing data for saving. Error: %s", str(exc)
        )
        raise exc
