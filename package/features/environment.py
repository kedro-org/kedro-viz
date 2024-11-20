"""Behave environment setup commands"""

import os
import re
import shutil
import sys
import tempfile
import venv
from pathlib import Path
from typing import Set

from packaging.version import parse

from features.steps.sh_run import run

_PATHS_TO_REMOVE: Set[Path] = set()


def call(cmd, env, verbose=False):
    res = run(cmd, env=env)
    if res.returncode or verbose:
        print(">", " ".join(cmd))
        print(res.stdout)
        print(res.stderr)
    assert res.returncode == 0


def before_scenario(context, scenario):
    """Environment preparation before other cli tests are run.
    Installs kedro by running pip in the top level directory.
    """

    kedro_version = None

    for step in scenario.steps:
        if "I have installed kedro version" in step.name:
            match = re.search(r"\b\d+\.\d+\.\d+\b", step.name)
            if match:
                kedro_version = parse(match.group(0))
                break

    if (
        kedro_version
        and kedro_version < parse("0.18.12")
        and sys.version_info >= (3, 11)
    ):
        print(
            (
                f"{scenario} will be skipped as {kedro_version} is not "
                f"compatible with python {sys.version_info.major}.{sys.version_info.minor}"
            )
        )
        scenario.skip()

    # make a venv
    kedro_install_venv_dir = _create_new_venv()
    context.venv_dir = kedro_install_venv_dir
    context = _setup_context_with_venv(context, kedro_install_venv_dir)

    context.temp_dir = Path(tempfile.mkdtemp()).resolve()
    _PATHS_TO_REMOVE.add(context.temp_dir)


def _setup_context_with_venv(context, venv_dir):
    context.venv_dir = venv_dir
    # note the locations of some useful stuff
    # this is because exe resolution in subprocess doesn't respect a passed env
    if os.name == "posix":
        bin_dir = context.venv_dir / "bin"
        path_sep = ":"
    else:
        bin_dir = context.venv_dir / "Scripts"
        path_sep = ";"
    context.bin_dir = bin_dir
    context.pip = str(bin_dir / "pip")
    context.python = str(bin_dir / "python")
    context.kedro = str(bin_dir / "kedro")

    # clone the environment, remove any condas and venvs and insert our venv
    context.env = os.environ.copy()
    path = context.env["PATH"].split(path_sep)
    path = [p for p in path if not (Path(p).parent / "pyvenv.cfg").is_file()]
    path = [p for p in path if not (Path(p).parent / "conda-meta").is_dir()]
    path = [str(bin_dir)] + path
    # Activate environment
    context.env["PATH"] = path_sep.join(path)
    # Windows thinks the pip version check warning is a failure
    # so disable it here.
    context.env["PIP_DISABLE_PIP_VERSION_CHECK"] = "1"

    call(
        [context.python, "-m", "pip", "install", "-U", "pip>=21.2", "setuptools>=38.0"],
        env=context.env,
    )

    call([context.python, "-m", "pip", "install", "."], env=context.env)
    return context


def after_scenario(context, scenario):  # noqa: ARG001
    for path in _PATHS_TO_REMOVE:
        # ignore errors when attempting to remove already removed directories
        shutil.rmtree(path, ignore_errors=True)


def _create_new_venv() -> Path:
    """Create a new venv.

    Returns:
        path to created venv
    """
    # Create venv
    venv_dir = _create_tmp_dir()
    venv.main([str(venv_dir)])
    return venv_dir


def _create_tmp_dir() -> Path:
    """Create a temp directory and add it to _PATHS_TO_REMOVE"""
    tmp_dir = Path(tempfile.mkdtemp()).resolve()
    _PATHS_TO_REMOVE.add(tmp_dir)
    return tmp_dir
