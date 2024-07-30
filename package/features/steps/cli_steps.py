"""Behave step definitions for the cli_scenarios feature."""

from pathlib import Path
from time import sleep, time

import requests
import yaml
from behave import given, then, when
from packaging.version import parse

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


def _add_package_pin(requirements_path: str, package_name: str, version: str) -> None:
    """Adds a package pin to the requirements file"""
    with open(requirements_path, "r") as req_file:
        requirements = req_file.readlines()

    requirements.append(f"{package_name}=={version}")

    with open(requirements_path, "w") as req_file:
        req_file.writelines(requirements)


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


@given("I have installed the project's requirements")
def install_project_requirements(context):
    """Run ``pip install -r requirements.txt``."""
    if context.kedro_version != "latest":
        requirements_path = str(context.root_project_dir) + "/src/requirements.txt"
        # numpy 2.0 breaks with old versions of pandas and this
        # could be removed when the lowest version supported is updated
        _add_package_pin(requirements_path, "numpy", "1.26.4")
    else:
        requirements_path = str(context.root_project_dir) + "/requirements.txt"

    cmd = [context.pip, "install", "-r", requirements_path]
    res = run(cmd, env=context.env)

    if res.returncode != OK_EXIT_CODE:
        print(res.stdout)
        print(res.stderr)
        assert False


@given("I have installed the lower-bound Kedro-viz requirements")
def install_lower_bound_requirements(context):
    cwd = Path(__file__).resolve().parent
    requirements_path = cwd / "lower_requirements.txt"
    cmd = [context.pip, "install", "-r", requirements_path]
    res = run(cmd, env=context.env)

    if res.returncode != OK_EXIT_CODE:
        print(res.stdout)
        print(res.stderr)
        assert False


@given('I have installed kedro version "{version}"')
def install_kedro(context, version):
    """Install Kedro using pip."""
    # add kedro_version to context
    context.kedro_version = version

    if version == "latest":
        cmd = [context.pip, "install", "-U", "kedro"]
    else:
        cmd = [context.pip, "install", "kedro=={}".format(version)]
    res = run(cmd, env=context.env)

    if res.returncode != OK_EXIT_CODE:
        print(res.stdout)
        print(res.stderr)
        assert False


@when("I execute the kedro viz run command")
def exec_viz_command(context):
    """Execute Kedro-Viz command."""
    context.result = ChildTerminatingPopen(
        [context.kedro, "viz", "run", "--no-browser"],
        env=context.env,
        cwd=str(context.root_project_dir),
    )


@then("kedro-viz should start successfully")
def check_kedroviz_up(context):
    """Check that Kedro-Viz is up and responding to requests."""
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
            "X_test" == sorted(data_json["nodes"], key=lambda i: i["name"])[0]["name"]
        )
    finally:
        context.result.terminate()
