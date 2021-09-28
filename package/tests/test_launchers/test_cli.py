# Copyright 2021 QuantumBlack Visual Analytics Limited
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
# EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
# OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND
# NONINFRINGEMENT. IN NO EVENT WILL THE LICENSOR OR OTHER CONTRIBUTORS
# BE LIABLE FOR ANY CLAIM, DAMAGES, OR OTHER LIABILITY, WHETHER IN AN
# ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF, OR IN
# CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
#
# The QuantumBlack Visual Analytics Limited ("QuantumBlack") name and logo
# (either separately or in combination, "QuantumBlack Trademarks") are
# trademarks of QuantumBlack. The License does not grant you any right or
# license to the QuantumBlack Trademarks. You may not use the QuantumBlack
# Trademarks or any confusingly similar mark as a trademark for your product,
# or use the QuantumBlack Trademarks in any other manner that might cause
# confusion in the marketplace, including but not limited to in advertising,
# on websites, or on software.
#
# See the License for the specific language governing permissions and
# limitations under the License.
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
