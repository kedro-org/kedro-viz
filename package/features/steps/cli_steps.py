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

"""Behave step definitions for the cli_scenarios feature."""

from time import sleep, time

import requests
import yaml
from behave import given, then, when

from features.steps.sh_run import ChildTerminatingPopen, run

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
    """Behave step to run kedro new given the config I previously created."""
    res = run(
        [context.kedro, "new", "-c", str(context.config_file)],
        env=context.env,
        cwd=str(context.temp_dir),
    )
    assert res.returncode == OK_EXIT_CODE


@given("I have run a non-interactive kedro new with {starter} starter")
def create_project_with_starter(context, starter):
    """Behave step to run kedro new given the config I previously created."""
    res = run(
        [
            context.kedro,
            "new",
            "--starter",
            str(starter),
            "--config",
            str(context.config_file),
        ],
        env=context.env,
        cwd=str(context.temp_dir),
    )

    if res.returncode != OK_EXIT_CODE:
        print(res.stdout)
        print(res.stderr)
        assert False

    # add a consent file to prevent telemetry from prompting for input during e2e test
    telemetry_file = context.root_project_dir / ".telemetry"
    telemetry_file.write_text("consent: false", encoding="utf-8")
    assert res.returncode == OK_EXIT_CODE


@given('I have executed the kedro command "{command}"')
def exec_kedro_target_checked(context, command):
    """Execute Kedro command and check the status."""
    cmd = [context.kedro] + command.split()

    res = run(cmd, env=context.env, cwd=str(context.root_project_dir))

    if res.returncode != OK_EXIT_CODE:
        print(res.stdout)
        print(res.stderr)
        assert False

    # Wait for subprocess completion since on Windows it takes some time
    # to install dependencies in a separate console
    if "install" in cmd:
        max_duration = 5 * 60  # 5 minutes
        end_by = time() + max_duration

        while time() < end_by:
            result = run([context.pip, "show", "pandas"])
            if result.returncode == OK_EXIT_CODE:
                # package found
                return
            sleep(1.0)


@given('I have installed kedro version "{version}"')
def install_kedro(context, version):
    """Execute Kedro command and check the status."""
    if version == "latest":
        cmd = [context.pip, "install", "-U", "kedro"]
    else:
        cmd = [context.pip, "install", "kedro=={}".format(version)]
    res = run(cmd, env=context.env)

    if res.returncode != OK_EXIT_CODE:
        print(res.stdout)
        print(res.stderr)
        assert False


@when('I execute the kedro viz command "{command}"')
def exec_viz_command(context, command):
    """Execute Kedro viz command"""
    split_command = command.split()
    make_cmd = [context.kedro] + split_command

    context.result = ChildTerminatingPopen(
        make_cmd + ["--no-browser"], env=context.env, cwd=str(context.root_project_dir)
    )


@then("kedro-viz should start successfully")
def check_kedroviz_up(context):
    """Check that kedro-viz is up and responding to requests"""
    max_duration = 30  # 30 seconds
    end_by = time() + max_duration

    while time() < end_by:
        try:
            data_json = requests.get("http://localhost:4141/api/main").json()
        except Exception:
            sleep(2.0)
            continue
        else:
            break

    try:
        assert context.result.poll() is None
        assert (
            "example_iris_data"
            == sorted(data_json["nodes"], key=lambda i: i["full_name"])[0]["full_name"]
        )
    finally:
        context.result.terminate()
