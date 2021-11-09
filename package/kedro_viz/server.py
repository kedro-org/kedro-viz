"""`kedro_viz.server` provides utilities to launch a webserver for Kedro pipeline visualisation."""
import webbrowser
from pathlib import Path
from typing import Dict, Optional

import uvicorn
from kedro.io import DataCatalog
from kedro.pipeline import Pipeline
from watchgod import run_process

from kedro_viz.api import apps, responses
from kedro_viz.data_access import DataAccessManager, data_access_manager
from kedro_viz.database import create_db_engine
from kedro_viz.integrations.kedro import data_loader as kedro_data_loader
from kedro_viz.models.run_model import Base

DEFAULT_HOST = "127.0.0.1"
DEFAULT_PORT = 4141
DEV_PORT = 4142


def is_localhost(host) -> bool:
    """Check whether a host is a localhost"""
    return host in ("127.0.0.1", "localhost", "0.0.0.0")


def populate_data(
    data_access_manager: DataAccessManager,
    catalog: DataCatalog,
    pipelines: Dict[str, Pipeline],
    session_store_location: Optional[Path],
):  # pylint: disable=redefined-outer-name
    """Populate data repositories. Should be called once on application start
    if creatinge an api app from project.
    """
    if session_store_location:
        database_engine, session_class = create_db_engine(session_store_location)
        Base.metadata.create_all(bind=database_engine)
        data_access_manager.db_session = session_class()

    data_access_manager.add_catalog(catalog)
    data_access_manager.add_pipelines(pipelines)


def run_server(
    host: str = DEFAULT_HOST,
    port: int = DEFAULT_PORT,
    browser: bool = None,
    load_file: str = None,
    save_file: str = None,
    pipeline_name: str = None,
    env: str = None,
    project_path: str = None,
    autoreload: bool = False,
):
    """Run a uvicorn server with a FastAPI app that either launches API response data from a file
    or from reading data from a real Kedro project.

    Args:
        host: the host to launch the webserver
        port: the port to launch the webserver
        browser: whether to open the default browser automatically
        load_file: if a valid JSON containing API response data is provided,
            the API of the server is created from the JSON.
        save_file: if provided, the data returned by the API will be saved to a file.
        pipeline_name: the optional name of the pipeline to visualise.
        env: the optional environment of the pipeline to visualise.
            If not provided, it will use Kedro's default, which is "local".
        autoreload: Whether the API app should support autoreload.
        project_path: the optional path of the Kedro project that contains the pipelines
            to visualise. If not supplied, the current working directory will be used.
    """
    if load_file is None:
        path = Path(project_path) if project_path else Path.cwd()
        catalog, pipelines, session_store_location = kedro_data_loader.load_data(
            path, env
        )
        pipelines = (
            pipelines
            if pipeline_name is None
            else {pipeline_name: pipelines[pipeline_name]}
        )
        populate_data(data_access_manager, catalog, pipelines, session_store_location)
        if save_file:
            res = responses.get_default_response()
            Path(save_file).write_text(res.json(indent=4, sort_keys=True))
        app = apps.create_api_app_from_project(path, autoreload)
    else:
        app = apps.create_api_app_from_file(load_file)

    if browser and is_localhost(host):
        webbrowser.open_new(f"http://{host}:{port}/")
    uvicorn.run(app, host=host, port=port)


if __name__ == "__main__":  # pragma: no cover
    import argparse

    from kedro.framework.startup import bootstrap_project

    parser = argparse.ArgumentParser(description="Launch a development viz server")
    parser.add_argument("project_path", help="Path to a Kedro project")
    parser.add_argument(
        "--host", help="The host of the development server", default=DEFAULT_HOST
    )
    parser.add_argument(
        "--port", help="The port of the development server", default=DEV_PORT
    )
    args = parser.parse_args()

    source_dir = bootstrap_project(args.project_path)
    run_process(
        args.project_path,
        run_server,
        kwargs={
            "host": args.host,
            "port": args.port,
            "project_path": args.project_path,
        },
    )
