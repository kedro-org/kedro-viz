"""`kedro_viz.launchers.cli.deploy` provides a cli command to deploy
a Kedro-Viz instance on cloud platforms"""

import click

from kedro_viz.constants import SHAREABLEVIZ_SUPPORTED_PLATFORMS
from kedro_viz.launchers.cli.main import viz


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
    from kedro_viz.launchers.cli.utils import (
        create_shareableviz_process,
        display_cli_message,
    )

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
