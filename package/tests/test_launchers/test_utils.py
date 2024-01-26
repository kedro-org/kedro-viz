from unittest import mock
from unittest.mock import Mock, call, patch

import pytest
import requests

from kedro_viz.constants import VIZ_DEPLOY_TIME_LIMIT
from kedro_viz.launchers.utils import (
    _check_viz_up,
    _start_browser,
    viz_deploy_progress_timer,
)


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


def test_viz_deploy_progress_timer(capsys):
    mock_process_completed = Mock()
    mock_process_completed.value = 0

    with patch("kedro_viz.launchers.utils.sleep") as mock_sleep:
        viz_deploy_progress_timer(mock_process_completed, VIZ_DEPLOY_TIME_LIMIT)

    assert mock_sleep.call_count == VIZ_DEPLOY_TIME_LIMIT + 1

    expected_sleep_calls = [call(1)] * (VIZ_DEPLOY_TIME_LIMIT + 1)
    mock_sleep.assert_has_calls(expected_sleep_calls)
    captured = capsys.readouterr()

    for second in range(1, VIZ_DEPLOY_TIME_LIMIT + 1):
        expected_output = f"...Creating your build/deploy Kedro-Viz ({second}s)"
        assert expected_output in captured.out
