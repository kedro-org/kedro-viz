"""`kedro_viz.launchers.utils` contains utility functions
used in the `kedro_viz.launchers` package."""

import logging
import webbrowser
from pathlib import Path
from time import sleep, time
from typing import Any, Callable, Union

import requests

logger = logging.getLogger(__name__)
_PYPROJECT = "pyproject.toml"


class WaitForException(Exception):
    """WaitForException: if func doesn't return expected result within the specified time"""


def _wait_for(
    func: Callable,
    expected_result: Any = True,
    # [TODO] This is a temporary fix for https://github.com/kedro-org/kedro-viz/issues/1768.
    timeout: int = 600,
    print_error: bool = True,
    sleep_for: int = 1,
    **kwargs,
) -> None:
    """
    Run specified function until it returns expected result until timeout.

    Args:
        func (Callable): Specified function to call
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
        except Exception as err:  # noqa: BLE001
            if print_error:
                logger.error(err)
        else:
            if retval == expected_result:
                return None
        sleep(sleep_for)

    raise WaitForException(
        f"func: {func}, didn't return {expected_result} within specified timeout: {timeout}"
    )


def _check_viz_up(host: str, port: int):
    """Checks if Kedro Viz Server has started and is responding to requests

    Args:
        host: the host that launched the webserver
        port: the port the webserver is listening
    """

    url = f"http://{host}:{port}/api/main"
    try:
        response = requests.get(url, timeout=10)
    except requests.ConnectionError:
        return False

    return response.status_code == 200


def _is_localhost(host: str) -> bool:
    """Check whether a host is a localhost"""
    return host in ("127.0.0.1", "localhost", "0.0.0.0")


def _start_browser(host: str, port: int):
    """Starts a new browser window only on a local interface

    Args:
        host: browser url host
        port: browser url port
    """

    if _is_localhost(host):
        webbrowser.open_new(f"http://{host}:{port}/")


def _is_project(project_path: Union[str, Path]) -> bool:
    metadata_file = Path(project_path).expanduser().resolve() / _PYPROJECT
    if not metadata_file.is_file():
        return False

    try:
        return "[tool.kedro]" in metadata_file.read_text(encoding="utf-8")
    except Exception:  # noqa: BLE001
        return False


def _find_kedro_project(current_dir: Path) -> Any:
    paths_to_check = [current_dir] + list(current_dir.parents)
    for project_dir in paths_to_check:
        if _is_project(project_dir):
            return project_dir
    return None
