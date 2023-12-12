"""`kedro_viz.launchers.utils` contains utility functions
used in the `kedro_viz.launchers` package."""
import logging
import webbrowser
from time import sleep, time
from typing import Any, Callable

import requests

from kedro_viz.constants import VIZ_DEPLOY_TIME_LIMIT

logger = logging.getLogger(__name__)


class WaitForException(Exception):
    """WaitForException: if func doesn't return expected result within the specified time"""


def _wait_for(
    func: Callable,
    expected_result: Any = True,
    timeout: int = 60,
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


def viz_deploy_progress_timer():
    """Shows progress timer and message for kedro viz deploy"""
    seconds = 0
    try:
        while seconds <= VIZ_DEPLOY_TIME_LIMIT:
            print(f"...Creating your webpage ({seconds}s)", end="\r", flush=True)
            sleep(1)
            seconds += 1
    except KeyboardInterrupt:  # pragma: no cover
        print("\nCreating your webpage interrupted. Exiting...")
