import pytest
from click.testing import CliRunner

from kedro_viz import __version__
from kedro_viz.launchers.cli import main


class TestCliBuildViz:
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
        self, command_options, build_args, mocker
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
            build_args.get("platform"),
            build_args.get("preview", False),
            include_hooks=build_args.get("include_hooks", False),
        )
