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

    Builds only the viz node objects that back the metadata bridge (``/api/nodes/{id}``); the graph
    itself is served by the inspection adapter from the Kedro snapshot.
    """

    data_access_manager.add_catalog(catalog, pipelines)

    # add node_extras (dataset stats, styles) before building the nodes, since the data nodes
    # need stats information and they are created during add_metadata_nodes
    data_access_manager.add_node_extras(node_extras_dict)

    data_access_manager.add_metadata_nodes(pipelines)


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

    The inspection adapter is the only graph engine: ``/api/main``, ``/api/pipelines/{id}``,
    ``/api/nodes/{id}`` and ``/api/run-status`` are served from the Kedro snapshot.

    Under ``--lite`` the live project load is skipped entirely — only the snapshot is read and the
    adapter answers from it alone. In every other case the live data is loaded first to back the
    metadata bridge (source code, previews, stats) and to make ``kedro viz run --params=...`` fully
    correct (the adapter resolves parameter *values* itself, while the live bridge covers catalog
    paths templated on ``--params``); the adapter is then layered on top.

    The adapter must build for the visualisation to work; a build failure is raised (fail fast at
    startup) rather than silently degraded — there is no live-graph fallback.
    """
    if is_lite and not extra_params:
        logger.info(
            "--lite: skipping the live project load; graph and node metadata will be served "
            "from the snapshot only."
        )
        _configure_inspection_adapter_provider(
            path,
            env,
            pipeline_name,
            extra_params=None,
            is_lite=True,
            package_name=package_name,
        )
        return

    # Loads data from underlying Kedro Project
    catalog, pipelines, node_extras_dict = kedro_data_loader.load_data(
        path, env, include_hooks, package_name, extra_params, is_lite
    )

    pipelines = (
        pipelines
        if pipeline_name is None
        else {pipeline_name: pipelines[pipeline_name]}
    )

    # Build the node objects that back the metadata bridge (source code, previews, stats).
    populate_data(data_access_manager, catalog, pipelines, node_extras_dict)

    # Build the snapshot-backed adapter on top of the live load, passing --params as
    # runtime_params. ``is_lite`` is forwarded so ``--lite --params`` builds the adapter with the
    # project's missing deps mocked (matching the lite live load above); without it, the adapter
    # build would hard-fail in a bare env now that there is no live-graph fallback. The live load
    # backs the bridge (and catalog --params templating).
    _configure_inspection_adapter_provider(
        path,
        env,
        pipeline_name,
        extra_params,
        is_lite=is_lite,
        package_name=package_name,
    )


def _configure_inspection_adapter_provider(
    path: Path,
    env: Optional[str],
    pipeline_name: Optional[str],
    extra_params: Optional[Dict[str, Any]],
    *,
    is_lite: bool = False,
    package_name: Optional[str] = None,
) -> None:
    """Install the inspection-adapter provider for this process.

    The adapter is the only graph engine, so a build failure is re-raised (fail fast at startup):
    Kedro-Viz cannot serve the graph without it. The adapter should build for any project on
    kedro>=1.4.0.

    ``extra_params`` (``--params``) is passed to the adapter as ``runtime_params``: parameter
    *values* are resolved from the config loader, so the graph and node metadata reflect the
    overrides. Topology is param-invariant on kedro>=1.4. Catalog paths templated on
    ``${runtime_params:...}`` are reflected only via the live bridge (full mode), which is why the
    non-lite path still runs a live load alongside the adapter.

    Under ``is_lite`` the snapshot is built with the project's missing dependencies mocked, so the
    adapter can serve ``--lite`` even when the project's node-function libraries aren't installed.
    ``package_name`` lets the lite import-stubber detect project-relative imports.
    """
    from kedro_viz.api.inspection_adapter_provider import InspectionAdapterProvider

    try:
        provider = InspectionAdapterProvider(
            path,
            env=env,
            pipeline_name=pipeline_name,
            package_name=package_name,
            is_lite=is_lite,
            runtime_params=extra_params,
        )
    except Exception:
        set_inspection_adapter_provider(None)
        logger.exception(
            "Inspection adapter FAILED to build. Kedro-Viz serves the graph only from the Kedro "
            "inspection snapshot (kedro>=1.4.0) and cannot continue without it."
        )
        raise

    set_inspection_adapter_provider(provider)
    logger.info(
        "Inspection adapter active: /api/main, /api/pipelines/{id}, /api/nodes/{id} and "
        "/api/run-status are served from the snapshot."
    )


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
        "watch_filter": AutoreloadFileFilter(base_path=project_path),
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
