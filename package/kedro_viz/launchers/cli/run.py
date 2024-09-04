"""`kedro_viz.launchers.cli.run` provides a cli command to run
a Kedro-Viz instance"""

from typing import Dict

import click
from kedro.framework.cli.project import PARAMS_ARG_HELP
from kedro.framework.cli.utils import _split_params

from kedro_viz.constants import DEFAULT_HOST, DEFAULT_PORT
from kedro_viz.launchers.cli.main import viz

_VIZ_PROCESSES: Dict[str, int] = {}


@viz.command(context_settings={"help_option_names": ["-h", "--help"]})
@click.option(
    "--host",
    default=DEFAULT_HOST,
    help="Host that viz will listen to. Defaults to localhost.",
)
@click.option(
    "--port",
    default=DEFAULT_PORT,
    type=int,
    help="TCP port that viz will listen to. Defaults to 4141.",
)
@click.option(
    "--browser/--no-browser",
    default=True,
    help="Whether to open viz interface in the default browser or not. "
    "Browser will only be opened if host is localhost. Defaults to True.",
)
@click.option(
    "--load-file",
    default=None,
    help="Path to load Kedro-Viz data from a directory",
)
@click.option(
    "--save-file",
    default=None,
    type=click.Path(dir_okay=False, writable=True),
    help="Path to save Kedro-Viz data to a directory",
)
@click.option(
    "--pipeline",
    "-p",
    type=str,
    default=None,
    help="Name of the registered pipeline to visualise. "
    "If not set, the default pipeline is visualised",
)
@click.option(
    "--env",
    "-e",
    type=str,
    default=None,
    multiple=False,
    envvar="KEDRO_ENV",
    help="Kedro configuration environment. If not specified, "
    "catalog config in `local` will be used",
)
@click.option(
    "--autoreload",
    "-a",
    is_flag=True,
    help="Autoreload viz server when a Python or YAML file change in the Kedro project",
)
@click.option(
    "--include-hooks",
    is_flag=True,
    help="A flag to include all registered hooks in your Kedro Project",
)
@click.option(
    "--params",
    type=click.UNPROCESSED,
    default="",
    help=PARAMS_ARG_HELP,
    callback=_split_params,
)
@click.option(
    "--lite",
    is_flag=True,
    help="A flag to load an experimental light-weight Kedro Viz",
)
# pylint: disable=import-outside-toplevel, too-many-locals
def run(
    host,
    port,
    browser,
    load_file,
    save_file,
    pipeline,
    env,
    autoreload,
    include_hooks,
    params,
    lite,
):
    """Launch local Kedro Viz instance"""
    # Deferring Imports
    import multiprocessing
    import traceback
    from pathlib import Path

    from kedro.framework.cli.utils import KedroCliError
    from kedro.framework.project import PACKAGE_NAME
    from packaging.version import parse

    from kedro_viz import __version__
    from kedro_viz.integrations.pypi import (
        get_latest_version,
        is_running_outdated_version,
    )
    from kedro_viz.launchers.cli.utils import display_cli_message
    from kedro_viz.launchers.utils import (
        _PYPROJECT,
        _check_viz_up,
        _find_kedro_project,
        _start_browser,
        _wait_for,
    )
    from kedro_viz.server import run_server

    kedro_project_path = _find_kedro_project(Path.cwd())

    if kedro_project_path is None:
        display_cli_message(
            "ERROR: Failed to start Kedro-Viz : "
            "Could not find the project configuration "
            f"file '{_PYPROJECT}' at '{Path.cwd()}'. ",
            "red",
        )
        return

    installed_version = parse(__version__)
    latest_version = get_latest_version()
    if is_running_outdated_version(installed_version, latest_version):
        display_cli_message(
            "WARNING: You are using an old version of Kedro Viz. "
            f"You are using version {installed_version}; "
            f"however, version {latest_version} is now available.\n"
            "You should consider upgrading via the `pip install -U kedro-viz` command.\n"
            "You can view the complete changelog at "
            "https://github.com/kedro-org/kedro-viz/releases.",
            "yellow",
        )
    try:
        if port in _VIZ_PROCESSES and _VIZ_PROCESSES[port].is_alive():
            _VIZ_PROCESSES[port].terminate()

        run_server_kwargs = {
            "host": host,
            "port": port,
            "load_file": load_file,
            "save_file": save_file,
            "pipeline_name": pipeline,
            "env": env,
            "project_path": kedro_project_path,
            "autoreload": autoreload,
            "include_hooks": include_hooks,
            "package_name": PACKAGE_NAME,
            "extra_params": params,
            "is_lite": lite,
        }
        if autoreload:
            from watchgod import RegExpWatcher, run_process

            run_process_kwargs = {
                "path": kedro_project_path,
                "target": run_server,
                "kwargs": run_server_kwargs,
                "watcher_cls": RegExpWatcher,
                "watcher_kwargs": {"re_files": r"^.*(\.yml|\.yaml|\.py|\.json)$"},
            }
            viz_process = multiprocessing.Process(
                target=run_process, daemon=False, kwargs={**run_process_kwargs}
            )
        else:
            viz_process = multiprocessing.Process(
                target=run_server, daemon=False, kwargs={**run_server_kwargs}
            )

        display_cli_message("Starting Kedro Viz ...", "green")

        viz_process.start()

        _VIZ_PROCESSES[port] = viz_process

        _wait_for(func=_check_viz_up, host=host, port=port)

        display_cli_message(
            "Kedro Viz started successfully. \n\n"
            f"\u2728 Kedro Viz is running at \n http://{host}:{port}/",
            "green",
        )

        if browser:
            _start_browser(host, port)

    except Exception as ex:  # pragma: no cover
        traceback.print_exc()
        raise KedroCliError(str(ex)) from ex
