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
import sys
import webbrowser
from collections import defaultdict
from pathlib import Path

import click
from flask import Flask, jsonify, send_from_directory
from kedro.cli import get_project_context

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


from time import sleep, time
from typing import Any, Callable


class WaitForException(Exception):
    pass


def wait_for(
    func: Callable,
    expected_result: Any = True,
    timeout_: int = 10,
    print_error: bool = True,
    sleep_for: int = 1,
    **kwargs: Any
) -> None:
    """
    Run specified function until it returns expected result until timeout.

    Args:
        func (Callable): Specified function
        expected_result (Any): result that is expected. Defaults to None.
        timeout_ (int): Time out in seconds. Defaults to 10.
        print_error (boolean): whether any exceptions raised should be printed.
            Defaults to False.
        sleep_for (int): Execute func every specified number of seconds.
            Defaults to 1.
        **kwargs: Arguments to be passed to func

    Raises:
         WaitForException: if func doesn't return expected result within the
         specified time

    """
    end = time() + timeout_

    while time() <= end:
        try:
            retval = func(**kwargs)
        except Exception as err:  # pylint: disable=broad-except
            if print_error:
                print(err)
        else:
            if retval == expected_result:
                return None
        sleep(sleep_for)

    raise WaitForException(
        "func: {}, didn't return {} within specified"
        " timeout: {}".format(func, expected_result, timeout_)
    )


import requests


def _check_viz_up():
    url = "http://127.0.0.1:5000/"
    response = requests.get(url)
    assert response.status_code == 200


import threading


# def _check_service_up(context: behave.runner.Context, url: str, string: str):
#     """Check that a service is running and responding appropriately.

#     Args:
#         context: Test context.
#         url: Url that is to be read.
#         string: The string to be checked.

#     """
#     response = .get(url, timeout=1.0)
#     response.raise_for_status()

#     data = response.text
#     assert string in data


def run_viz(line=None):
    # This needs to be global later
    x = threading.Thread(target=_call_viz, daemon=True)
    x.start()
    sleep(10)
    # wait_for(func=_check_viz_up())
    print("hello")
    wrapper = """
            <html lang="en"><head></head><body style="width:100; height:100;">
            <iframe src="http://127.0.0.1:5000/?hidenav" height=500 width="100%"></iframe>
            </body></html>"""
    # return wrapper
    from IPython.core.display import display, HTML

    display(HTML(wrapper))


def get_data_from_kedro():
    """ Get pipeline data from Kedro and format it appropriately """

    def pretty_name(name):
        name = name.replace("-", " ").replace("_", " ")
        parts = [n[0].upper() + n[1:] for n in name.split()]
        return " ".join(parts)

    pipeline = get_project_context("create_pipeline")()

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
        data = get_data_from_kedro()

    if save_file:
        Path(save_file).write_text(json.dumps(data, indent=4, sort_keys=True))
    else:
        if browser:
            webbrowser.open_new("http://127.0.0.1:{:d}/".format(port))
        app.run(host=host, port=port)
