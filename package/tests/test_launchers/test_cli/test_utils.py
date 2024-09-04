from unittest.mock import Mock, call, patch

import pytest

from kedro_viz import __version__
from kedro_viz.constants import VIZ_DEPLOY_TIME_LIMIT
from kedro_viz.launchers.cli.utils import (
    _load_and_deploy_viz,
    _viz_deploy_progress_timer,
    create_shareableviz_process,
)


@pytest.fixture
def mock_viz_deploy_process(mocker):
    return mocker.patch("multiprocessing.Process")


@pytest.fixture
def mock_process_completed(mocker):
    return mocker.patch("multiprocessing.Value", return_value=Mock())


@pytest.fixture
def mock_exception_queue(mocker):
    return mocker.patch("multiprocessing.Queue", return_value=Mock())


@pytest.fixture
def mock_viz_load_and_deploy(mocker):
    return mocker.patch("kedro_viz.launchers.cli.utils._load_and_deploy_viz")


@pytest.fixture
def mock_viz_deploy_progress_timer(mocker):
    return mocker.patch("kedro_viz.launchers.cli.utils._viz_deploy_progress_timer")


@pytest.fixture
def mock_DeployerFactory(mocker):
    return mocker.patch(
        "kedro_viz.integrations.deployment.deployer_factory.DeployerFactory"
    )


@pytest.fixture
def mock_load_and_populate_data(mocker):
    return mocker.patch("kedro_viz.server.load_and_populate_data")


@pytest.fixture
def mock_click_echo(mocker):
    return mocker.patch("click.echo")


@pytest.fixture
def mock_project_path(mocker):
    mock_path = "/tmp/project_path"
    mocker.patch("pathlib.Path.cwd", return_value=mock_path)
    return mock_path


class TestCliUtils:
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
        self,
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
        create_shareableviz_process(
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
            (
                "gcp",
                True,
                "http://34.120.87.227/",
                "example-bucket",
                False,
                "demo_project",
            ),
            ("local", False, None, None, True, "demo_project"),
        ],
    )
    def test_load_and_deploy_viz_success(
        self,
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

        _load_and_deploy_viz(
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

    def test_viz_deploy_progress_timer(self, capsys):
        mock_process_completed = Mock()
        mock_process_completed.value = 0

        with patch("kedro_viz.launchers.cli.utils.sleep") as mock_sleep:
            _viz_deploy_progress_timer(mock_process_completed, VIZ_DEPLOY_TIME_LIMIT)

        assert mock_sleep.call_count == VIZ_DEPLOY_TIME_LIMIT + 1

        expected_sleep_calls = [call(1)] * (VIZ_DEPLOY_TIME_LIMIT + 1)
        mock_sleep.assert_has_calls(expected_sleep_calls)
        captured = capsys.readouterr()

        for second in range(1, VIZ_DEPLOY_TIME_LIMIT + 1):
            expected_output = f"...Creating your build/deploy Kedro-Viz ({second}s)"
            assert expected_output in captured.out
