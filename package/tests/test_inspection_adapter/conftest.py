"""Test isolation for the inspection adapter suite.

Loading a snapshot or catalog config bootstraps the demo Kedro project, which mutates *process-global*
Kedro state (``kedro.framework.project.PACKAGE_NAME`` and the ``pipelines``/``settings`` singletons,
plus ``sys.path``). Left unrestored, that leaks into later tests in the same session (e.g. CLI tests
that assert ``package_name=None``). This autouse fixture snapshots that state before each test module
and restores it afterwards.
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
