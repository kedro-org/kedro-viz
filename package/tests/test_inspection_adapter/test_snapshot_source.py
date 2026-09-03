"""Tests for the inspection snapshot source.

The ``lite_import_stubs`` and fallback tests run without a real project; the rest run against
the bundled ``demo-project``.
"""

import importlib
import sys
from contextlib import contextmanager
from pathlib import Path
from unittest.mock import PropertyMock

import pytest
from kedro.inspection.models import (
    PipelineSnapshot,
    ProjectMetadataSnapshot,
    ProjectSnapshot,
)
from pydantic import ValidationError

from kedro_viz.integrations.kedro.inspection import snapshot_source
from kedro_viz.integrations.kedro.inspection.errors import PipelineNotFoundError
from kedro_viz.integrations.kedro.inspection.snapshot_source import (
    InspectionProjectData,
    _InspectionSession,
    filter_inspection_project_data,
    load_inspection_project_data,
)

DEMO_PROJECT = Path(__file__).resolve().parents[3] / "demo-project"

# A module name that does not exist, so LiteParser must flag it as unresolved.
_MISSING_MODULE = "totally_missing_pkg_for_lite_stub_test"


def _snapshot(*pipeline_names: str) -> ProjectSnapshot:
    return ProjectSnapshot(
        metadata=ProjectMetadataSnapshot(
            project_name="project",
            package_name="project",
            kedro_version="1.0.0",
        ),
        pipelines=[PipelineSnapshot(name=name, nodes=[]) for name in pipeline_names],
        datasets={},
        parameters=[],
    )


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


def test_session_validates_parameters_against_registered_pipelines(mocker) -> None:
    raw_parameters = {"options": {"count": "3"}}
    validated_parameters = {"options": mocker.sentinel.options}
    registered_pipelines = {"pipeline": mocker.sentinel.pipeline}
    mocker.patch(
        "kedro.framework.project.pipelines",
        registered_pipelines,
    )
    mocker.patch.object(
        _InspectionSession,
        "config_loader",
        new_callable=PropertyMock,
        return_value={"parameters": raw_parameters},
    )
    validate = mocker.patch.object(
        snapshot_source,
        "validate_parameters",
        return_value=validated_parameters,
    )

    result = _InspectionSession(DEMO_PROJECT).parameters()

    assert result is validated_parameters
    validate.assert_called_once_with(raw_parameters, registered_pipelines)


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


# -- prepared project data -- #


def test_project_data_copies_mappings_and_is_frozen() -> None:
    catalog_config = {"companies": {"type": "pandas.CSVDataset"}}
    parameters = {"split": 0.2}

    project_data = InspectionProjectData(
        snapshot=_snapshot("__default__"),
        catalog_config=catalog_config,
        parameters=parameters,
    )
    catalog_config["new"] = {}
    parameters["new"] = True

    assert project_data.catalog_config == {"companies": {"type": "pandas.CSVDataset"}}
    assert project_data.parameters == {"split": 0.2}
    assert project_data.parameter_feed == {
        "parameters": {"split": 0.2},
        "params:split": 0.2,
    }
    with pytest.raises(ValidationError, match="frozen_instance"):
        project_data.parameters = {}  # type: ignore[misc]


def test_load_project_data_reads_every_input_inside_lite_stubs(mocker) -> None:
    events: list[object] = []

    @contextmanager
    def import_stubs(project_path, package_name):
        events.append(("enter", project_path, package_name))
        yield
        events.append(("exit", project_path, package_name))

    session_class = mocker.patch.object(snapshot_source, "_InspectionSession")
    session = session_class.return_value
    snapshot = _snapshot("__default__")

    def read_snapshot():
        events.append("snapshot")
        return snapshot

    def read_catalog():
        events.append("catalog")
        return {"companies": {}}

    def read_parameters():
        events.append("parameters")
        return {"split": 0.2}

    session.snapshot.side_effect = read_snapshot
    session.catalog_config.side_effect = read_catalog
    session.parameters.side_effect = read_parameters
    stubs = mocker.patch.object(
        snapshot_source,
        "lite_import_stubs",
        side_effect=import_stubs,
    )

    result = load_inspection_project_data(
        DEMO_PROJECT,
        env="staging",
        runtime_params={"split": 0.3},
        package_name="spaceflights",
        is_lite=True,
    )

    session_class.assert_called_once_with(
        DEMO_PROJECT,
        env="staging",
        runtime_params={"split": 0.3},
    )
    stubs.assert_called_once_with(DEMO_PROJECT, "spaceflights")
    assert result.snapshot == snapshot
    assert result.catalog_config == {"companies": {}}
    assert result.parameters == {"split": 0.2}
    assert result.parameter_feed == {
        "parameters": {"split": 0.2},
        "params:split": 0.2,
    }
    assert events == [
        ("enter", DEMO_PROJECT, "spaceflights"),
        "snapshot",
        "catalog",
        "parameters",
        ("exit", DEMO_PROJECT, "spaceflights"),
    ]


def test_filter_project_data_preserves_config_and_selects_pipeline() -> None:
    project_data = InspectionProjectData(
        snapshot=_snapshot("__default__", "data_science"),
        catalog_config={"companies": {}},
        parameters={"split": 0.2},
    )

    filtered = filter_inspection_project_data(project_data, "data_science")

    assert [pipeline.name for pipeline in filtered.snapshot.pipelines] == [
        "data_science"
    ]
    assert filtered.catalog_config == project_data.catalog_config
    assert filtered.parameters == project_data.parameters
    assert filtered.parameter_feed == project_data.parameter_feed
    assert [pipeline.name for pipeline in project_data.snapshot.pipelines] == [
        "__default__",
        "data_science",
    ]


def test_filter_project_data_rejects_unknown_pipeline() -> None:
    project_data = InspectionProjectData(snapshot=_snapshot("__default__"))

    with pytest.raises(
        PipelineNotFoundError,
        match=r"Pipeline 'unknown' not found in snapshot; available: \['__default__'\]",
    ):
        filter_inspection_project_data(project_data, "unknown")
