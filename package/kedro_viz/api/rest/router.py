"""`kedro_viz.api.rest.router` defines REST routes and handling logic."""

import logging
from typing import Dict, List, Optional

from fastapi import APIRouter, BackgroundTasks, WebSocket
from fastapi.responses import JSONResponse

from kedro_viz.api.rest.requests import DeployerConfiguration
from kedro_viz.api.rest.responses.base import APINotFoundResponse
from kedro_viz.api.rest.responses.metadata import (
    MetadataAPIResponse,
    get_metadata_response,
)
from kedro_viz.api.rest.responses.nodes import (
    NodeMetadataAPIResponse,
    get_node_metadata_response,
)
from kedro_viz.api.rest.responses.pipelines import (
    GraphAPIResponse,
    get_pipeline_response,
)
from kedro_viz.api.rest.responses.version import (
    VersionAPIResponse,
    get_version_response,
)

from kedro_viz.api.rest.utils import run_kedro_pipeline
from kedro_viz.services.events_store import connected_websockets, event_queue

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api",
    responses={404: {"model": APINotFoundResponse}},
)


@router.get("/main", response_model=GraphAPIResponse)
async def main():
    return get_pipeline_response()


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
    return get_pipeline_response(registered_pipeline_id)


@router.get(
    "/version",
    response_model=VersionAPIResponse,
)
async def get_version():
    return get_version_response()


@router.post("/deploy")
async def deploy_kedro_viz(input_values: DeployerConfiguration):
    from kedro_viz.integrations.deployment.deployer_factory import DeployerFactory

    try:
        from azure.core.exceptions import ServiceRequestError
    except ImportError:  # pragma: no cover
        ServiceRequestError = None  # type: ignore

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
    "/metadata",
    response_model=MetadataAPIResponse,
)
async def get_metadata():
    try:
        return get_metadata_response()
    except Exception as exc:
        logger.exception("An exception occurred while getting app metadata: %s", exc)
        return JSONResponse(
            status_code=500,
            content={"message": "Failed to get app metadata"},
        )

@router.post("/run")
async def run_pipeline(
    background_tasks: BackgroundTasks,
    pipeline_name: Optional[str] = None,
    tags: Optional[List[str]] = None,
    node_names: Optional[List[str]] = None,
    from_nodes: Optional[List[str]] = None,
    to_nodes: Optional[List[str]] = None,
    from_inputs: Optional[List[str]] = None,
    to_outputs: Optional[List[str]] = None,
    load_versions: Optional[Dict[str, str]] = None,
    namespace: Optional[str] = None,
):
    background_tasks.add_task(
        run_kedro_pipeline,
        pipeline_name=pipeline_name,
        tags=tags,
        node_names=node_names,
        from_nodes=from_nodes,
        to_nodes=to_nodes,
        from_inputs=from_inputs,
        to_outputs=to_outputs,
        load_versions=load_versions,
        namespace=namespace,
    )
    return JSONResponse({"status": "`kedro run` started successfully"})


@router.websocket("/ws/events")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    connected_websockets.append(websocket)

    try:
        while True:
            event = await event_queue.get()
            await websocket.send_text(event)

            if '"event": "node_error"' in event or '"event": "pipeline_error"' in event or '"event": "after_pipeline_run"' in event:
                connected_websockets.remove(websocket)
                print("Is websocket closed!!")
                await websocket.close()
                break
    except:
        connected_websockets.remove(websocket)
