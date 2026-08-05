"""Tests for the inspection snapshot source.

The ``lite_import_stubs`` and fallback tests are hermetic (no real project); the rest run against
the bundled ``demo-project``.
"""

import importlib
import sys
from pathlib import Path
from unittest.mock import PropertyMock

import pytest

from kedro_viz.integrations.kedro.inspection import snapshot_source
from kedro_viz.integrations.kedro.inspection.snapshot_source import _InspectionSession

DEMO_PROJECT = Path(__file__).resolve().parents[3] / "demo-project"

# A module name that does not exist, so LiteParser must flag it as unresolved.
_MISSING_MODULE = "totally_missing_pkg_for_lite_stub_test"


@pytest.fixture(autouse=True)
def _restore_missing_deps_flag():
    """Restore the global ``Metadata.has_missing_dependencies`` banner after each test."""
    from kedro_viz.models.metadata import Metadata

    original = Metadata.has_missing_dependencies
    yield
    Metadata.set_has_missing_dependencies(original)


def test_lite_import_stubs_mocks_unresolved_imports(tmp_path: Path) -> None:
    """Test that a missing project import resolves to a mock inside the context and is gone outside."""
    (tmp_path / "uses_missing.py").write_text(
        f"import {_MISSING_MODULE}\n", encoding="utf-8"
    )
    assert _MISSING_MODULE not in sys.modules

    with snapshot_source.lite_import_stubs(tmp_path):
        mocked = importlib.import_module(_MISSING_MODULE)
        assert mocked is not None

    assert _MISSING_MODULE not in sys.modules


def test_lite_import_stubs_is_noop_when_all_imports_resolve(tmp_path: Path) -> None:
    """Test that the context is a clean no-op when every import is already importable."""
    (tmp_path / "ok.py").write_text("import os\nimport sys\n", encoding="utf-8")
    before = set(sys.modules)
    with snapshot_source.lite_import_stubs(tmp_path):
        pass
    assert set(sys.modules) - before == set()


# -- _InspectionSession -- #


def test_session_snapshot_returns_demo_pipelines() -> None:
    """Test that the session's snapshot yields the ``__default__`` pipeline."""
    snapshot = _InspectionSession(DEMO_PROJECT).snapshot()
    pipeline_names = {pipeline.name for pipeline in snapshot.pipelines}
    assert "__default__" in pipeline_names


def test_session_snapshot_exposes_fields_kedro_viz_needs() -> None:
    """Test that the demo snapshot exposes every field kedro-viz reads (a contract guard)."""
    snapshot = _InspectionSession(DEMO_PROJECT).snapshot()

    assert snapshot.pipelines, "expected at least one pipeline"
    for pipeline in snapshot.pipelines:
        assert isinstance(pipeline.name, str)
        for node in pipeline.nodes:
            assert isinstance(node.name, str)
            assert isinstance(node.func_name, str)
            assert isinstance(node.inputs, list)
            assert isinstance(node.outputs, list)
            assert isinstance(node.tags, list)
            assert node.namespace is None or isinstance(node.namespace, str)

    assert isinstance(snapshot.datasets, dict)
    for dataset in snapshot.datasets.values():
        assert isinstance(dataset.name, str)
        assert isinstance(dataset.type, str)
        assert dataset.filepath is None or isinstance(dataset.filepath, str)

    # parameters are stored as key names only (no values)
    assert isinstance(snapshot.parameters, list)
    assert all(isinstance(name, str) for name in snapshot.parameters)


def test_session_catalog_config_reads_the_demo_catalog() -> None:
    """Test that the catalog config is read from the project (no DataCatalog instantiated)."""
    catalog = _InspectionSession(DEMO_PROJECT).catalog_config()
    assert "companies" in catalog
    assert "model_input_table" in catalog


def test_session_parameters_reads_the_demo_parameters() -> None:
    """Test that resolved parameter values are read from the project config."""
    params = _InspectionSession(DEMO_PROJECT).parameters()
    assert "split_options" in params
    assert "train_evaluation" in params


def test_session_parameters_applies_runtime_overrides() -> None:
    """Test that ``--params`` overrides are merged onto the loaded parameter values."""
    params = _InspectionSession(
        DEMO_PROJECT, runtime_params={"split_options": {"test_size": 0.99}}
    ).parameters()
    assert params["split_options"]["test_size"] == 0.99


def test_session_builds_the_config_loader_once() -> None:
    """Test that the loader is built once and reused across catalog and parameters."""
    session = _InspectionSession(DEMO_PROJECT)
    loader = session.config_loader
    session.catalog_config()
    session.parameters()
    assert session.config_loader is loader


@pytest.mark.parametrize("section", ["catalog_config", "parameters"])
def test_session_returns_empty_when_section_missing(mocker, section) -> None:
    """Test that catalog_config and parameters fall back to {} when their section is absent."""
    mocker.patch.object(
        _InspectionSession,
        "config_loader",
        new_callable=PropertyMock,
        return_value={},
    )
    assert getattr(_InspectionSession(DEMO_PROJECT), section)() == {}
