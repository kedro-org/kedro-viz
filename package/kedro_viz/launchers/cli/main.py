"""`kedro_viz.launchers.cli.main` is an entry point for Kedro-Viz cli commands."""

import click

from kedro_viz.launchers.cli.lazy_group import LazyGroup


@click.group(
    name="Kedro-Viz",
    cls=LazyGroup,
    lazy_subcommands={
        "viz": "kedro_viz.launchers.cli.main.viz",
    },
)
def viz_cli():  # pylint: disable=missing-function-docstring
    pass


@viz_cli.group(
    name="Kedro-Viz",
    cls=LazyGroup,
    lazy_subcommands={
        "run": "kedro_viz.launchers.cli.run.run",
        "deploy": "kedro_viz.launchers.cli.deploy.deploy",
        "build": "kedro_viz.launchers.cli.build.build",
    },
)
@click.pass_context
def viz(ctx):  # pylint: disable=unused-argument
    """Visualise a Kedro pipeline using Kedro viz."""
