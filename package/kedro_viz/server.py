"""`kedro_viz.server` provides utilities to launch a webserver
for Kedro pipeline visualisation."""

import logging
from pathlib import Path
from typing import Any, Dict, Optional

from kedro.io import DataCatalog
from kedro.pipeline import Pipeline

from kedro_viz.api.data_provider import set_inspection_adapter_provider
from kedro_viz.autoreload_file_filter import AutoreloadFileFilter
from kedro_viz.constants import DEFAULT_HOST, DEFAULT_PORT
from kedro_viz.data_access import DataAccessManager, data_access_manager
from kedro_viz.integrations.kedro import data_loader as kedro_data_loader
from kedro_viz.launchers.utils import _check_viz_up, _wait_for, display_cli_message
from kedro_viz.models.metadata import NodeExtras

logger = logging.getLogger(__name__)

DEV_PORT = 4142


def populate_data(
    data_access_manager: DataAccessManager,
    catalog: DataCatalog,
    pipelines: Dict[str, Pipeline],
    node_extras_dict: Dict[str, NodeExtras],
):
    """Populate data repositories. Should be called once on application start
    if creating an api app from project.
    """

    data_access_manager.add_catalog(catalog, pipelines)

    # add node_extras like dataset stats, styles before adding pipelines as the data nodes
    # need stats information and they are created during add_pipelines
    data_access_manager.add_node_extras(node_extras_dict)

    data_access_manager.add_pipelines(pipelines)


def load_and_populate_data(
    path: Path,
    env: Optional[str] = None,
    include_hooks: bool = False,
    package_name: Optional[str] = None,
    pipeline_name: Optional[str] = None,
    extra_params: Optional[Dict[str, Any]] = None,
    is_lite: bool = False,
):
    """Loads underlying Kedro project data and populates Kedro Viz Repositories.

    Under ``--lite`` the live project load is skipped entirely — only the inspection snapshot
    is read, ``data_access_manager`` stays empty, and the adapter provider answers from the
    snapshot alone. If the adapter fails to build under ``--lite`` (e.g. a stale ``--pipeline``
    argument), we fall through to the ``--lite`` live load so the user still gets a working
    visualisation rather than an empty graph.

    In every other case the live data is loaded first and the adapter is then layered on top
    when it can be built. The live load is not wasted: it backs the metadata bridge in full mode,
    and it is the engine that serves ``kedro viz run --params=...`` (the snapshot API has no
    runtime-params route, so the adapter is intentionally not installed for that case — see D14).
    """
    if is_lite and not extra_params:
        logger.info(
            "--lite: skipping the live project load; graph and node metadata will be served "
            "from the snapshot only."
        )
        if _configure_inspection_adapter_provider(
            path, env, pipeline_name, extra_params=None
        ):
            return
        logger.warning(
            "Inspection adapter could not be built under --lite; falling through to the "
            "--lite live load so the visualisation isn't empty."
        )

    # Loads data from underlying Kedro Project
    catalog, pipelines, node_extras_dict = kedro_data_loader.load_data(
        path, env, include_hooks, package_name, extra_params, is_lite
    )

    pipelines = (
        pipelines
        if pipeline_name is None
        else {pipeline_name: pipelines[pipeline_name]}
    )

    # Creates data repositories which are used by Kedro Viz Backend APIs
    populate_data(data_access_manager, catalog, pipelines, node_extras_dict)

    # Also try to build the snapshot-backed adapter on top of the live load. For ``--params`` the
    # adapter is intentionally not installed and the live path serves (D14); if the build fails
    # unexpectedly, the live path is already populated to serve requests as a fallback.
    _configure_inspection_adapter_provider(path, env, pipeline_name, extra_params)


def _configure_inspection_adapter_provider(
    path: Path,
    env: Optional[str],
    pipeline_name: Optional[str],
    extra_params: Optional[Dict[str, Any]],
) -> bool:
    """Install the inspection-adapter provider for this process.

    Returns ``True`` if the adapter was installed; ``False`` if the live runtime-params path
    should serve instead (``--params`` set or the adapter build raised). Callers that skipped the
    live load (e.g. the lite short-circuit) should check the return value and arrange a fallback
    when it is ``False``.
    """
    # The inspection snapshot API has no runtime-params route, so a project whose catalog or
    # parameters depend on ``extra_params`` would silently diverge from a live run. This is the
    # intentional runtime-params path (D14): serve from the live load, not the snapshot.
    if extra_params:
        logger.info(
            "Inspection adapter not installed: --params is set, so the graph is served from the "
            "live project load (the snapshot API has no runtime-params route)."
        )
        set_inspection_adapter_provider(None)
        return False

    try:
        from kedro_viz.api.inspection_adapter_provider import InspectionAdapterProvider

        provider = InspectionAdapterProvider(path, env=env, pipeline_name=pipeline_name)
    except Exception:
        # Unexpected: the adapter should build for any non-``--params`` project on kedro>=1.4.0.
        # Don't break a working viz — the live load is already populated — but make it loud that
        # the adapter is NOT active so this isn't mistaken for normal operation.
        logger.exception(
            "Inspection adapter FAILED to build; it is not active for this process. Serving the "
            "live graph path as a fallback. This is unexpected — please report it."
        )
        set_inspection_adapter_provider(None)
        return False

    set_inspection_adapter_provider(provider)
    logger.info(
        "Inspection adapter active: /api/main, /api/pipelines/{id}, /api/nodes/{id} and "
        "/api/run-status are served from the snapshot."
    )
    return True


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
    is_lite: bool = False,
):
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
        is_lite: A flag to run Kedro-Viz in lite mode.
    """
    # Importing below dependencies inside `run_server` to avoid ImportError
    # when calling `load_and_populate_data` from VSCode

    import fsspec
    import uvicorn

    from kedro_viz.api import apps

    path = Path(project_path) if project_path else Path.cwd()

    if load_file is None:
        load_and_populate_data(
            path, env, include_hooks, package_name, pipeline_name, extra_params, is_lite
        )
        # [TODO: As we can do this with `kedro viz build`,
        # we need to shift this feature outside of kedro viz run]
        if save_file:
            from kedro_viz.api.rest.responses.save_responses import (
                save_api_responses_to_fs,
            )

            save_api_responses_to_fs(save_file, fsspec.filesystem("file"), True)

        app = apps.create_api_app_from_project(path, autoreload)
    else:
        app = apps.create_api_app_from_file(f"{path}/{load_file}/api")

    uvicorn.run(app, host=host, port=port, log_config=None)


if __name__ == "__main__":  # pragma: no cover
    import argparse
    import multiprocessing

    from watchfiles import run_process

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

    run_process_args = [str(project_path)]
    run_process_kwargs = {
        "target": run_server,
        "kwargs": {
            "host": args.host,
            "port": args.port,
            "project_path": str(project_path),
        },
        "watch_filter": AutoreloadFileFilter(),
    }

    process_context = multiprocessing.get_context("spawn")

    viz_process = process_context.Process(
        target=run_process,
        daemon=False,
        args=run_process_args,
        kwargs={**run_process_kwargs},
    )

    display_cli_message("Starting Kedro Viz ...", "green")

    viz_process.start()

    _wait_for(func=_check_viz_up, host=args.host, port=args.port)

    display_cli_message(
        "Kedro Viz started successfully. \n\n"
        f"\u2728 Kedro Viz is running at \n http://{args.host}:{args.port}/",
        "green",
    )
