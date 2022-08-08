"""`kedro_viz.launchers.jupyter` provides line_magic to launch the viz server
from a jupyter notebook.
"""
# pragma: no cover
import os 
import logging
import multiprocessing
import socket
from contextlib import closing
from functools import partial
from time import sleep, time
from typing import Any, Callable, Dict

import requests
from IPython.core.display import HTML, display

from kedro_viz.server import run_server

_VIZ_PROCESSES: Dict[str, int] = {}


logger = logging.getLogger(__name__)

def _get_dbutils() -> Optional[Any]:
    """Get the instance of 'dbutils' or None if the one could not be found."""
    dbutils = globals().get("dbutils")
    if dbutils:
        return dbutils


class WaitForException(Exception):
    """WaitForException: if func doesn't return expected result within the specified time"""


def _wait_for(
    func: Callable,
    expected_result: Any = True,
    timeout: int = 10,
    print_error: bool = True,
    sleep_for: int = 1,
    **kwargs,
) -> None:
    """
    Run specified function until it returns expected result until timeout.

    Args:
        func (Callable): Specified function
        expected_result (Any): result that is expected. Defaults to None.
        timeout (int): Time out in seconds. Defaults to 10.
        print_error (boolean): whether any exceptions raised should be printed.
            Defaults to False.
        sleep_for (int): Execute func every specified number of seconds.
            Defaults to 1.
        **kwargs: Arguments to be passed to func

    Raises:
         WaitForException: if func doesn't return expected result within the
         specified time

    """
    end = time() + timeout

    while time() <= end:
        try:
            retval = func(**kwargs)
        except Exception as err:  # pylint: disable=broad-except
            if print_error:
                logger.error(err)
        else:
            if retval == expected_result:
                return None
        sleep(sleep_for)

    raise WaitForException(
        f"func: {func}, didn't return {expected_result} within specified timeout: {timeout}"
    )


def _check_viz_up(port):  # pragma: no cover
    url = "http://127.0.0.1:{}/".format(port)
    try:
        response = requests.get(url)
    except requests.ConnectionError:
        return False

    return response.status_code == 200


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


# pylint: disable=unused-argument,missing-type-doc
def run_viz(port: int = None, line=None, local_ns=None) -> None:
    """
    Line magic function to start kedro viz. It calls a kedro viz in a process and displays it in
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

    if local_ns is not None and "project_path" in local_ns:  # pragma: no cover
        target = partial(run_server, project_path=local_ns["project_path"])
    else:
        target = run_server

    viz_process = multiprocessing.Process(
        target=target, daemon=True, kwargs={"port": port}
    )

    viz_process.start()
    _VIZ_PROCESSES[port] = viz_process

    url = make_url(port)

    if "DATABRICKS_RUNTIME_VERSION" in os.environ:
            try:
                display_html(f"<a href='{url}'>Launch Kedro-Viz</a>")
            except EnvironmentError:
                print("Launch Kedro-Viz:", url)
    else: 
        _wait_for(func=_check_viz_up, port=port)

        wrapper = """
                <html lang="en"><head></head><body style="width:100; height:100;">
                <iframe src="http://127.0.0.1:{}/" height=500 width="100%"></iframe>
                </body></html>""".format(
            port
        )
        display(HTML(wrapper))

def get(dbutils, id):
    return getattr(
        dbutils.notebook.entry_point.getDbutils().notebook().getContext(), id
    )().get()

def make_url(port):
    dbutils = _get_dbutils()
    browser_host_name = get(dbutils, "browserHostName")
    workspace_id = get(dbutils, "workspaceId")
    cluster_id = get(dbutils, "clusterId")

    return f"https://{browser_host_name}/driver-proxy/o/{workspace_id}/{cluster_id}/{port}/"


def display_html(html: str) -> None:
    """
    Use databricks displayHTML from an external package
    Args:
    - html : html document to display
    """
    import inspect

    for frame in inspect.getouterframes(inspect.currentframe()):
        global_names = set(frame.frame.f_globals)
        # Use multiple functions to reduce risk of mismatch
        if all(v in global_names for v in ["displayHTML", "display", "spark"]):
            return frame.frame.f_globals["displayHTML"](html)
    raise EnvironmentError("Unable to detect displayHTML function")
