"""`kedro_viz.api.rest.router` defines REST routes and handling logic."""
# pylint: disable=missing-function-docstring
from fastapi import APIRouter

from .responses import (
    APIErrorMessage,
    GraphAPIResponse,
    NodeMetadataAPIResponse,
    get_default_response,
    get_node_metadata_response,
    get_selected_pipeline_response,
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
async def get_single_node_metadata(node_id: str):
    return get_node_metadata_response(node_id)


@router.get(
    "/pipelines/{registered_pipeline_id}",
    response_model=GraphAPIResponse,
)
async def get_single_pipeline_data(registered_pipeline_id: str):
    return get_selected_pipeline_response(registered_pipeline_id)
