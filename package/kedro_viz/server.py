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

import hashlib
import json
import multiprocessing
import sys
import webbrowser
from collections import defaultdict
from pathlib import Path
from typing import Dict

import click
import requests
from flask import Flask, jsonify, send_from_directory
from IPython.core.display import HTML, display
from kedro.cli import get_project_context

from kedro_viz.utils import wait_for

_VIZ_PROCESSES = {}  # type: Dict[int, multiprocessing.Process]

data = None  # pylint: disable=invalid-name

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


def _hash(value):
    return hashlib.sha1(value.encode("UTF-8")).hexdigest()[:8]


def _check_viz_up(port):
    url = "http://127.0.0.1:{}/".format(port)
    response = requests.get(url)
    return response.status_code == 200


# pylint: disable=unused-argument
def run_viz(port=None, line=None) -> None:
    """
    Line magic function to start kedro viz. It calls a kedro viz in a process and display it in
    the Jupyter notebook environment.

    Args:
        port: TCP port that viz will listen to. Defaults to 4141.
        line: line required by line magic interface.

    """
    if not port:  # Default argument doesn't work in Jupyter line magic
        port = 4141

    if port in _VIZ_PROCESSES:
        _VIZ_PROCESSES[port].terminate()

    viz_process = multiprocessing.Process(
        target=_call_viz, daemon=True, kwargs={"port": port}
    )
    viz_process.start()
    _VIZ_PROCESSES[port] = viz_process

    wait_for(func=_check_viz_up, port=port)

    wrapper = """
            <html lang="en"><head></head><body style="width:100; height:100;">
            <iframe src="http://127.0.0.1:{}/" height=500 width="100%"></iframe>
            </body></html>""".format(
        port
    )
    display(HTML(wrapper))


def format_pipeline_data(pipeline, catalog):
    """
    Format pipeline and catalog data from Kedro for kedro-viz

    Args:
        pipeline: Kedro pipeline object
        catalog:  Kedro catalog object
    """

    def pretty_name(name):
        name = name.replace("-", " ").replace("_", " ")
        parts = [n[0].upper() + n[1:] for n in name.split()]
        return " ".join(parts)

    nodes = []
    edges = []
    namespace_tags = defaultdict(set)
    all_tags = set()

    for node in sorted(pipeline.nodes, key=lambda n: n.name):
        task_id = _hash(str(node))
        nodes.append(
            {
                "type": "task",
                "id": task_id,
                "name": getattr(node, "short_name", node.name),
                "full_name": getattr(node, "_func_name", str(node)),
                "tags": sorted(node.tags),
            }
        )
        all_tags.update(node.tags)
        for data_set in node.inputs:
            namespace = data_set.split("@")[0]
            edges.append({"source": _hash(namespace), "target": task_id})
            namespace_tags[namespace].update(node.tags)
        for data_set in node.outputs:
            namespace = data_set.split("@")[0]
            edges.append({"source": task_id, "target": _hash(namespace)})
            namespace_tags[namespace].update(node.tags)

    for namespace, tags in sorted(namespace_tags.items()):
        is_param = bool("param" in namespace.lower())
        nodes.append(
            {
                "type": "parameters" if is_param else "data",
                "id": _hash(namespace),
                "name": pretty_name(namespace),
                "full_name": namespace,
                "tags": sorted(tags),
            }
        )

    tags = []
    for tag in sorted(all_tags):
        tags.append({"id": tag, "name": pretty_name(tag)})

    return {"nodes": nodes, "edges": edges, "tags": tags}


@app.route("/api/nodes.json")
def nodes_json():
    """Serve the pipeline data."""
    return jsonify(data)


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
@click.option("--load-file", default=None, type=click.Path(exists=True, dir_okay=False))
@click.option(
    "--save-file", default=None, type=click.Path(dir_okay=False, writable=True)
)
def viz(host, port, browser, load_file, save_file):
    """Visualize the pipeline using kedroviz."""
    _call_viz(host, port, browser, load_file, save_file)


def _call_viz(host=None, port=None, browser=None, load_file=None, save_file=None):
    global data  # pylint: disable=global-statement,invalid-name

    if load_file:
        data = json.loads(Path(load_file).read_text())
        for key in ["nodes", "edges", "tags"]:
            if key not in data:
                click.echo("Invalid file, top level key '{}' not found.".format(key))
                sys.exit(1)
    else:
        pipeline = get_project_context("create_pipeline")()
        catalog = get_project_context("create_catalog")(None)
        data = format_pipeline_data(pipeline, catalog)

    if save_file:
        Path(save_file).write_text(json.dumps(data, indent=4, sort_keys=True))
    else:
        if browser:
            webbrowser.open_new("http://127.0.0.1:{:d}/".format(port))
        app.run(host=host, port=port)
