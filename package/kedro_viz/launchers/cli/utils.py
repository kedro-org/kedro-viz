"""`kedro_viz.launchers.cli.utils` provides utility functions for cli commands."""
# pylint: disable=import-outside-toplevel
from pathlib import Path
from time import sleep
from typing import Union

import click

from kedro_viz.constants import VIZ_DEPLOY_TIME_LIMIT


def create_shareableviz_process(
    platform: str,
    is_all_previews_enabled: bool,
    endpoint: Union[str, None] = None,
    bucket_name: Union[str, None] = None,
    include_hooks: bool = False,
):
    """Creates platform specific deployer process"""

    import multiprocessing

    from kedro.framework.project import PACKAGE_NAME

    try:
        process_completed = multiprocessing.Value("i", 0)
        exception_queue = multiprocessing.Queue()  # type: ignore[var-annotated]

        viz_deploy_process = multiprocessing.Process(
            target=_load_and_deploy_viz,
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
        _viz_deploy_progress_timer(process_completed, VIZ_DEPLOY_TIME_LIMIT)

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


def display_cli_message(msg, msg_color=None):
    """Displays message for Kedro Viz build and deploy commands"""
    click.echo(
        click.style(
            msg,
            fg=msg_color,
        )
    )


def _load_and_deploy_viz(
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
        from kedro_viz.integrations.deployment.deployer_factory import DeployerFactory
        from kedro_viz.server import load_and_populate_data

        try:
            from azure.core.exceptions import ServiceRequestError
        except ImportError:  # pragma: no cover
            ServiceRequestError = None

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


def _viz_deploy_progress_timer(process_completed, timeout):
    """Shows progress timer and message for kedro viz deploy"""
    elapsed_time = 0
    while elapsed_time <= timeout and not process_completed.value:
        print(
            f"...Creating your build/deploy Kedro-Viz ({elapsed_time}s)",
            end="\r",
            flush=True,
        )
        sleep(1)
        elapsed_time += 1
