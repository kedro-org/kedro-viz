"""`kedro_viz.server` provides utilities to launch a webserver
for Kedro pipeline visualisation."""
from pathlib import Path
from typing import Any, Dict, Optional

import uvicorn
from fastapi.encoders import jsonable_encoder
from kedro.framework.session.store import BaseSessionStore
from kedro.io import DataCatalog
from kedro.pipeline import Pipeline
from watchgod import run_process

from kedro_viz.api import apps
from kedro_viz.api.rest.responses import EnhancedORJSONResponse, get_default_response
from kedro_viz.constants import DEFAULT_HOST, DEFAULT_PORT
from kedro_viz.data_access import DataAccessManager, data_access_manager
from kedro_viz.database import make_db_session_factory
from kedro_viz.integrations.kedro import data_loader as kedro_data_loader
from kedro_viz.integrations.kedro.sqlite_store import SQLiteStore

DEV_PORT = 4142


def populate_data(
    data_access_manager: DataAccessManager,
    catalog: DataCatalog,
    pipelines: Dict[str, Pipeline],
    session_store: BaseSessionStore,
    stats_dict: Dict,
):  # pylint: disable=redefined-outer-name
    """Populate data repositories. Should be called once on application start
    if creating an api app from project.
    """

    if isinstance(session_store, SQLiteStore):
        session_store.sync()
        session_class = make_db_session_factory(session_store.location)
        data_access_manager.set_db_session(session_class)

    data_access_manager.add_catalog(catalog)

    # add dataset stats before adding pipelines
    data_access_manager.add_dataset_stats(stats_dict)

    data_access_manager.add_pipelines(pipelines)


def run_server(
    host: str = DEFAULT_HOST,
    port: int = DEFAULT_PORT,
    load_file: Optional[str] = None,
    save_file: Optional[str] = None,
    pipeline_name: Optional[str] = None,
    env: Optional[str] = None,
    project_path: Optional[str] = None,
    autoreload: bool = False,
    extra_params: Optional[Dict[str, Any]] = None,
):  # pylint: disable=redefined-outer-name, too-many-locals
    """Run a uvicorn server with a FastAPI app that either launches API response data from a file
    or from reading data from a real Kedro project.

    Args:
        host: the host to launch the webserver
        port: the port to launch the webserver
        load_file: if a valid JSON containing API response data is provided,
            the API of the server is created from the JSON.
        save_file: if provided, the data returned by the API will be saved to a file.
        pipeline_name: the optional name of the pipeline to visualise.
        env: the optional environment of the pipeline to visualise.
            If not provided, it will use Kedro's default, which is "local".
        autoreload: Whether the API app should support autoreload.
        project_path: the optional path of the Kedro project that contains the pipelines
            to visualise. If not supplied, the current working directory will be used.
        extra_params: Optional dictionary containing extra project parameters
            for underlying KedroContext. If specified, will update (and therefore
            take precedence over) the parameters retrieved from the project
            configuration.
    """
    print("Starting Kedro Viz Backend Server...")
    if load_file is None:
        path = Path(project_path) if project_path else Path.cwd()
        catalog, pipelines, session_store, stats_dict = kedro_data_loader.load_data(
            path, env, extra_params
        )
        pipelines = (
            pipelines
            if pipeline_name is None
            else {pipeline_name: pipelines[pipeline_name]}
        )
        populate_data(
            data_access_manager, catalog, pipelines, session_store, stats_dict
        )
        if save_file:
            default_response = get_default_response()
            jsonable_default_response = jsonable_encoder(default_response)
            encoded_default_response = EnhancedORJSONResponse.encode_to_human_readable(
                jsonable_default_response
            )
            Path(save_file).write_bytes(encoded_default_response)
        app = apps.create_api_app_from_project(path, autoreload)
    else:
        app = apps.create_api_app_from_file(load_file)

    uvicorn.run(app, host=host, port=port, log_config=None)


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

    project_path = (Path.cwd() / args.project_path).absolute()
    bootstrap_project(project_path)
    run_process(
        project_path,
        run_server,
        kwargs={
            "host": args.host,
            "port": args.port,
            "project_path": str(project_path),
        },
    )
