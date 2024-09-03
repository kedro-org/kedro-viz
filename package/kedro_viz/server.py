"""`kedro_viz.server` provides utilities to launch a webserver
for Kedro pipeline visualisation."""

from pathlib import Path
from typing import Any, Dict, Optional

from kedro.framework.session.store import BaseSessionStore
from kedro.io import DataCatalog
from kedro.pipeline import Pipeline

from kedro_viz.api.rest.responses import save_api_responses_to_fs
from kedro_viz.constants import DEFAULT_HOST, DEFAULT_PORT
from kedro_viz.data_access import DataAccessManager, data_access_manager
from kedro_viz.database import make_db_session_factory
from kedro_viz.integrations.kedro import data_loader as kedro_data_loader
from kedro_viz.integrations.kedro.sqlite_store import SQLiteStore
from kedro_viz.launchers.utils import _check_viz_up, _wait_for

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

    data_access_manager.add_catalog(catalog, pipelines)

    # add dataset stats before adding pipelines as the data nodes
    # need stats information and they are created during add_pipelines
    data_access_manager.add_dataset_stats(stats_dict)

    data_access_manager.add_pipelines(pipelines)


def load_and_populate_data(
    path: Path,
    env: Optional[str] = None,
    include_hooks: bool = False,
    package_name: Optional[str] = None,
    pipeline_name: Optional[str] = None,
    extra_params: Optional[Dict[str, Any]] = None,
):
    """Loads underlying Kedro project data and populates Kedro Viz Repositories"""

    # Loads data from underlying Kedro Project
    catalog, pipelines, session_store, stats_dict = kedro_data_loader.load_data(
        path,
        env,
        include_hooks,
        package_name,
        extra_params,
    )

    pipelines = (
        pipelines
        if pipeline_name is None
        else {pipeline_name: pipelines[pipeline_name]}
    )

    # Creates data repositories which are used by Kedro Viz Backend APIs
    populate_data(data_access_manager, catalog, pipelines, session_store, stats_dict)


# pylint: disable=too-many-locals
def run_server(
    host: str = DEFAULT_HOST,
    port: int = DEFAULT_PORT,
    load_file: Optional[str] = None,
    save_file: Optional[str] = None,
    pipeline_name: Optional[str] = None,
    env: Optional[str] = None,
    project_path: Optional[str] = None,
    autoreload: bool = False,
    include_hooks: bool = False,
    package_name: Optional[str] = None,
    extra_params: Optional[Dict[str, Any]] = None,
):  # pylint: disable=redefined-outer-name
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
        include_hooks: A flag to include all registered hooks in your Kedro Project.
        package_name: The name of the current package
        extra_params: Optional dictionary containing extra project parameters
            for underlying KedroContext. If specified, will update (and therefore
            take precedence over) the parameters retrieved from the project
            configuration.
    """
    # Importing below dependencies inside `run_server` to avoid ImportError
    # when calling `load_and_populate_data` from VSCode

    import fsspec  # pylint: disable=C0415
    import uvicorn  # pylint: disable=C0415

    from kedro_viz.api import apps  # pylint: disable=C0415

    path = Path(project_path) if project_path else Path.cwd()

    if load_file is None:
        load_and_populate_data(
            path,
            env,
            include_hooks,
            package_name,
            pipeline_name,
            extra_params,
        )
        # [TODO: As we can do this with `kedro viz build`,
        # we need to shift this feature outside of kedro viz run]
        if save_file:
            save_api_responses_to_fs(save_file, fsspec.filesystem("file"), True)

        app = apps.create_api_app_from_project(path, autoreload)
    else:
        if not Path(load_file).exists():
            raise ValueError(f"The provided filepath '{load_file}' does not exist.")

        app = apps.create_api_app_from_file(f"{path}/{load_file}/api")

    uvicorn.run(app, host=host, port=port, log_config=None)


if __name__ == "__main__":  # pragma: no cover
    import argparse
    import multiprocessing

    from watchgod import RegExpWatcher, run_process

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

    run_process_kwargs = {
        "path": project_path,
        "target": run_server,
        "kwargs": {
            "host": args.host,
            "port": args.port,
            "project_path": str(project_path),
        },
        "watcher_cls": RegExpWatcher,
        "watcher_kwargs": {"re_files": r"^.*(\.yml|\.yaml|\.py|\.json)$"},
    }

    viz_process = multiprocessing.Process(
        target=run_process, daemon=False, kwargs={**run_process_kwargs}
    )

    print("Starting Kedro Viz ...")

    viz_process.start()

    _wait_for(func=_check_viz_up, host=args.host, port=args.port)

    print(
        "Kedro Viz started successfully. \n\n"
        f"\u2728 Kedro Viz is running at \n http://{args.host}:{args.port}/"
    )
