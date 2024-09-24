from pathlib import Path
from unittest import mock
from unittest.mock import Mock

import pytest
import requests

from kedro_viz.launchers.utils import (
    _check_viz_up,
    _find_kedro_project,
    _is_project,
    _start_browser,
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


class TestIsProject:
    project_path = Path.cwd()

    def test_no_metadata_file(self, mocker):
        mocker.patch.object(Path, "is_file", return_value=False)

        assert not _is_project(self.project_path)

    def test_toml_invalid_format(self, tmp_path):
        """Test for loading context from an invalid path."""
        toml_path = tmp_path / "pyproject.toml"
        toml_path.write_text("!!")  # Invalid TOML

        assert not _is_project(tmp_path)

    def test_non_kedro_project(self, mocker):
        mocker.patch.object(Path, "is_file", return_value=True)
        mocker.patch.object(Path, "read_text", return_value="[tool]")

        assert not _is_project(self.project_path)

    def test_valid_toml_file(self, mocker):
        mocker.patch.object(Path, "is_file", return_value=True)
        pyproject_toml_payload = "[tool.kedro]"  # \nproject_name = 'proj'"
        mocker.patch.object(Path, "read_text", return_value=pyproject_toml_payload)

        assert _is_project(self.project_path)

    def test_toml_bad_encoding(self, mocker):
        mocker.patch.object(Path, "is_file", return_value=True)
        mocker.patch.object(Path, "read_text", side_effect=UnicodeDecodeError)

        assert not _is_project(self.project_path)


@pytest.mark.parametrize(
    "project_dir, is_project_found, expected",
    [
        ("/path/to/valid/project", True, Path("/path/to/valid/project")),
        ("/path/to/nonexistent/project", False, None),
    ],
)
def test_find_kedro_project(project_dir, is_project_found, expected, mocker):
    mocker.patch("kedro_viz.launchers.utils._is_project", return_value=is_project_found)
    assert _find_kedro_project(Path(project_dir)) == expected
