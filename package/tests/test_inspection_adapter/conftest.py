"""Fixtures for isolating Kedro project state in inspection adapter tests.

Snapshot and config loading bootstrap a Kedro project, which mutates global Kedro state and
``sys.path``. The autouse fixture snapshots that state before each module and restores it
afterwards.
"""

import sys

import kedro.framework.project as kedro_project
import pytest


@pytest.fixture(scope="module", autouse=True)
def _restore_kedro_project_state():
    """Snapshot Kedro's global project state and restore it after the module's tests."""
    package_name = kedro_project.PACKAGE_NAME
    pipelines_state = dict(vars(kedro_project.pipelines))
    settings_state = dict(vars(kedro_project.settings))
    sys_path = list(sys.path)

    yield

    kedro_project.PACKAGE_NAME = package_name
    kedro_project.pipelines.__dict__.clear()
    kedro_project.pipelines.__dict__.update(pipelines_state)
    kedro_project.settings.__dict__.clear()
    kedro_project.settings.__dict__.update(settings_state)
    sys.path[:] = sys_path
