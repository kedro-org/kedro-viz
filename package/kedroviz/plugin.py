import click
from kedro.cli.utils import python_call, forward_command
from kedro.cli import get_project_context
import tempfile
import json
from pathlib import Path


@click.group(name="KedroViz")
def commands():
    pass


@forward_command(commands, forward_help=True)
def viz(args):
    """Visualize the pipeline using kedroviz"""
    pipeline = get_project_context("create_pipeline")()
    data = json.dumps({"message": pipeline.to_json()})

    with tempfile.TemporaryDirectory() as directory:
        (Path(directory) / "pipeline.log").write_text(data, "utf-8")
        python_call("kedroviz", ["--logdir", directory] + list(args))
