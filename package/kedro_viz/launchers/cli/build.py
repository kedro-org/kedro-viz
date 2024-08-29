"""`kedro_viz.launchers.cli.build` provides a cli command to build
a Kedro-Viz instance"""
# pylint: disable=import-outside-toplevel
import click

from kedro_viz.launchers.cli.main import viz


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
    from kedro_viz.launchers.cli.utils import create_shareableviz_process

    create_shareableviz_process("local", include_previews, include_hooks=include_hooks)
