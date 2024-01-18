"""`kedro_viz.launchers.cli` launches the viz server as a CLI app."""

import multiprocessing
import traceback
from pathlib import Path
from typing import Dict

import click
from kedro.framework.cli.project import PARAMS_ARG_HELP
from kedro.framework.cli.utils import KedroCliError, _split_params
from packaging.version import parse
from watchgod import RegExpWatcher, run_process

from kedro_viz import __version__
from kedro_viz.constants import (
    DEFAULT_HOST,
    DEFAULT_PORT,
    SHAREABLEVIZ_SUPPORTED_PLATFORMS,
)
from kedro_viz.integrations.deployment.deployer_factory import DeployerFactory
from kedro_viz.integrations.pypi import get_latest_version, is_running_outdated_version
from kedro_viz.launchers.utils import (
    _check_viz_up,
    _start_browser,
    _wait_for,
    viz_deploy_progress_timer,
)
from kedro_viz.server import load_and_populate_data

_VIZ_PROCESSES: Dict[str, int] = {}


@click.group(name="Kedro-Viz")
def viz_cli():  # pylint: disable=missing-function-docstring
    pass


@viz_cli.group(invoke_without_command=True)
@click.pass_context
def viz(ctx):
    """Visualise a Kedro pipeline using Kedro viz."""
    if ctx.invoked_subcommand is None:
        click.echo(
            click.style(
                "\nDid you mean this ? \n kedro viz run \n\n",
                fg="yellow",
            )
        )
        click.echo(click.style(f"{ctx.get_help()}"))


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
    help="Load Kedro-Viz using JSON files from the specified directory.",
)
@click.option(
    "--save-file",
    default=None,
    type=click.Path(dir_okay=False, writable=True),
    help="Save all API responses from the backend as JSON files in the specified directory.",
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
    "--ignore-plugins",
    is_flag=True,
    help="A flag to ignore all installed plugins in the Kedro Project",
)
@click.option(
    "--params",
    type=click.UNPROCESSED,
    default="",
    help=PARAMS_ARG_HELP,
    callback=_split_params,
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
    ignore_plugins,
    params,
):
    """Launch local Kedro Viz instance"""
    from kedro_viz.server import run_server

    installed_version = parse(__version__)
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
        if port in _VIZ_PROCESSES and _VIZ_PROCESSES[port].is_alive():
            _VIZ_PROCESSES[port].terminate()

        run_server_kwargs = {
            "host": host,
            "port": port,
            "load_file": load_file,
            "save_file": save_file,
            "pipeline_name": pipeline,
            "env": env,
            "autoreload": autoreload,
            "ignore_plugins": ignore_plugins,
            "extra_params": params,
        }
        if autoreload:
            project_path = Path.cwd()
            run_server_kwargs["project_path"] = project_path
            run_process_kwargs = {
                "path": project_path,
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

        click.echo(
            click.style(
                "Starting Kedro Viz ...",
                fg="green",
            ),
        )

        viz_process.start()

        _VIZ_PROCESSES[port] = viz_process

        _wait_for(func=_check_viz_up, host=host, port=port)

        click.echo(
            click.style(
                "Kedro Viz started successfully. \n\n"
                f"\u2728 Kedro Viz is running at \n http://{host}:{port}/",
                fg="green",
            )
        )

        if browser:
            _start_browser(host, port)

    except Exception as ex:  # pragma: no cover
        traceback.print_exc()
        raise KedroCliError(str(ex)) from ex


@viz.command(context_settings={"help_option_names": ["-h", "--help"]})
@click.option(
    "--platform",
    type=str,
    required=True,
    help=f"Supported Cloud Platforms like {*SHAREABLEVIZ_SUPPORTED_PLATFORMS,} to host Kedro Viz",
)
@click.option(
    "--endpoint",
    type=str,
    required=True,
    help="Static Website hosted endpoint."
    "(eg., For AWS - http://<bucket_name>.s3-website.<region_name>.amazonaws.com/)",
)
@click.option(
    "--bucket-name",
    type=str,
    required=True,
    help="Bucket Name where Kedro Viz will be hosted",
)
def deploy(platform, endpoint, bucket_name):
    """Deploy and host Kedro Viz on provided platform"""
    if platform not in SHAREABLEVIZ_SUPPORTED_PLATFORMS:
        click.echo(
            click.style(
                "ERROR: Invalid platform specified. Kedro-Viz supports \n"
                f"the following platforms - {*SHAREABLEVIZ_SUPPORTED_PLATFORMS,}",
                fg="red",
            ),
        )
        return

    if not endpoint:
        click.echo(
            click.style(
                "ERROR: Invalid endpoint specified. If you are looking for platform \n"
                "agnostic shareable viz solution, please use `kedro viz build` command",
                fg="red",
            ),
        )
        return

    platform_deployer(platform, endpoint, bucket_name)


@viz.command(context_settings={"help_option_names": ["-h", "--help"]})
def build():
    """Creates viz-build directory of local Kedro Viz instance with static data"""

    platform_deployer("local")


def platform_deployer(platform, endpoint=None, bucket_name=None):
    """Creates platform specific deployer and deploys Kedro Viz"""
    try:
        viz_deploy_timer = multiprocessing.Process(target=viz_deploy_progress_timer)
        viz_deploy_timer.start()

        # Loads and populates data from underlying Kedro Project
        load_and_populate_data(Path.cwd(), ignore_plugins=True)

        # Start the deployment
        deployer = DeployerFactory.create_deployer(platform, endpoint, bucket_name)
        url = deployer.deploy_and_get_url()

        if platform != "local":
            click.echo(
                click.style(
                    f"\u2728 Success! Kedro Viz has been deployed on {platform}. \n"
                    "It can be accessed at :\n"
                    f"{url}",
                    fg="green",
                ),
            )
        else:
            click.echo(
                click.style(
                    "\u2728 Success! Kedro-Viz build files have been successfully added to the "
                    f"`{url}` directory.",
                    fg="green",
                )
            )
    except PermissionError:  # pragma: no cover
        if platform != "local":
            click.echo(
                click.style(
                    "PERMISSION ERROR: Deploying and hosting Kedro-Viz requires "
                    f"{platform} access keys, a valid {platform} endpoint and bucket name.\n"
                    f"Please supply your {platform} access keys as environment variables "
                    f"and make sure the {platform} endpoint and bucket name are valid.\n"
                    "More information can be found at : "
                    "https://docs.kedro.org/en/stable/visualisation/share_kedro_viz.html",
                    fg="red",
                )
            )
        else:
            click.echo(
                click.style(
                    "PERMISSION ERROR: Please make sure, "
                    "you have write access to the current directory",
                    fg="red",
                )
            )

    # pylint: disable=broad-exception-caught
    except Exception as exc:  # pragma: no cover
        if platform != "local":
            click.echo(
                click.style(
                    f"ERROR: Failed to deploy and host Kedro-Viz on {platform} : {exc} ",
                    fg="red",
                )
            )
        else:
            click.echo(
                click.style(
                    f"ERROR: Failed to build Kedro-Viz : {exc} ",
                    fg="red",
                )
            )
    finally:
        viz_deploy_timer.terminate()
