# Copyright 2018-2019 QuantumBlack Visual Analytics Limited
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
# http://www.apache.org/licenses/LICENSE-2.0
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
#     or use the QuantumBlack Trademarks in any other manner that might cause
# confusion in the marketplace, including but not limited to in advertising,
# on websites, or on software.
#
# See the License for the specific language governing permissions and
# limitations under the License.

"""Behave step definitions for the cli_scenarios feature."""

import json

import yaml
from behave import given, then, when

from features.steps.sh_run import ChildTerminatingPopen, run
from features.steps.util import download_url, wait_for

OK_EXIT_CODE = 0


def _create_config_file(context, include_example):
    context.config_file = context.temp_dir / "config.yml"
    context.project_name = "project-dummy"
    root_project_dir = context.temp_dir / context.project_name
    context.root_project_dir = root_project_dir
    config = {
        "project_name": context.project_name,
        "repo_name": context.project_name,
        "output_dir": str(context.temp_dir),
        "python_package": context.project_name.replace("-", "_"),
        "include_example": include_example,
    }
    with context.config_file.open("w") as config_file:
        yaml.dump(config, config_file, default_flow_style=False)


@given("I have prepared a config file with example code")
def create_config_file_with_example(context):
    """Behave step to create a temporary config file
    (given the existing temp directory) and store it in the context.
    """
    _create_config_file(context, include_example=True)


@given("I have run a non-interactive kedro new")
def create_project_from_config_file(context):
    """Behave step to run kedro new given the config I previously created.
    """
    res = run([context.kedro, "new", "-c", str(context.config_file)], env=context.env)
    assert res.returncode == OK_EXIT_CODE


@when('I execute the kedro viz command "{command}"')
def exec_viz_command(context, command):
    """Execute Kedro viz command """
    split_command = command.split()
    make_cmd = [context.kedro] + split_command

    context.result = ChildTerminatingPopen(
        make_cmd + ["--no-browser"], env=context.env, cwd=str(context.root_project_dir)
    )


@then("kedro-viz should start successfully")
def check_kedroviz_up(context):
    """Check that kedro-viz is up and responding to requests"""

    wait_for(
        _check_service_up, expected_result=None, print_error=False, context=context
    )


def _check_service_up(context):
    """
    Check that a service is running and responding appropriately

    Args:
        context (behave.runner.Context): Test context
    """
    data_json = json.loads(download_url("http://localhost:4141/api/nodes.json"))

    try:
        assert context.result.poll() is None
        assert (
            data_json["snapshots"][0]["nodes"][0]["full_name"]
            == "predict([example_model,example_test_x]) -> [example_predictions]"
        )
    finally:
        context.result.terminate()
