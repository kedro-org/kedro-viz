from pathlib import Path
from unittest.mock import call

import pytest
import requests
from click.testing import CliRunner
from packaging.version import parse
from watchfiles import run_process

from kedro_viz import __version__
from kedro_viz.autoreload_file_filter import AutoreloadFileFilter
from kedro_viz.launchers.cli import main
from kedro_viz.launchers.cli.run import _VIZ_PROCESSES
from kedro_viz.launchers.utils import _PYPROJECT, _find_available_port
from kedro_viz.server import run_server


@pytest.fixture
def patched_check_viz_up(mocker):
    mocker.patch("kedro_viz.launchers.utils._check_viz_up", return_value=True)


@pytest.fixture
def patched_start_browser(mocker):
    mocker.patch("kedro_viz.launchers.utils._start_browser")


@pytest.fixture
def mock_click_echo(mocker):
    return mocker.patch("click.echo")


@pytest.fixture
def mock_project_path(mocker):
    mock_path = "/tmp/project_path"
    mocker.patch("pathlib.Path.cwd", return_value=mock_path)
    return mock_path


class TestCliRunViz:
    @pytest.mark.parametrize(
        "command_options,run_server_args",
        [
            (
                ["viz"],
                {
                    "host": "127.0.0.1",
                    "port": 4141,
                    "load_file": None,
                    "save_file": None,
                    "pipeline_name": None,
                    "env": None,
                    "project_path": "testPath",
                    "autoreload": False,
                    "include_hooks": False,
                    "package_name": None,
                    "extra_params": {},
                    "is_lite": False,
                },
            ),
            (
                ["viz", "run"],
                {
                    "host": "127.0.0.1",
                    "port": 4141,
                    "load_file": None,
                    "save_file": None,
                    "pipeline_name": None,
                    "env": None,
                    "project_path": "testPath",
                    "autoreload": False,
                    "include_hooks": False,
                    "package_name": None,
                    "extra_params": {},
                    "is_lite": False,
                },
            ),
            (
                [
                    "viz",
                    "run",
                    "--host",
                    "localhost",
                ],
                {
                    "host": "localhost",
                    "port": 4141,
                    "load_file": None,
                    "save_file": None,
                    "pipeline_name": None,
                    "env": None,
                    "project_path": "testPath",
                    "autoreload": False,
                    "include_hooks": False,
                    "package_name": None,
                    "extra_params": {},
                    "is_lite": False,
                },
            ),
            (
                [
                    "viz",
                    "run",
                    "--host",
                    "8.8.8.8",
                    "--port",
                    "4142",
                    "--no-browser",
                    "--save-file",
                    "save_dir",
                    "--pipeline",
                    "data_science",
                    "--env",
                    "local",
                    "--params",
                    "extra_param=param",
                ],
                {
                    "host": "8.8.8.8",
                    "port": 4142,
                    "load_file": None,
                    "save_file": "save_dir",
                    "pipeline_name": "data_science",
                    "env": "local",
                    "project_path": "testPath",
                    "autoreload": False,
                    "include_hooks": False,
                    "package_name": None,
                    "extra_params": {"extra_param": "param"},
                    "is_lite": False,
                },
            ),
            (
                [
                    "viz",
                    "run",
                    "--host",
                    "8.8.8.8",
                    "--port",
                    "4142",
                    "--no-browser",
                    "--save-file",
                    "save_dir",
                    "-p",
                    "data_science",
                    "-e",
                    "local",
                    "--params",
                    "extra_param=param",
                ],
                {
                    "host": "8.8.8.8",
                    "port": 4142,
                    "load_file": None,
                    "save_file": "save_dir",
                    "pipeline_name": "data_science",
                    "env": "local",
                    "project_path": "testPath",
                    "autoreload": False,
                    "include_hooks": False,
                    "package_name": None,
                    "extra_params": {"extra_param": "param"},
                    "is_lite": False,
                },
            ),
            (
                ["viz", "run", "--include-hooks"],
                {
                    "host": "127.0.0.1",
                    "port": 4141,
                    "load_file": None,
                    "save_file": None,
                    "pipeline_name": None,
                    "env": None,
                    "project_path": "testPath",
                    "autoreload": False,
                    "include_hooks": True,
                    "package_name": None,
                    "extra_params": {},
                    "is_lite": False,
                },
            ),
            (
                ["viz", "run", "--lite"],
                {
                    "host": "127.0.0.1",
                    "port": 4141,
                    "load_file": None,
                    "save_file": None,
                    "pipeline_name": None,
                    "env": None,
                    "project_path": "testPath",
                    "autoreload": False,
                    "include_hooks": False,
                    "package_name": None,
                    "extra_params": {},
                    "is_lite": True,
                },
            ),
        ],
    )
    def test_kedro_viz_command_run_server(
        self,
        command_options,
        run_server_args,
        mocker,
        patched_check_viz_up,
        patched_start_browser,
    ):
        mock_process_context = mocker.patch("multiprocessing.get_context")
        mock_context_instance = mocker.Mock()
        mock_process_context.return_value = mock_context_instance
        mock_process = mocker.patch.object(mock_context_instance, "Process")
        runner = CliRunner()

        # Reduce the timeout argument from 600 to 1 to make test run faster.
        mocker.patch(
            "kedro_viz.launchers.utils._wait_for.__defaults__", (True, 1, True, 1)
        )

        # Mock _is_port_in_use to speed up test.
        mocker.patch("kedro_viz.launchers.utils._is_port_in_use", return_value=False)

        # Mock finding kedro project
        mocker.patch(
            "kedro_viz.launchers.utils._find_kedro_project",
            return_value=run_server_args["project_path"],
        )

        with runner.isolated_filesystem():
            runner.invoke(main.viz_cli, command_options)

        mock_process.assert_called_once_with(
            target=run_server, daemon=False, kwargs={**run_server_args}
        )

        assert run_server_args["port"] in _VIZ_PROCESSES

    def test_kedro_viz_command_should_log_project_not_found(
        self, mocker, mock_project_path, mock_click_echo
    ):
        # Reduce the timeout argument from 600 to 1 to make test run faster.
        mocker.patch(
            "kedro_viz.launchers.utils._wait_for.__defaults__", (True, 1, True, 1)
        )
        # Mock finding kedro project
        mocker.patch("kedro_viz.launchers.utils._find_kedro_project", return_value=None)
        runner = CliRunner()
        with runner.isolated_filesystem():
            runner.invoke(main.viz_cli, ["viz", "run"])

        mock_click_echo_calls = [
            call(
                "\x1b[31mERROR: Failed to start Kedro-Viz : "
                "Could not find the project configuration "
                f"file '{_PYPROJECT}' at '{mock_project_path}'. \x1b[0m"
            )
        ]

        mock_click_echo.assert_has_calls(mock_click_echo_calls)

    def test_kedro_viz_command_should_log_outdated_version(
        self, mocker, mock_http_response, mock_click_echo, mock_project_path
    ):
        installed_version = parse(__version__)
        mock_version = f"{installed_version.major + 1}.0.0"
        requests_get = mocker.patch("requests.get")
        requests_get.return_value = mock_http_response(
            data={"info": {"version": mock_version}}
        )

        mocker.patch("kedro_viz.server.run_server")

        # Reduce the timeout argument from 600 to 1 to make test run faster.
        mocker.patch(
            "kedro_viz.launchers.utils._wait_for.__defaults__", (True, 1, True, 1)
        )
        # Mock finding kedro project
        mocker.patch(
            "kedro_viz.launchers.utils._find_kedro_project",
            return_value=mock_project_path,
        )
        runner = CliRunner()
        with runner.isolated_filesystem():
            runner.invoke(main.viz_cli, ["viz", "run"])

        mock_click_echo_calls = [
            call(
                "\x1b[33mWARNING: You are using an old version of Kedro Viz. "
                f"You are using version {installed_version}; "
                f"however, version {mock_version} is now available.\n"
                "You should consider upgrading via the `pip install -U kedro-viz` command.\n"
                "You can view the complete changelog at "
                "https://github.com/kedro-org/kedro-viz/releases.\x1b[0m"
            )
        ]

        mock_click_echo.assert_has_calls(mock_click_echo_calls)

    def test_kedro_viz_command_should_not_log_latest_version(
        self, mocker, mock_http_response, mock_click_echo, mock_project_path
    ):
        requests_get = mocker.patch("requests.get")
        requests_get.return_value = mock_http_response(
            data={"info": {"version": str(parse(__version__))}}
        )

        mocker.patch("kedro_viz.server.run_server")
        # Reduce the timeout argument from 600 to 1 to make test run faster.
        mocker.patch(
            "kedro_viz.launchers.utils._wait_for.__defaults__", (True, 1, True, 1)
        )
        # Mock finding kedro project
        mocker.patch(
            "kedro_viz.launchers.utils._find_kedro_project",
            return_value=mock_project_path,
        )
        runner = CliRunner()
        with runner.isolated_filesystem():
            runner.invoke(main.viz_cli, ["viz", "run"])

        mock_click_echo_calls = [call("\x1b[32mStarting Kedro Viz ...\x1b[0m")]

        mock_click_echo.assert_has_calls(mock_click_echo_calls)

    def test_kedro_viz_command_should_not_log_if_pypi_is_down(
        self, mocker, mock_click_echo, mock_project_path
    ):
        requests_get = mocker.patch("requests.get")
        requests_get.side_effect = requests.exceptions.RequestException("PyPI is down")

        mocker.patch("kedro_viz.server.run_server")
        # Reduce the timeout argument from 600 to 1 to make test run faster.
        mocker.patch(
            "kedro_viz.launchers.utils._wait_for.__defaults__", (True, 1, True, 1)
        )
        # Mock finding kedro project
        mocker.patch(
            "kedro_viz.launchers.utils._find_kedro_project",
            return_value=mock_project_path,
        )
        runner = CliRunner()
        with runner.isolated_filesystem():
            runner.invoke(main.viz_cli, ["viz", "run"])

        mock_click_echo_calls = [call("\x1b[32mStarting Kedro Viz ...\x1b[0m")]

        mock_click_echo.assert_has_calls(mock_click_echo_calls)

    def test_kedro_viz_command_with_autoreload(
        self, mocker, tmp_path, patched_check_viz_up, patched_start_browser
    ):
        mock_process_context = mocker.patch("multiprocessing.get_context")
        mock_context_instance = mocker.Mock()
        mock_process_context.return_value = mock_context_instance
        mock_process = mocker.patch.object(mock_context_instance, "Process")
        mock_tmp_path = tmp_path / "tmp"
        mock_tmp_path.mkdir()
        mock_path = mock_tmp_path / "project_path"

        # Reduce the timeout argument from 600 to 1 to make test run faster.
        mocker.patch(
            "kedro_viz.launchers.utils._wait_for.__defaults__", (True, 1, True, 1)
        )
        # Mock finding kedro project
        mocker.patch(
            "kedro_viz.launchers.utils._find_kedro_project",
            return_value=mock_path,
        )
        runner = CliRunner()
        with runner.isolated_filesystem():
            runner.invoke(main.viz_cli, ["viz", "run", "--autoreload"])

        run_process_args = [str(mock_path)]
        run_process_kwargs = {
            "target": run_server,
            "kwargs": {
                "host": "127.0.0.1",
                "port": 4141,
                "load_file": None,
                "save_file": None,
                "pipeline_name": None,
                "env": None,
                "project_path": mock_path,
                "autoreload": True,
                "include_hooks": False,
                "package_name": None,
                "extra_params": {},
                "is_lite": False,
            },
            "watch_filter": mocker.ANY,
        }

        mock_process.assert_called_once_with(
            target=run_process,
            daemon=False,
            args=run_process_args,
            kwargs={**run_process_kwargs},
        )
        assert run_process_kwargs["kwargs"]["port"] in _VIZ_PROCESSES

    # Test case to simulate port occupation and check available port selection
    def test_find_available_port_with_occupied_ports(self, mocker):
        mock_is_port_in_use = mocker.patch("kedro_viz.launchers.utils._is_port_in_use")

        # Mock ports 4141, 4142 being occupied and 4143 is free
        mock_is_port_in_use.side_effect = [True, True, False]

        available_port = _find_available_port("127.0.0.1", 4141)

        # Assert that the function returns the first free port, 4143
        assert (
            available_port == 4143
        ), "Expected port 4143 to be returned as the available port"


def test_invalid_load_file_directory(mocker):
    """
    Test that Kedro-Viz raises a ValueError when an invalid filepath
    is provided to the `--load-file` argument.
    """
    runner = CliRunner()

    # Mock the existence of the file path to always return False (invalid path)
    mocker.patch.object(Path, "exists", return_value=False)

    # Invoke the CLI with an invalid `--load-file` path
    result = runner.invoke(
        main.viz_cli, ["viz", "run", "--load-file", "nonexistent_path.json"]
    )

    assert "The provided filepath 'nonexistent_path.json' does not exist." == str(
        result.exception
    )
