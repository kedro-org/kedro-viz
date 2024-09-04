import pytest
from click.testing import CliRunner

from kedro_viz.launchers.cli import main
from kedro_viz.launchers.cli.lazy_default_group import LazyDefaultGroup


@pytest.fixture(scope="class")
def runner():
    return CliRunner()


class TestCLIMain:
    def test_viz_cli_group(self):
        assert len(main.viz_cli.list_commands(None)) == 1
        assert len(main.viz.list_commands(None)) == 3

        assert main.viz_cli.list_commands(None) == ["viz"]
        assert main.viz.list_commands(None) == ["build", "deploy", "run"]

        assert main.viz_cli.get_command(None, "random") is None
        assert main.viz_cli.get_command(None, "viz") is not None
        assert main.viz.get_command(None, "run") is not None

        assert isinstance(main.viz_cli.get_command(None, "viz"), LazyDefaultGroup)

    def test_viz_help(self, runner):
        with runner.isolated_filesystem():
            result = runner.invoke(main.viz_cli, ["viz", "--help"])

        assert result.output == (
            "Usage: Kedro-Viz viz [OPTIONS] COMMAND [ARGS]...\n"
            "\n"
            "  Visualise a Kedro pipeline using Kedro viz.\n"
            "\n"
            "Options:\n"
            "  --help  Show this message and exit.\n"
            "\n"
            "Commands:\n"
            "  build   Create build directory of local Kedro Viz instance with Kedro...\n"
            "  deploy  Deploy and host Kedro Viz on provided platform\n"
            "  run     Launch local Kedro Viz instance\n"
        )

    def test_viz_run_help(self, runner):
        with runner.isolated_filesystem():
            result = runner.invoke(main.viz_cli, ["viz", "run", "--help"])

        assert result.exit_code == 0
        assert "Launch local Kedro Viz instance" in result.output
        assert "invalid-option" not in result.output
        assert "--host" in result.output

    def test_viz_build_help(self, runner):
        with runner.isolated_filesystem():
            result = runner.invoke(main.viz_cli, ["viz", "build", "--help"])

        assert result.exit_code == 0
        assert (
            "Create build directory of local Kedro Viz instance with Kedro project data"
            in result.output
        )
        assert "invalid-option" not in result.output
        assert "--include-hooks" in result.output
        assert "--include-previews" in result.output

    def test_viz_deploy_help(self, runner):
        with runner.isolated_filesystem():
            result = runner.invoke(main.viz_cli, ["viz", "deploy", "--help"])

        assert result.exit_code == 0
        assert "Deploy and host Kedro Viz on provided platform" in result.output
        assert "invalid-option" not in result.output
        assert "--platform" in result.output
        assert "--bucket-name" in result.output
