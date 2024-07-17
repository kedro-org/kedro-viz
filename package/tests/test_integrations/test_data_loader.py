import json
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path
from unittest.mock import patch

import pytest

from kedro_viz.integrations.kedro.data_loader import load_data
from kedro_viz.integrations.kedro.lite_parser import get_mocked_modules


@pytest.fixture
def kedro_project_path():
    # Setup a temporary directory
    tmpdir = Path(tempfile.mkdtemp())
    try:
        subprocess.run(
            ["kedro", "new", "--name=spaceflights", "--tools=viz", "--example=y"],
            cwd=tmpdir,
            check=True,
        )
        project_dir = next(tmpdir.glob("*/"), None)
        if project_dir is None:
            raise FileNotFoundError("Kedro project was not created successfully.")
        yield project_dir
    finally:
        shutil.rmtree(tmpdir)


def test_load_data_with_dependencies(kedro_project_path):
    # Install the project's dependencies
    subprocess.run(
        ["pip", "install", "-r", kedro_project_path / "requirements.txt"], check=True
    )

    # Load data with all dependencies installed
    data_catalog, pipelines, session_store, context = load_data(kedro_project_path)

    assert data_catalog is not None
    assert pipelines is not None
    assert session_store is not None
    assert context is not None


# [TODO: WIP, need help]
def test_load_data_without_dependencies(kedro_project_path):
    try:
        # # Create a new conda environment
        # subprocess.run(["conda", "create", "--name", "mytestenv", "python=3.9", "--yes"], check=True)

        # # Activate the conda environment and run subsequent commands within it
        # activate_cmd = ["conda", "activate", "mytestenv"]

        # # Run the combined command in shell
        # subprocess.run(activate_cmd, shell=True, check=True)

        mocked_modules_with_deps = get_mocked_modules(kedro_project_path)
        _, pipelines_dict_with_deps, _, _ = load_data(kedro_project_path, is_lite=False)

        assert mocked_modules_with_deps == {}

        subprocess.run(
            ["pip", "uninstall", "-r", kedro_project_path / "requirements.txt", "-y"],
            check=True,
        )

        # Install necessary dependencies using pip within the conda environment
        subprocess.run(["pip", "install", "../kedro", "./package"], check=True)

        mocked_modules_without_deps = get_mocked_modules(kedro_project_path)
        assert len(mocked_modules_without_deps.keys()) > 0

        _, pipelines_dict_without_deps, _, _ = load_data(
            kedro_project_path, is_lite=True
        )

        assert pipelines_dict_with_deps == pipelines_dict_without_deps

    finally:
        # Deactivate the conda environment
        # deactivate_cmd = ["conda", "deactivate"]
        # subprocess.run(deactivate_cmd, shell=True, check=True)

        # # Delete the conda environment
        # remove_cmd = ["conda", "remove", "--name", "mytestenv", "--all", "--yes"]
        # subprocess.run(remove_cmd, shell=True, check=True)
        subprocess.run(
            ["pip", "install", "-r", kedro_project_path / "requirements.txt"],
            check=True,
        )
