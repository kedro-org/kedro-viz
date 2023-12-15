from unittest.mock import call

import pytest
import requests
from click.testing import CliRunner
from packaging.version import parse
from watchgod import RegExpWatcher, run_process

from kedro_viz import __version__
from kedro_viz.launchers import cli
from kedro_viz.server import run_server


@pytest.fixture
def patched_check_viz_up(mocker):
    mocker.patch("kedro_viz.launchers.cli._check_viz_up", return_value=True)


@pytest.fixture
def patched_start_browser(mocker):
    mocker.patch("kedro_viz.launchers.cli._start_browser")


@pytest.mark.parametrize(
    "command_options,run_server_args",
    [
        (
            ["viz", "run"],
            {
                "host": "127.0.0.1",
                "port": 4141,
                "load_file": None,
                "save_file": None,
                "pipeline_name": None,
                "env": None,
                "autoreload": False,
                "ignore_plugins": False,
                "extra_params": {},
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
                "autoreload": False,
                "ignore_plugins": False,
                "extra_params": {},
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
                "autoreload": False,
                "ignore_plugins": False,
                "extra_params": {"extra_param": "param"},
            },
        ),
        (
            ["viz", "run", "--ignore-plugins"],
            {
                "host": "127.0.0.1",
                "port": 4141,
                "load_file": None,
                "save_file": None,
                "pipeline_name": None,
                "env": None,
                "autoreload": False,
                "ignore_plugins": True,
                "extra_params": {},
            },
        ),
    ],
)
def test_kedro_viz_command_run_server(
    command_options,
    run_server_args,
    mocker,
    patched_check_viz_up,
    patched_start_browser,
):
    process_init = mocker.patch("multiprocessing.Process")
    runner = CliRunner()

    mocker.patch("kedro_viz.launchers.cli._wait_for.__defaults__", (True, 1, True, 1))

    with runner.isolated_filesystem():
        runner.invoke(cli.viz_cli, command_options)

    process_init.assert_called_once_with(
        target=run_server, daemon=False, kwargs={**run_server_args}
    )
    assert run_server_args["port"] in cli._VIZ_PROCESSES


def test_kedro_viz_command_should_log_outdated_version(mocker, mock_http_response):
    installed_version = parse(__version__)
    mock_version = f"{installed_version.major + 1}.0.0"
    requests_get = mocker.patch("requests.get")
    requests_get.return_value = mock_http_response(
        data={"info": {"version": mock_version}}
    )
    mock_click_echo = mocker.patch("click.echo")

    mocker.patch("kedro_viz.server.run_server")
    runner = CliRunner()
    with runner.isolated_filesystem():
        runner.invoke(cli.viz_cli, ["viz", "run"])

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


def test_kedro_viz_command_should_not_log_latest_version(mocker, mock_http_response):
    requests_get = mocker.patch("requests.get")
    requests_get.return_value = mock_http_response(
        data={"info": {"version": str(parse(__version__))}}
    )
    mock_click_echo = mocker.patch("click.echo")

    mocker.patch("kedro_viz.server.run_server")
    runner = CliRunner()
    with runner.isolated_filesystem():
        runner.invoke(cli.viz_cli, ["viz", "run"])

    mock_click_echo_calls = [call("\x1b[32mStarting Kedro Viz ...\x1b[0m")]

    mock_click_echo.assert_has_calls(mock_click_echo_calls)


def test_kedro_viz_command_should_not_log_if_pypi_is_down(mocker, mock_http_response):
    requests_get = mocker.patch("requests.get")
    requests_get.side_effect = requests.exceptions.RequestException("PyPI is down")
    mock_click_echo = mocker.patch("click.echo")

    mocker.patch("kedro_viz.server.run_server")
    runner = CliRunner()
    with runner.isolated_filesystem():
        runner.invoke(cli.viz_cli, ["viz", "run"])

    mock_click_echo_calls = [call("\x1b[32mStarting Kedro Viz ...\x1b[0m")]

    mock_click_echo.assert_has_calls(mock_click_echo_calls)


def test_kedro_viz_command_with_autoreload(
    mocker, patched_check_viz_up, patched_start_browser
):
    process_init = mocker.patch("multiprocessing.Process")
    mock_project_path = "/tmp/project_path"
    mocker.patch("pathlib.Path.cwd", return_value=mock_project_path)
    # Reduce the timeout argument from 60 to 1 to make test run faster.
    mocker.patch("kedro_viz.launchers.cli._wait_for.__defaults__", (True, 1, True, 1))
    runner = CliRunner()
    with runner.isolated_filesystem():
        runner.invoke(cli.viz_cli, ["viz", "run", "--autoreload"])

    run_process_kwargs = {
        "path": mock_project_path,
        "target": run_server,
        "kwargs": {
            "host": "127.0.0.1",
            "port": 4141,
            "load_file": None,
            "save_file": None,
            "pipeline_name": None,
            "env": None,
            "autoreload": True,
            "project_path": mock_project_path,
            "ignore_plugins": False,
            "extra_params": {},
        },
        "watcher_cls": RegExpWatcher,
        "watcher_kwargs": {"re_files": "^.*(\\.yml|\\.yaml|\\.py|\\.json)$"},
    }

    process_init.assert_called_once_with(
        target=run_process, daemon=False, kwargs={**run_process_kwargs}
    )
    assert run_process_kwargs["kwargs"]["port"] in cli._VIZ_PROCESSES


def test_kedro_viz_command_group(mocker):
    mock_click_echo = mocker.patch("click.echo")
    runner = CliRunner()

    with runner.isolated_filesystem():
        runner.invoke(cli.viz_cli, ["viz"])

    mock_click_echo_calls = [
        call("\x1b[33m\nDid you mean this ? \n kedro viz run \n\n\x1b[0m"),
        call(
            "Usage: Kedro-Viz viz [OPTIONS] COMMAND [ARGS]...\n\n  "
            "Visualise a Kedro pipeline using Kedro viz.\n\n"
            "Options:\n  --help  Show this message and exit.\n\n"
            "Commands:\n  run  Launch local Kedro Viz instance\x1b[0m"
        ),
    ]

    mock_click_echo.assert_has_calls(mock_click_echo_calls)
