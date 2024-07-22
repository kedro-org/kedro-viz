"""`kedro_viz.api.rest.router` defines REST routes and handling logic."""

# pylint: disable=missing-function-docstring, broad-exception-caught
import logging
from typing import List

from fastapi import APIRouter
from fastapi.responses import JSONResponse

from kedro_viz.api.rest.requests import DeployerConfiguration, UserPreference
from kedro_viz.constants import PACKAGE_REQUIREMENTS
from kedro_viz.integrations.deployment.deployer_factory import DeployerFactory

from .responses import (
    APIErrorMessage,
    DataNodeMetadata,
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


@router.post("/preferences")
async def update_preferences(preferences: UserPreference):
    try:
        DataNodeMetadata.set_is_all_previews_enabled(preferences.showDatasetPreviews)
        return JSONResponse(
            status_code=200, content={"message": "Preferences updated successfully"}
        )
    except Exception as exception:
        logger.error("Failed to update preferences: %s", str(exception))
        return JSONResponse(
            status_code=500,
            content={"message": "Failed to update preferences"},
        )


@router.get("/preferences", response_model=UserPreference)
async def get_preferences():
    try:
        show_dataset_previews = DataNodeMetadata.is_all_previews_enabled
        return JSONResponse(
            status_code=200, content={"showDatasetPreviews": show_dataset_previews}
        )
    except Exception as exception:
        logger.error("Failed to fetch preferences: %s", str(exception))
        return JSONResponse(
            status_code=500,
            content={"message": "Failed to fetch preferences"},
        )


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
        deployer.deploy(input_values.is_all_previews_enabled)
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
            "An exception occurred while getting package compatibility info : %s", exc
        )
        return JSONResponse(
            status_code=500,
            content={"message": "Failed to get package compatibility info"},
        )
