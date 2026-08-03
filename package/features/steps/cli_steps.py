"""Behave step definitions for the cli_scenarios feature."""

import sys
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


def _numpy_pin_for_python() -> str | None:
    """Return the numpy pin used by lower_requirements.txt for this Python version."""
    version = sys.version_info
    if version >= (3, 14):
        return "2.3.2"
    if version >= (3, 13):
        return "2.1.0"
    if version >= (3, 12):
        return "2.0.2"
    if version >= (3, 10):
        return "1.26.4"
    return None


def _add_package_pin(requirements_path: str, package_name: str, version: str) -> None:
    """Append a package pin to a requirements file."""
    with open(requirements_path, "a", encoding="utf-8") as req_file:
        req_file.write(f"\n{package_name}=={version}\n")


def _ensure_kedro_cli(context):
    """Ensure the kedro CLI entry point exists after pip installs."""
    kedro_path = Path(context.kedro)
    if kedro_path.exists():
        return

    res = run([context.pip, "install", "-U", "kedro"], env=context.env)
    if res.returncode != OK_EXIT_CODE:
        print(res.stdout)
        print(res.stderr)
        assert False

    assert kedro_path.exists(), f"kedro CLI not found at {context.kedro}"


def _assert_viz_process_started(context) -> None:
    """Fail fast if kedro viz exits immediately after launch."""
    sleep(0.5)
    if context.result.poll() is None:
        return

    _, stderr = context.result.communicate()
    raise AssertionError(f"kedro viz failed to start: {stderr.decode()}")


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
    requirements_path = str(context.root_project_dir) + "/requirements.txt"

    if getattr(context, "lower_bound_requirements_installed", False):
        numpy_pin = _numpy_pin_for_python()
        if numpy_pin:
            _add_package_pin(requirements_path, "numpy", numpy_pin)

    cmd = [context.pip, "install", "-r", requirements_path]
    res = run(cmd, env=context.env)

    if res.returncode != OK_EXIT_CODE:
        print(res.stdout)
        print(res.stderr)
        assert False

    _ensure_kedro_cli(context)


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

    context.lower_bound_requirements_installed = True


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
    _ensure_kedro_cli(context)
    context.result = ChildTerminatingPopen(
        [context.kedro, "viz", "run", "--no-browser"],
        env=context.env,
        cwd=str(context.root_project_dir),
    )
    _assert_viz_process_started(context)


@when("I execute the kedro viz run command with lite option")
def exec_viz_lite_command(context):
    """Execute Kedro-Viz command."""
    _ensure_kedro_cli(context)
    context.result = ChildTerminatingPopen(
        [context.kedro, "viz", "run", "--lite", "--no-browser"],
        env=context.env,
        cwd=str(context.root_project_dir),
    )
    _assert_viz_process_started(context)


@then("kedro-viz should start successfully")
def check_kedroviz_up(context):
    """Check that Kedro-Viz is up and responding to requests."""
    max_duration = 30  # 30 seconds
    end_by = time() + max_duration
    data_json = None

    while time() < end_by:
        try:
            data_json = requests.get("http://localhost:4141/api/main").json()
        except Exception:  # noqa: BLE001
            sleep(2.0)
            continue
        else:
            break

    try:
        if context.result.poll() is not None:
            _, stderr = context.result.communicate()
            raise AssertionError(
                f"Kedro Viz process exited unexpectedly: {stderr.decode()}"
            )
        if data_json is None:
            raise AssertionError("Kedro Viz did not respond within 30 seconds")
        assert (
            "X_test" == sorted(data_json["nodes"], key=lambda i: i["name"])[0]["name"]
        )
    finally:
        context.result.terminate()


@then("I store the response from main endpoint")
def get_main_api_response(context):
    max_duration = 30  # 30 seconds
    end_by = time() + max_duration
    context.response = None

    while time() < end_by:
        try:
            response = requests.get("http://localhost:4141/api/main")
            context.response = response.json()
            assert response.status_code == 200
        except Exception:  # noqa: BLE001
            sleep(2.0)
            continue
        else:
            break

    try:
        if context.response is None:
            raise AssertionError("Kedro Viz did not respond within 30 seconds")
    finally:
        context.result.terminate()


@then("I compare the responses in regular and lite mode")
def compare_main_api_responses(context):
    regular_mode_response = requests.get("http://localhost:4141/api/main").json()
    assert context.response == regular_mode_response
