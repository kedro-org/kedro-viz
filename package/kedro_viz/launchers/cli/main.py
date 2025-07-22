"""`kedro_viz.launchers.cli.main` is an entry point for Kedro-Viz cli commands."""

import click
from packaging.version import Version

from kedro_viz.constants import KEDRO_VERSION
from kedro_viz.launchers.cli.lazy_default_group import LazyDefaultGroup


@click.group(name="Kedro-Viz")
def viz_cli():
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
def viz(ctx):
    """Visualise a Kedro pipeline using Kedro viz."""
    if KEDRO_VERSION < Version("1.0.0"):  # pragma: no cover
        raise RuntimeError(  # pragma: no cover
            "Kedro Viz 12.0.0+ is incompatible with Kedro versions below 1.0.0. Please upgrade Kedro."
        )
