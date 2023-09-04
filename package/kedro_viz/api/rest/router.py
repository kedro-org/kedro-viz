"""`kedro_viz.api.rest.router` defines REST routes and handling logic."""
# pylint: disable=missing-function-docstring
from pathlib import Path

import fsspec
from fastapi import APIRouter
from fastapi.responses import JSONResponse
from kedro.io.core import get_protocol_and_path

from kedro_viz.utils.api_tools import save_api_responses_to_fs

from .responses import (
    APIErrorMessage,
    GraphAPIResponse,
    NodeMetadataAPIResponse,
    UserCredentials,
    get_default_response,
    get_node_metadata_response,
    get_selected_pipeline_response,
)

_HTML_DIR = Path(__file__).parent.parent.parent.absolute() / "html"


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
async def deploy_kedro_viz(inputValues: UserCredentials):
    aws_region = inputValues.awsRegion
    bucket_name = inputValues.bucketName
    save_api_responses_to_fs(bucket_name)
    protocol, path = get_protocol_and_path(bucket_name)
    remote_fs = fsspec.filesystem(protocol)
    source_files = [
        str(p)
        for p in _HTML_DIR.rglob("*")
        if p.is_file() and not p.name.endswith(".map")
    ]
    remote_fs.put(source_files, bucket_name)

    url = None
    if protocol == "s3":
        url = f"http://{path}.s3-website.{aws_region}.amazonaws.com"

    response_data = {"message": "Website deployed on S3", "url": url}

    return JSONResponse(status_code=200, content=response_data)
