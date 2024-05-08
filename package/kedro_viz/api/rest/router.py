"""`kedro_viz.api.rest.router` defines REST routes and handling logic."""

# pylint: disable=missing-function-docstring, broad-exception-caught
import logging
from typing import List

from fastapi import APIRouter
from fastapi.responses import JSONResponse

from kedro_viz.api.rest.requests import DeployerConfiguration
from kedro_viz.constants import PACKAGE_REQUIREMENTS
from kedro_viz.integrations.deployment.deployer_factory import DeployerFactory

from .responses import (
    APIErrorMessage,
    GraphAPIResponse,
    NodeMetadataAPIResponse,
    PackageCompatibilityAPIResponse,
    get_default_response,
    get_node_metadata_response,
    get_package_compatibilities_response,
    get_selected_pipeline_response,
)

try:
    from azure.core.exceptions import ServiceRequestError
except ImportError:  # pragma: no cover
    ServiceRequestError = None  # type: ignore

logger = logging.getLogger(__name__)

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
async def deploy_kedro_viz(input_values: DeployerConfiguration):
    try:
        deployer = DeployerFactory.create_deployer(
            input_values.platform, input_values.endpoint, input_values.bucket_name
        )
        deployer.deploy()
        response = {
            "message": "Website deployed on "
            f"{input_values.platform and input_values.platform.upper()}",
            "url": input_values.endpoint,
        }
        return JSONResponse(status_code=200, content=response)
    except PermissionError as exc:  # pragma: no cover
        logger.exception("Permission error in deploying Kedro Viz : %s ", exc)
        return JSONResponse(
            status_code=401, content={"message": "Please provide valid credentials"}
        )
    except (
        # pylint: disable=catching-non-exception
        (FileNotFoundError, ServiceRequestError)
        if ServiceRequestError is not None
        else FileNotFoundError
    ) as exc:  # pragma: no cover
        logger.exception("FileNotFoundError while deploying Kedro Viz : %s ", exc)
        return JSONResponse(
            status_code=400, content={"message": "The specified bucket does not exist"}
        )
    except Exception as exc:  # pragma: no cover
        logger.exception("Deploying Kedro Viz failed: %s ", exc)
        return JSONResponse(status_code=500, content={"message": f"{exc}"})


@router.get(
    "/package-compatibilities",
    response_model=List[PackageCompatibilityAPIResponse],
)
async def get_package_compatibilities():
    try:
        return get_package_compatibilities_response(PACKAGE_REQUIREMENTS)
    except Exception as exc:
        logger.exception(
            "An exception occured while getting package compatibility info : %s", exc
        )
        return JSONResponse(
            status_code=500,
            content={"message": "Failed to get package compatibility info"},
        )
