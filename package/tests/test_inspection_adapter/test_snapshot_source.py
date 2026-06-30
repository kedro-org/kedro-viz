"""Tests for the inspection snapshot source.

The load test requires the inspection API (``kedro>=1.4.0``) and is skipped otherwise.
The ``lite_import_stubs`` tests are hermetic (no inspection API, no real project).
"""

import importlib
import sys
from pathlib import Path

import pytest

from kedro_viz.integrations.kedro.inspection import snapshot_source

DEMO_PROJECT = Path(__file__).resolve().parents[3] / "demo-project"

# A module name that does not exist, so LiteParser must flag it as unresolved.
_MISSING_MODULE = "totally_missing_pkg_for_lite_stub_test"


# -- Runtime parameter merging -- #


def test_merge_runtime_params_simple() -> None:
    """Test that a flat override replaces its key and leaves siblings untouched."""
    base = {"test_size": 0.2, "random_state": 3}
    assert snapshot_source._merge_runtime_params(base, {"test_size": 0.3}) == {
        "test_size": 0.3,
        "random_state": 3,
    }


def test_merge_runtime_params_nested_preserves_siblings() -> None:
    """Test that a nested override replaces only the targeted key, preserving siblings."""
    base = {"split_options": {"test_size": 0.2, "random_state": 3, "target": "price"}}
    merged = snapshot_source._merge_runtime_params(
        base, {"split_options": {"test_size": 0.99}}
    )
    assert merged == {
        "split_options": {"test_size": 0.99, "random_state": 3, "target": "price"}
    }


def test_merge_runtime_params_adds_missing_key() -> None:
    """Test that an override key absent from the base is added."""
    assert snapshot_source._merge_runtime_params({}, {"new": 1}) == {"new": 1}


def test_merge_runtime_params_preserves_types() -> None:
    """Test that merged values keep their original types (no stringifying or coercion)."""
    overrides = {"i": 1, "f": 0.5, "b": True, "lst": [1, 2], "d": {"k": "v"}}
    merged = snapshot_source._merge_runtime_params({}, overrides)
    assert merged == overrides
    assert isinstance(merged["f"], float) and isinstance(merged["b"], bool)


def test_merge_runtime_params_does_not_mutate_base() -> None:
    """Test that the base dict is not mutated by the merge."""
    base = {"a": {"x": 1}}
    snapshot_source._merge_runtime_params(base, {"a": {"y": 2}})
    assert base == {"a": {"x": 1}}


@pytest.fixture(autouse=True)
def _restore_missing_deps_flag():
    """Restore the global ``Metadata.has_missing_dependencies`` banner after each test."""
    from kedro_viz.models.metadata import Metadata

    original = Metadata.has_missing_dependencies
    yield
    Metadata.set_has_missing_dependencies(original)


def test_is_inspection_available_returns_bool() -> None:
    """Test that ``is_inspection_available`` returns a bool."""
    assert isinstance(snapshot_source.is_inspection_available(), bool)


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


@pytest.mark.skipif(
    not snapshot_source.is_inspection_available(),
    reason="kedro inspection API unavailable (requires kedro>=1.4.0)",
)
def test_load_snapshot_returns_demo_pipelines() -> None:
    """Test that loading the demo project's snapshot yields the ``__default__`` pipeline."""
    snapshot = snapshot_source.load_snapshot(DEMO_PROJECT)
    pipeline_names = {pipeline.name for pipeline in snapshot.pipelines}
    assert "__default__" in pipeline_names


@pytest.mark.skipif(
    not snapshot_source.is_inspection_available(),
    reason="kedro inspection API unavailable (requires kedro>=1.4.0)",
)
def test_snapshot_exposes_fields_kedro_viz_needs() -> None:
    """Test that the demo snapshot exposes every field kedro-viz reads (a contract guard)."""
    snapshot = snapshot_source.load_snapshot(DEMO_PROJECT)

    assert snapshot.pipelines, "expected at least one pipeline"
    for pipeline in snapshot.pipelines:
        assert isinstance(pipeline.name, str)
        for node in pipeline.nodes:
            assert isinstance(node.name, str)
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
