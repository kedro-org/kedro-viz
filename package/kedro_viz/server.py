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
from collections import defaultdict
from pathlib import Path

import click
from flask import Flask, jsonify, send_from_directory
from kedro.cli import get_project_context

app = Flask(  # pylint: disable=invalid-name
    __name__, static_folder=str(Path(__file__).parent.absolute() / "html" / "static")
)


@app.route("/")
@app.route("/<path:subpath>")
def root(subpath="index.html"):
    """Serve the non static html and js etc"""
    return send_from_directory(
        str(Path(__file__).parent.absolute() / "html"), subpath, cache_timeout=0
    )


@app.route("/api/nodes.json")
def nodes_json():
    """Serve the pipeline data."""

    def pretty_name(name):
        name = name.replace("-", " ").replace("_", " ")
        parts = [n[0].upper() + n[1:] for n in name.split()]
        return " ".join(parts)

    pipeline = get_project_context("create_pipeline")()

    nodes = []
    edges = []
    namespace_tags = defaultdict(set)
    all_tags = set()

    for node in sorted(pipeline.nodes):
        task_id = "task/" + node.name.replace(" ", "")
        nodes.append(
            {
                "type": "task",
                "id": task_id,
                "name": getattr(node, "short_name", node.name),
                "full_name": str(node),
                "tags": sorted(node.tags),
            }
        )
        all_tags.update(node.tags)
        for data_set in node.inputs:
            namespace = data_set.split("@")[0]
            edges.append({"source": "data/" + namespace, "target": task_id})
            namespace_tags[namespace].update(node.tags)
        for data_set in node.outputs:
            namespace = data_set.split("@")[0]
            edges.append({"source": task_id, "target": "data/" + namespace})
            namespace_tags[namespace].update(node.tags)

    for namespace, tags in sorted(namespace_tags.items()):
        nodes.append(
            {
                "type": "data",
                "id": "data/" + namespace,
                "name": pretty_name(namespace),
                "full_name": namespace,
                "tags": sorted(tags),
                "is_parameters": bool("param" in namespace.lower()),
            }
        )

    tags = []
    for tag in sorted(all_tags):
        tags.append({"id": tag, "name": pretty_name(tag)})

    return jsonify({"snapshots": [{"nodes": nodes, "edges": edges, "tags": tags}]})


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
