"""`kedro_viz.api.rest.router` defines REST routes and handling logic."""

import uuid
import threading
import logging
import subprocess
from datetime import datetime
from fastapi import APIRouter, BackgroundTasks
from fastapi.responses import JSONResponse

from kedro_viz.api.rest.requests import (
    DeployerConfiguration,
)
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
from kedro_viz.api.rest.responses.run_events import (
    RunStatusAPIResponse,
    get_run_status_response,
)
from kedro_viz.api.rest.responses.version import (
    VersionAPIResponse,
    get_version_response,
)

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


@router.get("/run-status", response_model=RunStatusAPIResponse)
async def get_last_run_status():
    """Get run status data for pipeline visualization.

    This endpoint provides access to Kedro pipeline run status in structured format.

    Returns:
        JSON response containing run status data in structured format

    Example structured format:
    ```
    {
        "nodes": {
            "node_id": {
                "status": "success",
                "duration": 0.123,
                "error": null
            }
        },
        "datasets": {
            "dataset_id": {
                "name": "dataset.name",
                "size": 1024,
                "error": null
            }
        },
        "pipeline": {
            "run_id": "unique-id",
            "start_time": "2023-05-14T10:15:30Z",
            "end_time": "2023-05-14T10:20:45Z",
            "duration": 315.25,
            "status": "completed"
            "error": null
        }
    }
    ```
    """
    try:
        return get_run_status_response()
    except Exception as exc:
        logger.exception("An exception occurred while getting run status: %s", exc)
        return JSONResponse(
            status_code=500,
            content={"message": "Failed to get run status data"},
        )


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


kedro_jobs = {}
_kedro_jobs_lock = threading.Lock()


def _stream_reader(pipe, job_id, key):
    try:
        # iter(..., "") yields lines until EOF; returns "" at EOF (not None)
        for line in iter(pipe.readline, ""):
            if not line:
                break
            with _kedro_jobs_lock:
                # ensure key exists and is a string
                kedro_jobs[job_id][key] += line
    finally:
        try:
            pipe.close()
        except Exception:
            pass


def quote_if_needed(text:str) -> str:
    if " " in text:
        return f'"{text}"'
    return text

def run_kedro_subprocess(job_id, cmd):
    logger.info("Running Kedro command: %s", cmd)
    process = subprocess.Popen(
        cmd,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
    )
    logger.info("Started Kedro command with PID: %s", process.pid)

    # store pid & running status
    with _kedro_jobs_lock:
        kedro_jobs[job_id]["pid"] = process.pid
        kedro_jobs[job_id]["status"] = "running"

    # start reader threads to update kedro_jobs while the process runs
    t_out = threading.Thread(
        target=_stream_reader, args=(process.stdout, job_id, "stdout"), daemon=True
    )
    t_err = threading.Thread(
        target=_stream_reader, args=(process.stderr, job_id, "stderr"), daemon=True
    )
    t_out.start()
    t_err.start()

    # wait for the process to finish
    # (this runs inside the background task, not blocking main request)
    returncode = process.wait()

    # join reader threads briefly to collect remaining output
    t_out.join(timeout=1)
    t_err.join(timeout=1)

    # final collect (communicate to ensure no left-over data)
    try:
        rem_out, rem_err = process.communicate(timeout=0.1)
    except Exception:
        rem_out, rem_err = "", ""

    with _kedro_jobs_lock:
        if rem_out:
            kedro_jobs[job_id]["stdout"] += rem_out
        if rem_err:
            kedro_jobs[job_id]["stderr"] += rem_err
        kedro_jobs[job_id]["returncode"] = returncode
        kedro_jobs[job_id]["status"] = "finished" if returncode == 0 else "error"
        kedro_jobs[job_id]["end_time"] = datetime.now()
        if kedro_jobs[job_id]["start_time"]:
            kedro_jobs[job_id]["duration"] = (
                kedro_jobs[job_id]["end_time"] - kedro_jobs[job_id]["start_time"]
            ).total_seconds()

    logger.info("Kedro job %s finished with return code %d", job_id, returncode)


@router.post("/run-kedro-command")
async def run_kedro_command(command: str, background_tasks: BackgroundTasks):
    """
    Run a Kedro command provided as a string in a subprocess and return the output.
    Example request body: {"command": "run --pipeline=my_pipeline"}
    """
    # Split the command string safely
    import shlex

    job_id = str(uuid.uuid4())

    cmd = shlex.split(command)
    if not cmd[0] == "kedro":
        cmd = ["kedro"] + cmd

    # Initialize job status
    kedro_jobs[job_id] = {
        "status": "initialize",
        "start_time": datetime.now(),
        "cmd": " ".join([quote_if_needed(c) for c in cmd]),
        "duration": None,
        "end_time": None,
        "stdout": "",
        "stderr": "",
        "returncode": None,
    }
    background_tasks.add_task(run_kedro_subprocess, job_id, cmd)
    return JSONResponse(
        status_code=202,
        content={"job_id": job_id, "status": "initialize"},
    )


@router.get("/kedro-command-status")
async def get_kedro_command_status(job_id: str):
    """
    Get the status of a previously run Kedro command.
    """
    job = kedro_jobs.get(job_id)
    if not job:
        return JSONResponse(
            status_code=404,
            content={"message": "Job not found"},
        )
    return JSONResponse(
        status_code=200,
        content={
            "start_time": job["start_time"].strftime("%Y-%m-%d %H:%M:%S"),
            "cmd": job["cmd"],
            "duration": job["duration"],
            "end_time": (
                job["end_time"].strftime("%Y-%m-%d %H:%M:%S")
                if job["end_time"]
                else None
            ),
            "status": job["status"],
            "stdout": job["stdout"],
            "stderr": job["stderr"],
            "returncode": job["returncode"],
        },
    )


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
