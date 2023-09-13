from unittest import mock
from unittest.mock import Mock

import pytest
import requests

from kedro_viz.launchers.utils import _check_viz_up, _start_browser


@pytest.mark.parametrize(
    "ip,should_browser_open",
    [
        ("0.0.0.0", True),
        ("127.0.0.1", True),
        ("localhost", True),
        ("8.8.8.8", False),
    ],
)
@mock.patch("kedro_viz.launchers.utils.webbrowser")
def test_browser_open(
    webbrowser,
    ip,
    should_browser_open,
    mocker,
):
    _start_browser(ip, port=4141)
    if should_browser_open:
        webbrowser.open_new.assert_called_once()
    else:
        webbrowser.open_new.assert_not_called()


@pytest.mark.parametrize(
    "host, port, status_code, expected_result",
    [
        ("localhost", 8080, 200, True),  # Successful response
        ("localhost", 8080, 500, False),  # Non-200 response
        ("localhost", 8080, None, False),  # Connection error
    ],
)
def test_check_viz_up(host, port, status_code, expected_result, mocker):
    if status_code is not None:
        mocker.patch("requests.get", return_value=Mock(status_code=status_code))
    else:
        mocker.patch("requests.get", side_effect=requests.ConnectionError())

    result = _check_viz_up(host, port)
    assert result == expected_result
