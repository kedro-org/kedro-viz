"""`kedro_viz.api.rest.router` defines REST routes and handling logic."""
# pylint: disable=missing-function-docstring
from pathlib import Path

import fsspec
from fastapi import APIRouter
from kedro.io.core import get_protocol_and_path
from pydantic import BaseModel

from .responses import (
    APIErrorMessage,
    GraphAPIResponse,
    JSONResponse,
    NodeMetadataAPIResponse,
    get_default_response,
    get_node_metadata_response,
    get_selected_pipeline_response,
    save_api_responses_to_fs,
)

_HTML_DIR = Path(__file__).parent.parent.parent.absolute() / "html"

router = APIRouter(
    prefix="/api",
    responses={404: {"model": APIErrorMessage}},
)


class UserCredentials(BaseModel):
    awsRegion: str
    bucketName: str


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
    awsRegion = inputValues.awsRegion
    bucketName = inputValues.bucketName
    save_api_responses_to_fs(bucketName)
    protocol, path = get_protocol_and_path(bucketName)
    remote_fs = fsspec.filesystem(protocol)
    # remote_fs.put(f'{_HTML_DIR}/*', bucketName,recursive = True)
    source_files = [str(p) for p in _HTML_DIR.rglob("*") if p.is_file()]
    remote_fs.put(source_files, bucketName)

    url = None
    if protocol == "s3":
        url = f"http://{path}.s3-website.{awsRegion}.amazonaws.com"

    response_data = {"message": "Website deployed on S3", "url": url}

    return JSONResponse(status_code=200, content=response_data)
