"""`kedro_viz.api.rest.router` defines REST routes and handling logic."""
# pylint: disable=missing-function-docstring
from fastapi import APIRouter
from fastapi.responses import JSONResponse

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

from .responses import (
    APIErrorMessage,
    GraphAPIResponse,
    NodeMetadataAPIResponse,
    get_default_response,
)

router = APIRouter(
    prefix="/api",
    responses={404: {"model": APIErrorMessage}},
)


@router.get("/main", response_model=GraphAPIResponse)
async def main():
    return get_default_response()


@router.get(
    "/nodes/{node_id}",
    response_model=NodeMetadataAPIResponse,
    response_model_exclude_none=True,
)
async def get_single_node_metadata(node_id: str, is_pretty: bool = True):
    node = data_access_manager.nodes.get_node_by_id(node_id)
    if not node:
        return JSONResponse(status_code=404, content={"message": "Invalid node ID"})

    if not node.has_metadata():
        return JSONResponse(content={})

    if isinstance(node, TaskNode):
        return TaskNodeMetadata(node, is_pretty)

    if isinstance(node, DataNode):
        return DataNodeMetadata(node)

    if isinstance(node, TranscodedDataNode):
        return TranscodedDataNodeMetadata(node)

    return ParametersNodeMetadata(node)


@router.get(
    "/pipelines/{registered_pipeline_id}",
    response_model=GraphAPIResponse,
)
async def get_single_pipeline_data(registered_pipeline_id: str):
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
