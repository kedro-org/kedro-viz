import pytest
from click.testing import CliRunner
from watchgod import RegExpWatcher

from kedro_viz.launchers import cli


@pytest.mark.parametrize(
    "command_options,run_server_args",
    [
        (
            ["viz"],
            dict(
                host="127.0.0.1",
                port=4141,
                browser=True,
                load_file=None,
                save_file=None,
                pipeline_name=None,
                env=None,
                autoreload=False,
            ),
        ),
        (
            [
                "viz",
                "--host",
                "8.8.8.8",
                "--port",
                "4142",
                "--no-browser",
                "--save-file",
                "save.json",
                "--pipeline",
                "data_science",
                "--env",
                "local",
            ],
            dict(
                host="8.8.8.8",
                port=4142,
                browser=False,
                load_file=None,
                save_file="save.json",
                pipeline_name="data_science",
                env="local",
                autoreload=False,
            ),
        ),
    ],
)
def test_kedro_viz_command_run_server(command_options, run_server_args, mocker):
    run_server = mocker.patch("kedro_viz.launchers.cli.run_server")
    runner = CliRunner()
    with runner.isolated_filesystem():
        runner.invoke(cli.commands, command_options)

    run_server.assert_called_once_with(**run_server_args)


def test_kedro_viz_command_with_autoreload(mocker):
    mocker.patch("webbrowser.open_new")
    mock_project_path = "/tmp/project_path"
    mocker.patch("pathlib.Path.cwd", return_value=mock_project_path)
    run_process = mocker.patch("kedro_viz.launchers.cli.run_process")
    runner = CliRunner()
    with runner.isolated_filesystem():
        runner.invoke(cli.commands, ["viz", "--autoreload"])

    run_process.assert_called_once_with(
        path=mock_project_path,
        target=cli.run_server,
        kwargs={
            "host": "127.0.0.1",
            "port": 4141,
            "load_file": None,
            "save_file": None,
            "pipeline_name": None,
            "env": None,
            "autoreload": True,
            "browser": False,
            "project_path": mock_project_path,
        },
        watcher_cls=RegExpWatcher,
        watcher_kwargs={"re_files": "^.*(\\.yml|\\.yaml|\\.py|\\.json)$"},
    )
