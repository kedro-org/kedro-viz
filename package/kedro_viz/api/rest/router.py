"""`kedro_viz.api.rest.router` defines REST routes and handling logic."""
# pylint: disable=missing-function-docstring

from fastapi import APIRouter
from fastapi.responses import JSONResponse

from kedro_viz.integrations.deployment.s3_deployer import S3Deployer

from .responses import (
    APIErrorMessage,
    AWSCredentials,
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


@router.post("/deploy")
async def deploy_kedro_viz(input_values: AWSCredentials):
    deployer = S3Deployer(input_values.region, input_values.bucket_name)
    url = deployer.get_deployed_url()
    response = {"message": "Website deployed on S3", "url": url}
    return JSONResponse(status_code=200, content=response)
