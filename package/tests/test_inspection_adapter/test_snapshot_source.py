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


# -- _merge_runtime_params (hermetic; this is where --params override bugs would surface) -- #


def test_merge_runtime_params_simple() -> None:
    base = {"test_size": 0.2, "random_state": 3}
    assert snapshot_source._merge_runtime_params(base, {"test_size": 0.3}) == {
        "test_size": 0.3,
        "random_state": 3,
    }


def test_merge_runtime_params_nested_preserves_siblings() -> None:
    base = {"split_options": {"test_size": 0.2, "random_state": 3, "target": "price"}}
    merged = snapshot_source._merge_runtime_params(
        base, {"split_options": {"test_size": 0.99}}
    )
    # The override replaces only test_size; random_state/target survive.
    assert merged == {
        "split_options": {"test_size": 0.99, "random_state": 3, "target": "price"}
    }


def test_merge_runtime_params_adds_missing_key() -> None:
    assert snapshot_source._merge_runtime_params({}, {"new": 1}) == {"new": 1}


def test_merge_runtime_params_preserves_types() -> None:
    # runtime_params arrive already parsed; the merge must not stringify or coerce them.
    overrides = {"i": 1, "f": 0.5, "b": True, "lst": [1, 2], "d": {"k": "v"}}
    merged = snapshot_source._merge_runtime_params({}, overrides)
    assert merged == overrides
    assert isinstance(merged["f"], float) and isinstance(merged["b"], bool)


def test_merge_runtime_params_does_not_mutate_base() -> None:
    base = {"a": {"x": 1}}
    snapshot_source._merge_runtime_params(base, {"a": {"y": 2}})
    assert base == {"a": {"x": 1}}  # original untouched


@pytest.fixture(autouse=True)
def _restore_missing_deps_flag():
    """``lite_import_stubs`` flips the global ``Metadata.has_missing_dependencies`` banner when it
    mocks modules; restore it so the flag doesn't leak into other test modules."""
    from kedro_viz.models.metadata import Metadata

    original = Metadata.has_missing_dependencies
    yield
    Metadata.set_has_missing_dependencies(original)


def test_is_inspection_available_returns_bool() -> None:
    assert isinstance(snapshot_source.is_inspection_available(), bool)


def test_lite_import_stubs_mocks_unresolved_imports(tmp_path: Path) -> None:
    """Inside the context a missing project import resolves to a mock; outside it is gone.

    This lets ``get_project_snapshot`` import the project's pipeline modules under ``--lite``
    even when their node-function deps aren't installed.
    """
    (tmp_path / "uses_missing.py").write_text(
        f"import {_MISSING_MODULE}\n", encoding="utf-8"
    )
    assert _MISSING_MODULE not in sys.modules

    with snapshot_source.lite_import_stubs(tmp_path):
        mocked = importlib.import_module(_MISSING_MODULE)
        assert mocked is not None  # a MagicMock stub

    # The patch is scoped to the context — no leakage into the rest of the suite.
    assert _MISSING_MODULE not in sys.modules


def test_lite_import_stubs_is_noop_when_all_imports_resolve(tmp_path: Path) -> None:
    """Nothing to mock when every import is already importable; the context is a clean no-op."""
    (tmp_path / "ok.py").write_text("import os\nimport sys\n", encoding="utf-8")
    before = set(sys.modules)
    with snapshot_source.lite_import_stubs(tmp_path):
        pass
    # No stray mock modules were left registered.
    assert set(sys.modules) - before == set()


@pytest.mark.skipif(
    not snapshot_source.is_inspection_available(),
    reason="kedro inspection API unavailable (requires kedro>=1.4.0)",
)
def test_load_snapshot_returns_demo_pipelines() -> None:
    snapshot = snapshot_source.load_snapshot(DEMO_PROJECT)
    pipeline_names = {pipeline.name for pipeline in snapshot.pipelines}
    assert "__default__" in pipeline_names
