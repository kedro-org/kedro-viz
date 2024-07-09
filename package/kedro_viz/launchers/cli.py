"""`kedro_viz.launchers.cli` launches the viz server as a CLI app."""

import multiprocessing
import traceback
from pathlib import Path
from typing import Dict

import click
from click_default_group import DefaultGroup
from kedro.framework.cli.project import PARAMS_ARG_HELP
from kedro.framework.cli.utils import KedroCliError, _split_params
from kedro.framework.project import PACKAGE_NAME
from packaging.version import parse
from watchgod import RegExpWatcher, run_process

from kedro_viz import __version__
from kedro_viz.constants import (
    DEFAULT_HOST,
    DEFAULT_PORT,
    SHAREABLEVIZ_SUPPORTED_PLATFORMS,
    VIZ_DEPLOY_TIME_LIMIT,
)
from kedro_viz.integrations.deployment.deployer_factory import DeployerFactory
from kedro_viz.integrations.pypi import get_latest_version, is_running_outdated_version
from kedro_viz.launchers.utils import (
    _PYPROJECT,
    _check_viz_up,
    _find_kedro_project,
    _start_browser,
    _wait_for,
    viz_deploy_progress_timer,
)
from kedro_viz.server import load_and_populate_data

try:
    from azure.core.exceptions import ServiceRequestError
except ImportError:  # pragma: no cover
    ServiceRequestError = None  # type: ignore

_VIZ_PROCESSES: Dict[str, int] = {}


@click.group(name="Kedro-Viz")
def viz_cli():  # pylint: disable=missing-function-docstring
    pass


@viz_cli.group(cls=DefaultGroup, default="run", default_if_no_args=True)
@click.pass_context
def viz(ctx):  # pylint: disable=unused-argument
    """Visualise a Kedro pipeline using Kedro viz."""


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
):
    """Launch local Kedro Viz instance"""
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
        }
        if autoreload:
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
    help="Bucket name where Kedro Viz will be hosted",
)
@click.option(
    "--include-hooks",
    is_flag=True,
    help="A flag to include all registered hooks in your Kedro Project",
)
@click.option(
    "--include-previews",
    is_flag=True,
    help="A flag to include preview for all the datasets",
)
def deploy(platform, endpoint, bucket_name, include_hooks, include_previews):
    """Deploy and host Kedro Viz on provided platform"""
    if not platform or platform.lower() not in SHAREABLEVIZ_SUPPORTED_PLATFORMS:
        display_cli_message(
            "ERROR: Invalid platform specified. Kedro-Viz supports \n"
            f"the following platforms - {*SHAREABLEVIZ_SUPPORTED_PLATFORMS,}",
            "red",
        )
        return

    if not endpoint:
        display_cli_message(
            "ERROR: Invalid endpoint specified. If you are looking for platform \n"
            "agnostic shareable viz solution, please use the `kedro viz build` command",
            "red",
        )
        return

    create_shareableviz_process(
        platform,
        include_previews,
        endpoint,
        bucket_name,
        include_hooks,
    )


@viz.command(context_settings={"help_option_names": ["-h", "--help"]})
@click.option(
    "--include-hooks",
    is_flag=True,
    help="A flag to include all registered hooks in your Kedro Project",
)
@click.option(
    "--include-previews",
    is_flag=True,
    help="A flag to include preview for all the datasets",
)
def build(include_hooks, include_previews):
    """Create build directory of local Kedro Viz instance with Kedro project data"""

    create_shareableviz_process("local", include_previews, include_hooks=include_hooks)


def create_shareableviz_process(
    platform,
    is_all_previews_enabled,
    endpoint=None,
    bucket_name=None,
    include_hooks=False,
):
    """Creates platform specific deployer process"""
    try:
        process_completed = multiprocessing.Value("i", 0)
        exception_queue = multiprocessing.Queue()

        viz_deploy_process = multiprocessing.Process(
            target=load_and_deploy_viz,
            args=(
                platform,
                is_all_previews_enabled,
                endpoint,
                bucket_name,
                include_hooks,
                PACKAGE_NAME,
                process_completed,
                exception_queue,
            ),
        )

        viz_deploy_process.start()
        viz_deploy_progress_timer(process_completed, VIZ_DEPLOY_TIME_LIMIT)

        if not exception_queue.empty():  # pragma: no cover
            raise exception_queue.get_nowait()

        if not process_completed.value:
            raise TimeoutError()

        if platform != "local":
            display_cli_message(
                f"\u2728 Success! Kedro Viz has been deployed on {platform.upper()}. "
                "It can be accessed at :\n"
                f"{endpoint}",
                "green",
            )
        else:
            display_cli_message(
                "\u2728 Success! Kedro-Viz build files have been "
                "added to the `build` directory.",
                "green",
            )

    except TimeoutError:  # pragma: no cover
        display_cli_message(
            "TIMEOUT ERROR: Failed to build/deploy Kedro-Viz as the "
            f"process took more than {VIZ_DEPLOY_TIME_LIMIT} seconds. "
            "Please try again later.",
            "red",
        )

    except KeyboardInterrupt:  # pragma: no cover
        display_cli_message(
            "\nCreating your build/deploy Kedro-Viz process "
            "is interrupted. Exiting...",
            "red",
        )

    except PermissionError:  # pragma: no cover
        if platform != "local":
            display_cli_message(
                "PERMISSION ERROR: Deploying and hosting Kedro-Viz requires "
                f"{platform.upper()} access keys, a valid {platform.upper()} "
                "endpoint and bucket name.\n"
                f"Please supply your {platform.upper()} access keys as environment variables "
                f"and make sure the {platform.upper()} endpoint and bucket name are valid.\n"
                "More information can be found at : "
                "https://docs.kedro.org/en/stable/visualisation/share_kedro_viz.html",
                "red",
            )
        else:
            display_cli_message(
                "PERMISSION ERROR: Please make sure, "
                "you have write access to the current directory",
                "red",
            )
    # pylint: disable=broad-exception-caught
    except Exception as exc:  # pragma: no cover
        display_cli_message(f"ERROR: Failed to build/deploy Kedro-Viz : {exc} ", "red")

    finally:
        viz_deploy_process.terminate()


def load_and_deploy_viz(
    platform,
    is_all_previews_enabled,
    endpoint,
    bucket_name,
    include_hooks,
    package_name,
    process_completed,
    exception_queue,
):
    """Loads Kedro Project data, creates a deployer and deploys to a platform"""
    try:
        load_and_populate_data(
            Path.cwd(), include_hooks=include_hooks, package_name=package_name
        )

        # Start the deployment
        deployer = DeployerFactory.create_deployer(platform, endpoint, bucket_name)
        deployer.deploy(is_all_previews_enabled)

    except (
        # pylint: disable=catching-non-exception
        (FileNotFoundError, ServiceRequestError)
        if ServiceRequestError is not None
        else FileNotFoundError
    ):  # pragma: no cover
        exception_queue.put(Exception("The specified bucket does not exist"))
    # pylint: disable=broad-exception-caught
    except Exception as exc:  # pragma: no cover
        exception_queue.put(exc)
    finally:
        process_completed.value = 1


def display_cli_message(msg, msg_color=None):
    """Displays message for Kedro Viz build and deploy commands"""
    click.echo(
        click.style(
            msg,
            fg=msg_color,
        )
    )
