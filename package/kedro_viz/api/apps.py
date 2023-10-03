"""`kedro_viz.api.app` defines the FastAPI app to serve Kedro data in a RESTful API.
This data could either come from a real Kedro project or a file.
"""
import json
import time
from pathlib import Path

import secure
from fastapi import FastAPI, HTTPException
from fastapi.requests import Request
from fastapi.responses import FileResponse, HTMLResponse, JSONResponse, Response
from fastapi.staticfiles import StaticFiles
from jinja2 import Environment, FileSystemLoader

from kedro_viz import __version__
from kedro_viz.api.rest.responses import EnhancedORJSONResponse
from kedro_viz.integrations.kedro import telemetry as kedro_telemetry

from .graphql.router import router as graphql_router
from .rest.router import router as rest_router

_HTML_DIR = Path(__file__).parent.parent.absolute() / "html"

secure_headers = secure.Secure()


def _create_etag() -> str:
    """Generate the current timestamp to use as etag."""
    return str(time.time())


def _create_base_api_app() -> FastAPI:
    app = FastAPI(
        title="Kedro-Viz API",
        description="REST API for Kedro-Viz",
        version=__version__,
        default_response_class=EnhancedORJSONResponse,
    )

    @app.middleware("http")
    async def set_secure_headers(request, call_next):
        response = await call_next(request)
        secure_headers.framework.fastapi(response)
        return response

    return app


def create_api_app_from_project(
    project_path: Path, autoreload: bool = False
) -> FastAPI:
    """Create an API from a real Kedro project by adding the router to the FastAPI app.

    Args:
        project_path: Path to the Kedro project
        autoreload: Whether the app should autoreload based on content change
            in the Kedro project
    Returns:
        The FastAPI app
    """
    app = _create_base_api_app()
    app.include_router(rest_router)
    app.include_router(graphql_router)

    # Check for html directory existence.
    if Path(_HTML_DIR).is_dir():
        # The html is needed when kedro_viz is used in cli but not required when running
        # frontend e2e tests via Cypress
        app.mount("/static", StaticFiles(directory=_HTML_DIR / "static"), name="static")

    # every time the server reloads, a new app with a new timestamp will be created.
    # this is used as an etag embedded in the frontend for client to use when making requests.
    app_etag = _create_etag()

    # Serve the favicon.ico file from the "html" directory
    @app.get("/favicon.ico", include_in_schema=False)
    async def favicon():
        return FileResponse(_HTML_DIR / "favicon.ico")

    @app.get("/")
    @app.get("/experiment-tracking")
    async def index():
        heap_app_id = kedro_telemetry.get_heap_app_id(project_path)
        heap_user_identity = kedro_telemetry.get_heap_identity()
        should_add_telemetry = bool(heap_app_id) and bool(heap_user_identity)
        html_content = (_HTML_DIR / "index.html").read_text(encoding="utf-8")
        injected_head_content = []

        env = Environment(loader=FileSystemLoader(_HTML_DIR))
        if should_add_telemetry:
            telemetry_content = env.get_template("telemetry.html").render(
                heap_app_id=heap_app_id, heap_user_identity=heap_user_identity
            )
            injected_head_content.append(telemetry_content)

        if autoreload:
            autoreload_content = env.get_template("autoreload.html").render(
                etag=app_etag
            )
            injected_head_content.append(autoreload_content)

        injected_head_content.append("</head>")
        html_content = html_content.replace("</head>", "\n".join(injected_head_content))
        return HTMLResponse(html_content)

    @app.get("/api/reload")
    async def reload(request: Request):
        if "If-None-Match" not in request.headers:
            raise HTTPException(
                status_code=400,
                detail="Request to reload endpoint must have an If-None-Match header",
            )
        current_client_etag = request.headers["If-None-Match"]
        if app_etag == current_client_etag:
            return Response(status_code=304)

        return Response()

    return app


def create_api_app_from_file(api_dir: str) -> FastAPI:
    """Create an API from a json file."""
    app = _create_base_api_app()
    app.mount("/static", StaticFiles(directory=_HTML_DIR / "static"), name="static")

    @app.get("/")
    async def index():
        html_content = (_HTML_DIR / "index.html").read_text(encoding="utf-8")
        return HTMLResponse(html_content)

    @app.get("/api/main", response_class=JSONResponse)
    async def main():
        return json.loads((Path(api_dir) / "main").read_text(encoding="utf8"))

    @app.get("/api/nodes/{node_id}", response_class=JSONResponse)
    async def get_node_metadata(node_id):
        return json.loads(  # pragma: no cover
            (Path(api_dir) / "nodes" / node_id).read_text(encoding="utf8")
        )

    @app.get("/api/pipelines/{pipeline_id}", response_class=JSONResponse)
    async def get_registered_pipeline(pipeline_id):
        return json.loads(  # pragma: no cover
            (Path(api_dir) / "pipelines" / pipeline_id).read_text(encoding="utf8")
        )

    @app.get("/api/deploy-viz-metadata", response_class=JSONResponse)
    async def get_deployed_viz_metadata():
        return json.loads(  # pragma: no cover
            (Path(api_dir) / "deploy-viz-metadata").read_text(encoding="utf8")
        )

    return app
