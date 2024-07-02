from unittest.mock import Mock, call

import pytest
import requests
from click.testing import CliRunner
from packaging.version import parse
from watchgod import RegExpWatcher, run_process

from kedro_viz import __version__
from kedro_viz.constants import SHAREABLEVIZ_SUPPORTED_PLATFORMS, VIZ_DEPLOY_TIME_LIMIT
from kedro_viz.launchers import cli
from kedro_viz.launchers.utils import _PYPROJECT
from kedro_viz.server import run_server


@pytest.fixture
def patched_check_viz_up(mocker):
    mocker.patch("kedro_viz.launchers.cli._check_viz_up", return_value=True)


@pytest.fixture
def patched_start_browser(mocker):
    mocker.patch("kedro_viz.launchers.cli._start_browser")


@pytest.fixture
def mock_viz_deploy_process(mocker):
    return mocker.patch("kedro_viz.launchers.cli.multiprocessing.Process")


@pytest.fixture
def mock_process_completed(mocker):
    return mocker.patch(
        "kedro_viz.launchers.cli.multiprocessing.Value", return_value=Mock()
    )


@pytest.fixture
def mock_exception_queue(mocker):
    return mocker.patch(
        "kedro_viz.launchers.cli.multiprocessing.Queue", return_value=Mock()
    )


@pytest.fixture
def mock_viz_load_and_deploy(mocker):
    return mocker.patch("kedro_viz.launchers.cli.load_and_deploy_viz")


@pytest.fixture
def mock_viz_deploy_progress_timer(mocker):
    return mocker.patch("kedro_viz.launchers.cli.viz_deploy_progress_timer")


@pytest.fixture
def mock_DeployerFactory(mocker):
    return mocker.patch("kedro_viz.launchers.cli.DeployerFactory")


@pytest.fixture
def mock_load_and_populate_data(mocker):
    return mocker.patch("kedro_viz.launchers.cli.load_and_populate_data")


@pytest.fixture
def mock_click_echo(mocker):
    return mocker.patch("click.echo")


@pytest.fixture
def mock_project_path(mocker):
    mock_path = "/tmp/project_path"
    mocker.patch("pathlib.Path.cwd", return_value=mock_path)
    return mock_path


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
    # Reduce the timeout argument from 600 to 1 to make test run faster.
    mocker.patch("kedro_viz.launchers.cli._wait_for.__defaults__", (True, 1, True, 1))
    # Mock finding kedro project
    mocker.patch(
        "kedro_viz.launchers.cli._find_kedro_project",
        return_value=run_server_args["project_path"],
    )

    with runner.isolated_filesystem():
        runner.invoke(cli.viz_cli, command_options)

    process_init.assert_called_once_with(
        target=run_server, daemon=False, kwargs={**run_server_args}
    )
    assert run_server_args["port"] in cli._VIZ_PROCESSES


def test_kedro_viz_command_should_log_project_not_found(
    mocker, mock_project_path, mock_click_echo
):
    # Reduce the timeout argument from 600 to 1 to make test run faster.
    mocker.patch("kedro_viz.launchers.cli._wait_for.__defaults__", (True, 1, True, 1))
    # Mock finding kedro project
    mocker.patch("kedro_viz.launchers.cli._find_kedro_project", return_value=None)
    runner = CliRunner()
    with runner.isolated_filesystem():
        runner.invoke(cli.viz_cli, ["viz", "run"])

    mock_click_echo_calls = [
        call(
            "\x1b[31mERROR: Failed to start Kedro-Viz : "
            "Could not find the project configuration "
            f"file '{_PYPROJECT}' at '{mock_project_path}'. \x1b[0m"
        )
    ]

    mock_click_echo.assert_has_calls(mock_click_echo_calls)


def test_kedro_viz_command_should_log_outdated_version(
    mocker, mock_http_response, mock_click_echo, mock_project_path
):
    installed_version = parse(__version__)
    mock_version = f"{installed_version.major + 1}.0.0"
    requests_get = mocker.patch("requests.get")
    requests_get.return_value = mock_http_response(
        data={"info": {"version": mock_version}}
    )

    mocker.patch("kedro_viz.server.run_server")

    # Reduce the timeout argument from 600 to 1 to make test run faster.
    mocker.patch("kedro_viz.launchers.cli._wait_for.__defaults__", (True, 1, True, 1))
    # Mock finding kedro project
    mocker.patch(
        "kedro_viz.launchers.cli._find_kedro_project", return_value=mock_project_path
    )
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


def test_kedro_viz_command_should_not_log_latest_version(
    mocker, mock_http_response, mock_click_echo, mock_project_path
):
    requests_get = mocker.patch("requests.get")
    requests_get.return_value = mock_http_response(
        data={"info": {"version": str(parse(__version__))}}
    )

    mocker.patch("kedro_viz.server.run_server")
    # Reduce the timeout argument from 600 to 1 to make test run faster.
    mocker.patch("kedro_viz.launchers.cli._wait_for.__defaults__", (True, 1, True, 1))
    # Mock finding kedro project
    mocker.patch(
        "kedro_viz.launchers.cli._find_kedro_project", return_value=mock_project_path
    )
    runner = CliRunner()
    with runner.isolated_filesystem():
        runner.invoke(cli.viz_cli, ["viz", "run"])

    mock_click_echo_calls = [call("\x1b[32mStarting Kedro Viz ...\x1b[0m")]

    mock_click_echo.assert_has_calls(mock_click_echo_calls)


def test_kedro_viz_command_should_not_log_if_pypi_is_down(
    mocker, mock_http_response, mock_click_echo, mock_project_path
):
    requests_get = mocker.patch("requests.get")
    requests_get.side_effect = requests.exceptions.RequestException("PyPI is down")

    mocker.patch("kedro_viz.server.run_server")
    # Reduce the timeout argument from 600 to 1 to make test run faster.
    mocker.patch("kedro_viz.launchers.cli._wait_for.__defaults__", (True, 1, True, 1))
    # Mock finding kedro project
    mocker.patch(
        "kedro_viz.launchers.cli._find_kedro_project", return_value=mock_project_path
    )
    runner = CliRunner()
    with runner.isolated_filesystem():
        runner.invoke(cli.viz_cli, ["viz", "run"])

    mock_click_echo_calls = [call("\x1b[32mStarting Kedro Viz ...\x1b[0m")]

    mock_click_echo.assert_has_calls(mock_click_echo_calls)


def test_kedro_viz_command_with_autoreload(
    mocker, patched_check_viz_up, patched_start_browser, mock_project_path
):
    process_init = mocker.patch("multiprocessing.Process")

    # Reduce the timeout argument from 600 to 1 to make test run faster.
    mocker.patch("kedro_viz.launchers.cli._wait_for.__defaults__", (True, 1, True, 1))
    # Mock finding kedro project
    mocker.patch(
        "kedro_viz.launchers.cli._find_kedro_project", return_value=mock_project_path
    )
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
            "include_hooks": False,
            "package_name": None,
            "extra_params": {},
        },
        "watcher_cls": RegExpWatcher,
        "watcher_kwargs": {"re_files": "^.*(\\.yml|\\.yaml|\\.py|\\.json)$"},
    }

    process_init.assert_called_once_with(
        target=run_process, daemon=False, kwargs={**run_process_kwargs}
    )
    assert run_process_kwargs["kwargs"]["port"] in cli._VIZ_PROCESSES


def test_viz_command_group(mocker, mock_click_echo):
    runner = CliRunner()

    with runner.isolated_filesystem():
        result = runner.invoke(cli.viz_cli, ["viz", "--help"])

    assert result.output == (
        "Usage: Kedro-Viz viz [OPTIONS] COMMAND [ARGS]...\n"
        "\n"
        "  Visualise a Kedro pipeline using Kedro viz.\n"
        "\n"
        "Options:\n"
        "  --help  Show this message and exit.\n"
        "\n"
        "Commands:\n"
        "  run*    Launch local Kedro Viz instance\n"
        "  build   Create build directory of local Kedro Viz instance with Kedro...\n"
        "  deploy  Deploy and host Kedro Viz on provided platform\n"
    )


@pytest.mark.parametrize(
    "command_options, deployer_args",
    [
        (
            [
                "viz",
                "deploy",
                "--platform",
                "azure",
                "--endpoint",
                "https://example-bucket.web.core.windows.net",
                "--bucket-name",
                "example-bucket",
            ],
            {
                "platform": "azure",
                "endpoint": "https://example-bucket.web.core.windows.net",
                "bucket_name": "example-bucket",
            },
        ),
        (
            [
                "viz",
                "deploy",
                "--platform",
                "aws",
                "--endpoint",
                "http://example-bucket.s3-website.us-east-2.amazonaws.com/",
                "--bucket-name",
                "example-bucket",
            ],
            {
                "platform": "aws",
                "endpoint": "http://example-bucket.s3-website.us-east-2.amazonaws.com/",
                "bucket_name": "example-bucket",
            },
        ),
        (
            [
                "viz",
                "deploy",
                "--platform",
                "gcp",
                "--endpoint",
                "http://34.120.87.227/",
                "--bucket-name",
                "example-bucket",
            ],
            {
                "platform": "gcp",
                "endpoint": "http://34.120.87.227/",
                "bucket_name": "example-bucket",
            },
        ),
        (
            [
                "viz",
                "deploy",
                "--platform",
                "gcp",
                "--endpoint",
                "http://34.120.87.227/",
                "--bucket-name",
                "example-bucket",
                "--include-hooks",
            ],
            {
                "platform": "gcp",
                "endpoint": "http://34.120.87.227/",
                "bucket_name": "example-bucket",
                "include_hooks": True,
            },
        ),
        (
            [
                "viz",
                "deploy",
                "--platform",
                "aws",
                "--endpoint",
                "http://example-bucket.s3-website.us-east-2.amazonaws.com/",
                "--bucket-name",
                "example-bucket",
                "--include-previews",
            ],
            {
                "platform": "aws",
                "endpoint": "http://example-bucket.s3-website.us-east-2.amazonaws.com/",
                "bucket_name": "example-bucket",
                "preview": True,
            },
        ),
    ],
)
def test_viz_deploy_valid_endpoint_and_bucket(command_options, deployer_args, mocker):
    runner = CliRunner()
    mocker.patch("fsspec.filesystem")
    create_shareableviz_process_mock = mocker.patch(
        "kedro_viz.launchers.cli.create_shareableviz_process"
    )

    with runner.isolated_filesystem():
        result = runner.invoke(cli.viz_cli, command_options)

    assert result.exit_code == 0

    create_shareableviz_process_mock.assert_called_once_with(
        deployer_args.get("platform"),
        deployer_args.get("preview", False),
        deployer_args.get("endpoint"),
        deployer_args.get("bucket_name"),
        deployer_args.get("include_hooks", False),
    )


def test_viz_deploy_invalid_platform(mocker, mock_click_echo):
    runner = CliRunner()
    with runner.isolated_filesystem():
        result = runner.invoke(
            cli.viz_cli,
            [
                "viz",
                "deploy",
                "--platform",
                "random",
                "--endpoint",
                "",
                "--bucket-name",
                "example-bucket",
            ],
        )

    assert result.exit_code == 0
    mock_click_echo_calls = [
        call(
            "\x1b[31mERROR: Invalid platform specified. Kedro-Viz supports \n"
            f"the following platforms - {*SHAREABLEVIZ_SUPPORTED_PLATFORMS,}\x1b[0m"
        )
    ]

    mock_click_echo.assert_has_calls(mock_click_echo_calls)


def test_viz_deploy_invalid_endpoint(mocker, mock_click_echo):
    runner = CliRunner()
    with runner.isolated_filesystem():
        result = runner.invoke(
            cli.viz_cli,
            [
                "viz",
                "deploy",
                "--platform",
                "aws",
                "--endpoint",
                "",
                "--bucket-name",
                "example-bucket",
            ],
        )

    assert result.exit_code == 0
    mock_click_echo_calls = [
        call(
            "\x1b[31mERROR: Invalid endpoint specified. If you are looking for platform \n"
            "agnostic shareable viz solution, please use the `kedro viz build` command\x1b[0m"
        )
    ]

    mock_click_echo.assert_has_calls(mock_click_echo_calls)


@pytest.mark.parametrize(
    "command_options, build_args",
    [
        (
            [
                "viz",
                "build",
            ],
            {
                "platform": "local",
            },
        ),
        (
            ["viz", "build", "--include-hooks"],
            {"platform": "local", "include_hooks": True},
        ),
        (
            ["viz", "build", "--include-previews"],
            {"platform": "local", "preview": True},
        ),
    ],
)
def test_successful_build_with_existing_static_files(
    command_options, build_args, mocker
):
    runner = CliRunner()
    mocker.patch("fsspec.filesystem")
    create_shareableviz_process_mock = mocker.patch(
        "kedro_viz.launchers.cli.create_shareableviz_process"
    )

    with runner.isolated_filesystem():
        result = runner.invoke(cli.viz_cli, command_options)

    assert result.exit_code == 0

    create_shareableviz_process_mock.assert_called_once_with(
        build_args.get("platform"),
        build_args.get("preview", False),
        include_hooks=build_args.get("include_hooks", False),
    )


@pytest.mark.parametrize(
    "platform, is_all_previews_enabled, endpoint, bucket_name,"
    "include_hooks, process_completed_value",
    [
        (
            "azure",
            True,
            "https://example-bucket.web.core.windows.net",
            "example-bucket",
            True,
            1,
        ),
        (
            "aws",
            True,
            "http://example-bucket.s3-website.us-east-2.amazonaws.com/",
            "example-bucket",
            True,
            1,
        ),
        (
            "gcp",
            False,
            "http://34.120.87.227/",
            "example-bucket",
            False,
            1,
        ),
        ("local", False, None, None, False, 1),
        (
            "azure",
            True,
            "https://example-bucket.web.core.windows.net",
            "example-bucket",
            False,
            0,
        ),
        (
            "aws",
            False,
            "http://example-bucket.s3-website.us-east-2.amazonaws.com/",
            "example-bucket",
            False,
            0,
        ),
        (
            "gcp",
            True,
            "http://34.120.87.227/",
            "example-bucket",
            True,
            0,
        ),
        ("local", True, None, None, True, 0),
    ],
)
def test_create_shareableviz_process(
    platform,
    is_all_previews_enabled,
    endpoint,
    bucket_name,
    include_hooks,
    process_completed_value,
    mock_viz_deploy_process,
    mock_process_completed,
    mock_exception_queue,
    mock_viz_load_and_deploy,
    mock_viz_deploy_progress_timer,
    mock_click_echo,
):
    mock_process_completed.return_value.value = process_completed_value
    cli.create_shareableviz_process(
        platform, is_all_previews_enabled, endpoint, bucket_name, include_hooks
    )

    # Assert the mocks were called as expected
    mock_viz_deploy_process.assert_called_once_with(
        target=mock_viz_load_and_deploy,
        args=(
            platform,
            is_all_previews_enabled,
            endpoint,
            bucket_name,
            include_hooks,
            None,
            mock_process_completed.return_value,
            mock_exception_queue.return_value,
        ),
    )
    mock_viz_deploy_process.return_value.start.assert_called_once()
    mock_viz_deploy_progress_timer.assert_called_once_with(
        mock_process_completed.return_value, VIZ_DEPLOY_TIME_LIMIT
    )
    mock_viz_deploy_process.return_value.terminate.assert_called_once()

    if process_completed_value:
        if platform != "local":
            msg = (
                "\x1b[32m\u2728 Success! Kedro Viz has been deployed on "
                f"{platform.upper()}. "
                "It can be accessed at :\n"
                f"{endpoint}\x1b[0m"
            )
        else:
            msg = (
                "\x1b[32m✨ Success! Kedro-Viz build files have been "
                "added to the `build` directory.\x1b[0m"
            )
    else:
        msg = (
            "\x1b[31mTIMEOUT ERROR: Failed to build/deploy Kedro-Viz "
            f"as the process took more than {VIZ_DEPLOY_TIME_LIMIT} seconds. "
            "Please try again later.\x1b[0m"
        )

    mock_click_echo_calls = [call(msg)]
    mock_click_echo.assert_has_calls(mock_click_echo_calls)


@pytest.mark.parametrize(
    "platform, is_all_previews_enabled, endpoint, bucket_name, include_hooks, package_name",
    [
        (
            "azure",
            False,
            "https://example-bucket.web.core.windows.net",
            "example-bucket",
            False,
            "demo_project",
        ),
        (
            "aws",
            True,
            "http://example-bucket.s3-website.us-east-2.amazonaws.com/",
            "example-bucket",
            True,
            "demo_project",
        ),
        ("gcp", True, "http://34.120.87.227/", "example-bucket", False, "demo_project"),
        ("local", False, None, None, True, "demo_project"),
    ],
)
def test_load_and_deploy_viz_success(
    platform,
    is_all_previews_enabled,
    endpoint,
    bucket_name,
    include_hooks,
    package_name,
    mock_DeployerFactory,
    mock_load_and_populate_data,
    mock_process_completed,
    mock_exception_queue,
    mock_click_echo,
    mock_project_path,
):
    deployer_mock = mock_DeployerFactory.create_deployer.return_value

    cli.load_and_deploy_viz(
        platform,
        is_all_previews_enabled,
        endpoint,
        bucket_name,
        include_hooks,
        package_name,
        mock_process_completed,
        mock_exception_queue,
    )

    mock_load_and_populate_data.assert_called_once_with(
        mock_project_path, include_hooks=include_hooks, package_name=package_name
    )
    mock_DeployerFactory.create_deployer.assert_called_once_with(
        platform, endpoint, bucket_name
    )
    deployer_mock.deploy.assert_called_once_with(is_all_previews_enabled)
    mock_click_echo.echo.assert_not_called()
