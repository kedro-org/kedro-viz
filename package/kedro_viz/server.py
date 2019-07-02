# Copyright 2018-2019 QuantumBlack Visual Analytics Limited
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
# http://www.apache.org/licenses/LICENSE-2.0
#
# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
# EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
# OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND
# NONINFRINGEMENT. IN NO EVENT WILL THE LICENSOR OR OTHER CONTRIBUTORS
# BE LIABLE FOR ANY CLAIM, DAMAGES, OR OTHER LIABILITY, WHETHER IN AN
# ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF, OR IN
# CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
#
# The QuantumBlack Visual Analytics Limited ("QuantumBlack") name and logo
# (either separately or in combination, "QuantumBlack Trademarks") are
# trademarks of QuantumBlack. The License does not grant you any right or
# license to the QuantumBlack Trademarks. You may not use the QuantumBlack
# Trademarks or any confusingly similar mark as a trademark for your product,
#     or use the QuantumBlack Trademarks in any other manner that might cause
# confusion in the marketplace, including but not limited to in advertising,
# on websites, or on software.
#
# See the License for the specific language governing permissions and
# limitations under the License.

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
