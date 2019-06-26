""" Kedro-Viz plugin and webserver """

import webbrowser
from pathlib import Path

import click
from flask import Flask, jsonify
from kedro.cli import get_project_context

app = Flask(  # pylint: disable=invalid-name
    __name__,
    static_folder=str(Path(__file__).parent.absolute() / "html"),
    static_url_path="",
)


@app.route("/")
def root():
    """Serve the index file."""
    return app.send_static_file("index.html")


@app.route("/logs/nodes.json")
def nodes():
    """Serve the pipeline data."""
    pipeline = get_project_context("create_pipeline")()
    return jsonify(
        [
            {
                "name": n.name,
                "inputs": [ds.split("@")[0] for ds in n.inputs],
                "outputs": [ds.split("@")[0] for ds in n.outputs],
                "tags": list(n.tags),
            }
            for n in pipeline.nodes
        ]
    )


@click.group(name="Kedro-Viz")
def commands():
    """Visualize the pipeline using kedroviz."""


@commands.command(context_settings=dict(help_option_names=["-h", "--help"]))
@click.option(
    "--host",
    default="127.0.0.1",
    help="Host that viz will listen to. Defaults to 127.0.0.1.",
)
@click.option(
    "--port",
    default=4141,
    type=int,
    help="TCP port that viz will listen to. Defaults to 4141.",
)
@click.option(
    "--browser/--no-browser",
    default=True,
    help="Whether to open viz interface in the default browser or not. "
    "Defaults to True.",
)
def viz(host, port, browser):
    """Visualize the pipeline using kedroviz."""

    if browser:
        webbrowser.open_new("http://127.0.0.1:{:d}/".format(port))
    app.run(host=host, port=port)
