"""`kedro_viz.launchers.cli` launches the viz server as a CLI app."""

import traceback
import webbrowser
from pathlib import Path

import click
from kedro.framework.cli.project import PARAMS_ARG_HELP
from kedro.framework.cli.utils import KedroCliError, _split_params
from semver import VersionInfo
from watchgod import RegExpWatcher, run_process

from kedro_viz import __version__
from kedro_viz.integrations.pypi import get_latest_version, is_running_outdated_version
from kedro_viz.server import DEFAULT_HOST, DEFAULT_PORT, is_localhost, run_server


@click.group(name="Kedro-Viz")
def commands():  # pylint: disable=missing-function-docstring
    pass


@commands.command(context_settings=dict(help_option_names=["-h", "--help"]))
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
    type=click.Path(exists=True, dir_okay=False),
    help="Path to load the pipeline JSON file",
)
@click.option(
    "--save-file",
    default=None,
    type=click.Path(dir_okay=False, writable=True),
    help="Path to save the pipeline JSON file",
)
@click.option(
    "--pipeline",
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
    "--params",
    type=click.UNPROCESSED,
    default="",
    help=PARAMS_ARG_HELP,
    callback=_split_params,
)
def viz(host, port, browser, load_file, save_file, pipeline, env, autoreload, params):
    """Visualise a Kedro pipeline using Kedro viz."""
    installed_version = VersionInfo.parse(__version__)
    latest_version = get_latest_version()

    if is_running_outdated_version(installed_version, latest_version):
        click.echo(
            click.style(
                "WARNING: You are using an old version of Kedro Viz. "
                f"You are using version {installed_version}; "
                f"however, version {latest_version} is now available.\n"
                "You should consider upgrading via the `pip install -U kedro-viz` command.\n"
                "You can view the complete changelog at "
                "https://github.com/kedro-org/kedro-viz/releases.",
                fg="yellow",
            ),
        )

    try:
        run_server_kwargs = {
            "host": host,
            "port": port,
            "load_file": load_file,
            "save_file": save_file,
            "pipeline_name": pipeline,
            "env": env,
            "browser": browser,
            "autoreload": autoreload,
            "extra_params": params,
        }
        if autoreload:
            if browser and is_localhost(host):
                webbrowser.open_new(f"http://{host}:{port}/")

            project_path = Path.cwd()
            run_server_kwargs["project_path"] = project_path
            # we don't want to launch a new browser tab on reload
            run_server_kwargs["browser"] = False

            run_process(
                path=project_path,
                target=run_server,
                kwargs=run_server_kwargs,
                watcher_cls=RegExpWatcher,
                watcher_kwargs=dict(re_files=r"^.*(\.yml|\.yaml|\.py|\.json)$"),
            )

        else:
            run_server(**run_server_kwargs)
    except Exception as ex:  # pragma: no cover
        traceback.print_exc()
        raise KedroCliError(str(ex)) from ex
