"""`kedro_viz.launchers.cli.main` is an entry point for Kedro-Viz cli commands."""

import click

from kedro_viz.launchers.cli.lazy_default_group import LazyDefaultGroup


@click.group(name="Kedro-Viz")
def viz_cli():  # pylint: disable=missing-function-docstring
    pass


@viz_cli.group(
    name="viz",
    cls=LazyDefaultGroup,
    lazy_subcommands={
        "run": "kedro_viz.launchers.cli.run.run",
        "deploy": "kedro_viz.launchers.cli.deploy.deploy",
        "build": "kedro_viz.launchers.cli.build.build",
    },
    default="run",
    default_if_no_args=True,
)
@click.pass_context
def viz(ctx):  # pylint: disable=unused-argument
    """Visualise a Kedro pipeline using Kedro viz."""
