# Copyright 2020 QuantumBlack Visual Analytics Limited
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
# pylint: disable=protected-access
import json
import logging
import multiprocessing
import socket
import sys
import traceback
import webbrowser
from collections import defaultdict
from contextlib import closing
from dataclasses import asdict
from functools import partial
from pathlib import Path
from typing import Any, Dict, List, Set

import click
import kedro
import requests
from flask import Flask, abort, jsonify, send_from_directory
from IPython.core.display import HTML, display
from kedro.framework.cli.utils import KedroCliError
from kedro.framework.context import KedroContextError, load_context
from kedro.pipeline import Pipeline
from semver import VersionInfo
from toposort import toposort_flatten

from kedro_viz.models import (
    DataNode,
    DataNodeMetadata,
    ParametersNodeMetadata,
    TaskNode,
    TaskNodeMetadata,
    GenericAPIResponse,
)
from kedro_viz.services import LayersSortingService
from kedro_viz.repositories import GraphRepository
from kedro_viz.utils import wait_for

KEDRO_VERSION = VersionInfo.parse(kedro.__version__)

_VIZ_PROCESSES = {}  # type: Dict[int, multiprocessing.Process]

_DEFAULT_KEY = "__default__"

_DATA = None  # type: Dict

app = Flask(  # pylint: disable=invalid-name
    __name__, static_folder=str(Path(__file__).parent.absolute() / "html" / "static")
)

ERROR_PROJECT_ROOT = (
    "Could not find a Kedro project root. You can run `kedro viz` by either providing "
    "`--load-file` flag with a filepath to a JSON pipeline representation, "
    "or if the current working directory is the root of a Kedro project."
)

ERROR_PIPELINE_FLAG_NOT_SUPPORTED = (
    "`--pipeline` flag was provided, but it is not supported "
    "in Kedro version {}".format(kedro.__version__)
)


graph_repository = GraphRepository()


@app.route("/")
@app.route("/<path:subpath>")
def root(subpath="index.html"):
    """Serve the non static html and js etc"""
    return send_from_directory(
        str(Path(__file__).parent.absolute() / "html"), subpath, cache_timeout=0
    )


def _check_viz_up(port):
    url = "http://127.0.0.1:{}/".format(port)
    try:
        response = requests.get(url)
    except requests.ConnectionError:
        return False

    return response.status_code == 200


# pylint: disable=unused-argument
def run_viz(port=None, line=None, local_ns=None) -> None:
    """
    Line magic function to start kedro viz. It calls a kedro viz in a process and display it in
    the Jupyter notebook environment.

    Args:
        port: TCP port that viz will listen to. Defaults to 4141.
        line: line required by line magic interface.
        local_ns: Local namespace with local variables of the scope where the line magic is invoked.
            For more details, please visit:
            https://ipython.readthedocs.io/en/stable/config/custommagics.html

    """
    port = port or 4141  # Default argument doesn't work in Jupyter line magic.
    port = _allocate_port(start_at=port)

    if port in _VIZ_PROCESSES and _VIZ_PROCESSES[port].is_alive():
        _VIZ_PROCESSES[port].terminate()

    if local_ns is not None and "project_path" in local_ns:
        target = partial(_call_viz, project_path=local_ns["project_path"])
    else:
        target = _call_viz

    viz_process = multiprocessing.Process(
        target=target, daemon=True, kwargs={"port": port}
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


def _allocate_port(start_at: int, end_at: int = 65535) -> int:
    acceptable_ports = range(start_at, end_at + 1)

    viz_ports = _VIZ_PROCESSES.keys() & set(acceptable_ports)
    if viz_ports:  # reuse one of already allocated ports
        return sorted(viz_ports)[0]

    socket.setdefaulttimeout(2.0)  # seconds
    for port in acceptable_ports:  # iterate through all acceptable ports
        with closing(socket.socket(socket.AF_INET, socket.SOCK_STREAM)) as sock:
            if sock.connect_ex(("127.0.0.1", port)) != 0:  # port is available
                return port

    raise ValueError(
        "Cannot allocate an open TCP port for Kedro-Viz in a range "
        "from {} to {}".format(start_at, end_at)
    )


def _load_from_file(load_file: str) -> dict:
    global _DATA  # pylint: disable=global-statement,invalid-name
    _DATA = json.loads(Path(load_file).read_text())
    for key in ["nodes", "edges", "tags"]:
        if key not in _DATA:
            raise KedroCliError(
                "Invalid file, top level key '{}' not found.".format(key)
            )
    return _DATA


def _get_pipelines_from_context(context, pipeline_name) -> Dict[str, "Pipeline"]:
    if pipeline_name:
        return {pipeline_name: context._get_pipeline(name=pipeline_name)}
    return context.pipelines


def _sort_layers(
    nodes: Dict[str, Dict], dependencies: Dict[str, Set[str]]
) -> List[str]:
    """Given a DAG represented by a dictionary of nodes, some of which have a `layer` attribute,
    along with their dependencies, return the list of all layers sorted according to
    the nodes' topological order, i.e. a layer should appear before another layer in the list
    if its node is a dependency of the other layer's node, directly or indirectly.

    For example, given the following graph:
        node1(layer=a) -> node2 -> node4 -> node6(layer=d)
                            |                   ^
                            v                   |
                          node3(layer=b) -> node5(layer=c)
    The layers ordering should be: [a, b, c, d]

    In theory, this is a problem of finding the
    [transitive closure](https://en.wikipedia.org/wiki/Transitive_closure) in a graph of layers
    and then toposort them. The algorithm below follows a repeated depth-first search approach:
        * For every node, find all layers that depends on it in a depth-first search.
        * While traversing, build up a dictionary of {node_id -> layers} for the node
        that has already been visited.
        * Turn the final {node_id -> layers} into a {layer -> layers} to represent the layers'
        dependencies. Note: the key is a layer and the values are the parents of that layer,
        just because that's the format toposort requires.
        * Feed this layers dictionary to ``toposort`` and return the sorted values.
        * Raise CircularDependencyError if the layers cannot be sorted topologically,
        i.e. there are cycles among the layers.

    Args:
        nodes: A dictionary of {node_id -> node} represents the nodes in the graph.
            A node's schema is:
                {
                    "type": str,
                    "id": str,
                    "name": str,
                    "layer": Optional[str]
                    ...
                }
        dependencies: A dictionary of {node_id -> set(child_ids)}
            represents the direct dependencies between nodes in the graph.

    Returns:
        The list of layers sorted based on topological order.

    Raises:
        CircularDependencyError: When the layers have cyclic dependencies.
    """
    node_layers = {}  # map node_id to the layers that depend on it

    def find_child_layers(node_id: str) -> Set[str]:
        """For the given node_id, find all layers that depend on it in a depth-first manner.
        Build up the node_layers dependency dictionary while traversing so each node is visited
        only once.
        Note: Python's default recursive depth limit is 1000, which means this algorithm won't
        work for pipeline with more than 1000 nodes. However, we can rewrite this using stack if
        we run into this limit in practice.
        """
        if node_id in node_layers:
            return node_layers[node_id]

        node_layers[node_id] = set()

        # for each child node of the given node_id,
        # mark its layer and all layers that depend on it as child layers of the given node_id.
        for child_node_id in dependencies[node_id]:
            child_node = nodes[child_node_id]
            child_layer = child_node.get("layer")
            if child_layer is not None:
                node_layers[node_id].add(child_layer)
            node_layers[node_id].update(find_child_layers(child_node_id))

        return node_layers[node_id]

    # populate node_layers dependencies
    for node_id in nodes:
        find_child_layers(node_id)

    # compute the layer dependencies dictionary based on the node_layers dependencies,
    # represented as {layer -> set(parent_layers)}
    layer_dependencies = defaultdict(set)
    for node_id, child_layers in node_layers.items():
        node_layer = nodes[node_id].get("layer")

        # add the node's layer as a parent layer for all child layers.
        # Even if a child layer is the same as the node's layer, i.e. a layer is marked
        # as its own parent, toposort still works so we don't need to check for that explicitly.
        if node_layer is not None:
            for layer in child_layers:
                layer_dependencies[layer].add(node_layer)

    # toposort the layer_dependencies to find the layer order.
    # Note that for string, toposort_flatten will default to alphabetical order for tie-break.
    return toposort_flatten(layer_dependencies)


def _pretty_name(name: str) -> str:
    name = name.replace("-", " ").replace("_", " ")
    parts = [n.capitalize() for n in name.split()]
    return " ".join(parts)


def _pretty_modular_pipeline_name(modular_pipeline: str) -> str:
    """Takes the namespace of a modular pipeline and prettifies the
    last part to show as the modular pipeline name."""
    chunks = modular_pipeline.split(".")
    last_chunk = chunks[-1]
    return _pretty_name(last_chunk)


def format_pipelines_data(pipelines: Dict[str, "Pipeline"]) -> Dict[str, Any]:
    """
    Format pipelines and catalog data from Kedro for kedro-viz.

    Args:
        pipelines: Dictionary of Kedro pipeline objects.

    Returns:
        Dictionary of pipelines, nodes, edges, tags and layers, and pipelines list.

    """
    pipelines_list = []

    for pipeline_key, pipeline in pipelines.items():
        pipelines_list.append(GenericAPIResponse(pipeline_key))
        graph_repository.add_pipeline(pipeline_key, pipeline)

    nodes_dict = graph_repository.nodes.as_dict()
    nodes_list = graph_repository.nodes.as_list()
    edges_list = graph_repository.edges.as_list()
    # sort tags
    sorted_tags = [
        {"id": tag, "name": _pretty_name(tag)} for tag in sorted(graph_repository.tags)
    ]
    # sort layers
    sorted_layers = LayersSortingService.get_sorted_layers(
        nodes_dict, graph_repository.node_dependencies
    )

    default_pipeline = {"id": _DEFAULT_KEY, "name": _pretty_name(_DEFAULT_KEY)}
    selected_pipeline = (
        default_pipeline["id"]
        if default_pipeline in pipelines_list
        else pipelines_list[0]["id"]
    )

    sorted_modular_pipelines = _sort_and_format_modular_pipelines(
        graph_repository.modular_pipelines
    )
    _remove_non_modular_pipelines(nodes_list, graph_repository.modular_pipelines)

    res = {
        "nodes": nodes_list,
        "edges": edges_list,
        "tags": sorted_tags,
        "layers": sorted_layers,
        "pipelines": pipelines_list,
        "selected_pipeline": selected_pipeline,
        "modular_pipelines": sorted_modular_pipelines,
    }

    from pprint import pprint

    pprint(res)
    return res


def _remove_non_modular_pipelines(nodes_list, modular_pipelines):
    """Check parameter nodes only contain existing modular pipelines from the task nodes
    and remove those listed that aren't modular pipelines.

     Args:
       nodes_list: List of all nodes.
       modular_pipelines: Set of modular pipelines for all nodes.

    """
    for node in nodes_list:
        if node["type"] == "parameters" and node["modular_pipelines"]:
            pipes = [
                pipe for pipe in node["modular_pipelines"] if pipe in modular_pipelines
            ]
            node["modular_pipelines"] = sorted(pipes)


def _sort_and_format_modular_pipelines(modular_pipelines):
    return [
        {
            "id": modular_pipeline,
            "name": _pretty_modular_pipeline_name(modular_pipeline),
        }
        for modular_pipeline in sorted(modular_pipelines)
    ]


@app.route("/api/main")
def nodes_json():
    """Serve the data from all Kedro pipelines in the project.
    This includes basic node data amongst others edges, tags, and layers.
    """
    return jsonify(_DATA)


@app.route("/api/pipelines/<string:pipeline_id>")
def pipeline_data(pipeline_id):
    """Serve the data from a single pipeline in a Kedro project."""
    current_pipeline = {"id": pipeline_id, "name": _pretty_name(pipeline_id)}
    if current_pipeline not in _DATA["pipelines"]:
        abort(404, description="Invalid pipeline ID.")

    pipeline_node_ids = set()
    pipeline_nodes = []
    modular_pipelines = set()

    for node in _DATA["nodes"]:
        if pipeline_id in node["pipelines"]:
            pipeline_node_ids.add(node["id"])
            pipeline_nodes.append(node)
            modular_pipelines.update(node["modular_pipelines"])

    pipeline_edges = []
    for edge in _DATA["edges"]:
        if {edge["source"], edge["target"]} <= pipeline_node_ids:
            pipeline_edges.append(edge)

    sorted_modular_pipelines = _sort_and_format_modular_pipelines(modular_pipelines)

    return jsonify(
        {
            "nodes": pipeline_nodes,
            "edges": pipeline_edges,
            "tags": _DATA["tags"],
            "layers": _DATA["layers"],
            "pipelines": _DATA["pipelines"],
            "selected_pipeline": current_pipeline["id"],
            "modular_pipelines": sorted_modular_pipelines,
        }
    )


@app.route("/api/nodes/<string:node_id>")
def nodes_metadata(node_id):
    """Serve the metadata for node and dataset."""
    node = graph.nodes.get(node_id)
    if not node:
        abort(404, description="Invalid node ID.")

    if not node.has_metadata():
        return jsonify({})

    if isinstance(node, TaskNode):
        metadata = TaskNodeMetadata(node)
    elif isinstance(node, DataNode):
        metadata = DataNodeMetadata(node)
    else:
        metadata = ParametersNodeMetadata(node)

    return jsonify(asdict(metadata))


@app.errorhandler(404)
def resource_not_found(error):
    """Returns HTTP 404 on resource not found."""
    return jsonify(error=str(error)), 404


@click.group(name="Kedro-Viz")
def commands():
    """Visualize the pipeline using kedroviz."""


# pylint: disable=too-many-arguments
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
    "Browser will only be opened if host is localhost. Defaults to True.",
)
@click.option(
    "--load-file",
    default=None,
    type=click.Path(exists=True, dir_okay=False),
    help="Path to load the pipeline JSON file",
)
@click.option(
    "--save-file",
    default=None,
    type=click.Path(dir_okay=False, writable=True),
    help="Path to save the pipeline JSON file",
)
@click.option(
    "--pipeline",
    type=str,
    default=None,
    help="Name of the modular pipeline to visualize. "
    "If not set, the default pipeline is visualized",
)
@click.option(
    "--env",
    "-e",
    type=str,
    default=None,
    multiple=False,
    envvar="KEDRO_ENV",
    help="Kedro configuration environment. If not specified, "
    "catalog config in `local` will be used",
)
def viz(host, port, browser, load_file, save_file, pipeline, env):
    """Visualize the pipeline using kedroviz."""
    try:
        _call_viz(host, port, browser, load_file, save_file, pipeline, env)
    except KedroCliError:
        raise
    except Exception as ex:
        traceback.print_exc()
        raise KedroCliError(str(ex))


# pylint: disable=import-outside-toplevel,too-many-arguments,too-many-branches
def _call_viz(
    host=None,
    port=None,
    browser=None,
    load_file=None,
    save_file=None,
    pipeline_name=None,
    env=None,
    project_path=None,
):
    global _DATA  # pylint: disable=global-statement,invalid-name

    if load_file:
        # Remove all handlers for root logger
        root_logger = logging.getLogger()
        root_logger.handlers = []

        _DATA = _load_from_file(load_file)
    else:
        try:
            project_path = project_path or Path.cwd()

            if KEDRO_VERSION.match(">=0.17.0"):  # pragma: no cover
                from kedro.framework.session import KedroSession
                from kedro.framework.startup import (  # pylint: disable=no-name-in-module,import-error
                    _get_project_metadata,
                )

                package_name = _get_project_metadata(project_path).package_name
                if KEDRO_VERSION.match(">=0.17.1"):  # pragma: no cover
                    from kedro.framework.project import configure_project

                    configure_project(package_name)
                session_kwargs = dict(
                    package_name=package_name,
                    project_path=project_path,
                    env=env,
                    save_on_close=False,
                )
                session = KedroSession.create(  # pylint: disable=unexpected-keyword-arg
                    **session_kwargs
                )
                context = session.load_context()  # pylint: disable=no-member
                pipelines = _get_pipelines_from_context(context, pipeline_name)
            else:  # pragma: no cover
                context = load_context(project_path=project_path, env=env)
                pipelines = _get_pipelines_from_context(context, pipeline_name)
        except KedroContextError:
            raise KedroCliError(ERROR_PROJECT_ROOT)  # pragma: no cover

        graph_repository.set_catalog(context.catalog)
        _DATA = format_pipelines_data(pipelines)

    if save_file:
        Path(save_file).write_text(json.dumps(_DATA, indent=4, sort_keys=True))
    else:
        is_localhost = host in ("127.0.0.1", "localhost", "0.0.0.0")
        if browser and is_localhost:
            webbrowser.open_new("http://{}:{:d}/".format(host, port))
        app.run(host=host, port=port)


# Launch a develop viz server manually by supplying this server script with a project_path.
# Strictly used to launch a development server for viz.
# pylint: disable=invalid-name
if __name__ == "__main__":  # pragma: no cover
    import argparse

    from kedro.framework.startup import _get_project_metadata

    parser = argparse.ArgumentParser(description="Launch a development viz server")
    parser.add_argument("project_path", help="Path to a Kedro project")
    parser.add_argument(
        "--host", help="The host of the development server", default="localhost"
    )
    parser.add_argument(
        "--port", help="The port of the development server", default="4142"
    )
    args = parser.parse_args()

    source_dir = _get_project_metadata(args.project_path).source_dir
    sys.path.append(str(source_dir))

    _call_viz(host=args.host, port=args.port, project_path=args.project_path)
