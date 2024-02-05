"""`kedro_viz.launchers.jupyter` provides line_magic to launch the viz server
from a jupyter notebook.
"""
# pragma: no cover
import logging
import multiprocessing
import os
import socket
from contextlib import closing
from typing import Any, Dict

import IPython
from IPython.display import HTML, display

from kedro_viz.launchers.utils import _check_viz_up, _wait_for
from kedro_viz.server import DEFAULT_HOST, DEFAULT_PORT, run_server

_VIZ_PROCESSES: Dict[str, int] = {}
_DATABRICKS_HOST = "0.0.0.0"

logger = logging.getLogger(__name__)


def _allocate_port(host: str, start_at: int, end_at: int = 65535) -> int:
    acceptable_ports = range(start_at, end_at + 1)

    viz_ports = _VIZ_PROCESSES.keys() & set(acceptable_ports)
    if viz_ports:  # reuse one of already allocated ports
        return sorted(viz_ports)[0]

    socket.setdefaulttimeout(2.0)  # seconds
    for port in acceptable_ports:  # iterate through all acceptable ports
        with closing(socket.socket(socket.AF_INET, socket.SOCK_STREAM)) as sock:
            if sock.connect_ex((host, port)) != 0:  # port is available
                return port

    raise ValueError(
        "Cannot allocate an open TCP port for Kedro-Viz in a range "
        f"from {start_at} to {end_at}"
    )


def _is_databricks() -> bool:
    return "DATABRICKS_RUNTIME_VERSION" in os.environ


def _get_databricks_object(name: str):
    """Gets object called `name` from the user namespace."""
    return IPython.get_ipython().user_ns.get(name)  # pragma: no cover


def _make_databricks_url(port: int) -> str:  # pragma: no cover
    """Generates the URL to the Kedro-Viz instance."""
    dbutils = _get_databricks_object("dbutils")

    if dbutils is None:
        raise EnvironmentError("Unable to find dbutils.")

    def dbutils_get(attr):
        return getattr(
            dbutils.notebook.entry_point.getDbutils().notebook().getContext(), attr
        )().get()

    browser_host_name = dbutils_get("browserHostName")
    workspace_id = dbutils_get("workspaceId")
    cluster_id = dbutils_get("clusterId")
    path_name = f"/driver-proxy/o/{workspace_id}/{cluster_id}/{port}/"

    return f"https://{browser_host_name}{path_name}"


def _display_databricks_html(port: int):  # pragma: no cover
    url = _make_databricks_url(port)
    displayHTML = _get_databricks_object("displayHTML")  # pylint: disable=invalid-name
    if displayHTML is not None:
        displayHTML(f"""<a href="{url}">Open Kedro-Viz</a>""")
    else:
        print(f"Kedro-Viz is available at {url}")


def run_viz(port: int = None, local_ns: Dict[str, Any] = None) -> None:
    """
    Line magic function to start kedro viz. It calls a kedro viz in a process and displays it in
    the Jupyter notebook environment.

    Args:
        port: TCP port that viz will listen to. Defaults to 4141.
        local_ns: Local namespace with local variables of the scope where the line magic
            is invoked. This argument must be in the signature, even though it is not
            used. This is because the Kedro IPython extension registers line magics with
            needs_local_scope.
            https://ipython.readthedocs.io/en/stable/config/custommagics.html

    """
    port = port or DEFAULT_PORT  # Default argument doesn't work in Jupyter line magic.
    host = _DATABRICKS_HOST if _is_databricks() else DEFAULT_HOST
    port = _allocate_port(
        host, start_at=int(port)
    )  # Line magic provides string arguments by default, so we need to convert to int.

    if port in _VIZ_PROCESSES and _VIZ_PROCESSES[port].is_alive():
        _VIZ_PROCESSES[port].terminate()

    project_path = (
        local_ns["context"].project_path
        if local_ns is not None and "context" in local_ns
        else None
    )

    process_context = multiprocessing.get_context("spawn")
    viz_process = process_context.Process(
        target=run_server,
        daemon=True,
        kwargs={"project_path": project_path, "host": host, "port": port},
    )

    viz_process.start()
    _VIZ_PROCESSES[port] = viz_process

    _wait_for(func=_check_viz_up, host=host, port=port)

    if _is_databricks():
        _display_databricks_html(port)
    else:
        url = f"http://{host}:{port}/"
        link_html = f'<a href="{url}" target="_blank">Open Kedro-Viz</a>'
        display(HTML(link_html))
