from unittest.mock import call

import pytest
from click.testing import CliRunner

from kedro_viz import __version__
from kedro_viz.constants import SHAREABLEVIZ_SUPPORTED_PLATFORMS
from kedro_viz.launchers.cli import main


@pytest.fixture
def mock_click_echo(mocker):
    return mocker.patch("click.echo")


class TestCliDeployViz:
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
    def test_viz_deploy_valid_endpoint_and_bucket(
        self, command_options, deployer_args, mocker
    ):
        runner = CliRunner()
        mocker.patch("fsspec.filesystem")
        create_shareableviz_process_mock = mocker.patch(
            "kedro_viz.launchers.cli.utils.create_shareableviz_process"
        )

        with runner.isolated_filesystem():
            result = runner.invoke(main.viz_cli, command_options)

        assert result.exit_code == 0

        create_shareableviz_process_mock.assert_called_once_with(
            deployer_args.get("platform"),
            deployer_args.get("preview", False),
            deployer_args.get("endpoint"),
            deployer_args.get("bucket_name"),
            deployer_args.get("include_hooks", False),
        )

    def test_viz_deploy_invalid_platform(self, mock_click_echo):
        runner = CliRunner()
        with runner.isolated_filesystem():
            result = runner.invoke(
                main.viz_cli,
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

    def test_viz_deploy_invalid_endpoint(self, mock_click_echo):
        runner = CliRunner()
        with runner.isolated_filesystem():
            result = runner.invoke(
                main.viz_cli,
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
