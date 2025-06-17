from __future__ import annotations

import sys
from types import ModuleType
from typing import Any, Dict

import pytest
from kedro.io import DataCatalog, MemoryDataset
from kedro.pipeline import Pipeline, node
from kedro.pipeline.node import Node as KedroNode

from kedro_viz.integrations.kedro.run_hooks import PipelineRunStatusHook


# -----------------------------------------------------------------------------
# Fixtures
# -----------------------------------------------------------------------------
@pytest.fixture()
def hooks() -> PipelineRunStatusHook:
    """Fresh hook instance for each test."""
    return PipelineRunStatusHook()


@pytest.fixture()
def sample_node() -> KedroNode:
    return node(lambda x: x, inputs="in", outputs="out", name="test_node")


@pytest.fixture()
def sample_pipeline(sample_node) -> Pipeline:
    return Pipeline([sample_node])


@pytest.fixture()
def sample_catalog() -> DataCatalog:
    """Minimal DataCatalog with a single in-memory dataset."""
    return DataCatalog({"memory": MemoryDataset()})


# -----------------------------------------------------------------------------
# after_catalog_created
# -----------------------------------------------------------------------------
# Remove below test once we release Kedro 1.0.0
def test_after_catalog_created_standard(hooks, sample_catalog):
    hooks.after_catalog_created(sample_catalog)
    assert hooks._datasets == sample_catalog._datasets


# Remove below test once we release Kedro 1.0.0
def test_after_catalog_created_import_error(hooks, sample_catalog, monkeypatch):
    """Branch where `kedro.io` exists but lacks KedroDataCatalog."""
    monkeypatch.setitem(sys.modules, "kedro.io", ModuleType("kedro.io"))
    hooks.after_catalog_created(sample_catalog)
    assert hooks._datasets == sample_catalog._datasets


def test_after_catalog_created_with_kedro_data_catalog(
    hooks, monkeypatch: pytest.MonkeyPatch
):
    """Branch where a KedroDataCatalog instance is supplied."""

    class DummyKedroDataCatalog:
        def __init__(self, datasets: Dict[str, Any]):
            self.datasets = datasets

    fake_kedro_io = ModuleType("kedro.io")
    fake_kedro_io.KedroDataCatalog = DummyKedroDataCatalog  # type: ignore[attr-defined]
    monkeypatch.setitem(sys.modules, "kedro.io", fake_kedro_io)

    kedro_catalog = DummyKedroDataCatalog({"memory": object()})
    hooks.after_catalog_created(kedro_catalog)
    assert hooks._datasets == kedro_catalog.datasets


# -----------------------------------------------------------------------------
# Pipeline-level hooks
# -----------------------------------------------------------------------------
def test_before_pipeline_run_default(hooks, sample_pipeline):
    hooks.before_pipeline_run({"pipeline_name": None}, sample_pipeline)
    assert hooks._all_nodes == list(sample_pipeline.nodes)
    assert hooks._events and hooks._events[0]["event"] == "before_pipeline_run"


def test_before_pipeline_run_named_pipeline_skips(hooks, sample_pipeline):
    hooks.before_pipeline_run({"pipeline_name": "demo"}, sample_pipeline)
    assert hooks._events == []


def test_after_pipeline_run_default_flushes(hooks, sample_pipeline, monkeypatch):
    """all_green run should flush events once via `_write_events`."""
    hooks.before_pipeline_run({"pipeline_name": None}, sample_pipeline)

    flush_called = {"flag": False}

    def fake_write_events(self):
        flush_called["flag"] = True

    monkeypatch.setattr(PipelineRunStatusHook, "_write_events", fake_write_events)
    hooks.after_pipeline_run({"pipeline_name": None})

    assert hooks._events[-1]["event"] == "after_pipeline_run"
    assert flush_called["flag"] is True


def test_after_pipeline_run_named_pipeline_skips(hooks):
    hooks.after_pipeline_run({"pipeline_name": "etl"})
    assert hooks._events == []


# -----------------------------------------------------------------------------
# Dataset I/O workflow
# -----------------------------------------------------------------------------
def test_dataset_loading_and_saving_workflow(hooks, sample_node):
    hooks._all_nodes = [sample_node]

    # Loading branch
    hooks.before_dataset_loaded("dataset", sample_node)
    hooks.after_dataset_loaded("dataset", {"foo": "bar"})
    assert hooks._events[-1]["event"].startswith("after_dataset_loaded")

    # Saving branch
    hooks.before_dataset_saved("dataset", sample_node)
    hooks.after_dataset_saved("dataset", {"foo": "bar"})
    assert hooks._events[-1]["event"].startswith("after_dataset_saved")


# -----------------------------------------------------------------------------
# Node-level workflow
# -----------------------------------------------------------------------------
def test_node_execution_workflow(hooks, sample_node, monkeypatch):
    hooks._all_nodes = [sample_node]

    # Fake perf_counter so duration == 1.23
    counter_vals = iter([1.0, 2.23])
    monkeypatch.setattr(
        "kedro_viz.integrations.kedro.run_hooks.perf_counter",
        lambda: next(counter_vals),
    )

    hooks.before_node_run(sample_node)
    hooks.after_node_run(sample_node)

    event = hooks._events[-1]
    assert event["event"] == "after_node_run"
    assert pytest.approx(event["duration"], abs=1e-6) == 1.23
    assert event["status"] == "success"


def test_after_node_run_without_before_records_zero_duration(hooks, sample_node):
    hooks._all_nodes = [sample_node]
    hooks.after_node_run(sample_node)
    assert hooks._events[-1]["duration"] == 0.0


# -----------------------------------------------------------------------------
# Error handling
# -----------------------------------------------------------------------------
def test_on_node_error(hooks, sample_node):
    hooks._all_nodes = [sample_node]
    exc = RuntimeError("Error occurred")
    hooks.on_node_error(exc, sample_node)
    assert hooks._events[-1]["event"] == "on_node_error"


def test_on_pipeline_error_with_and_without_context(hooks, sample_node):
    # -- dataset_error context present ------------------------------------
    hooks._all_nodes = [sample_node]
    hooks._current_dataset = "ds"
    hooks._current_operation = "loading"
    hooks._current_node = sample_node

    exc = ValueError("fail")
    hooks.on_pipeline_error(exc)

    event_ctx = hooks._events[-1]
    assert event_ctx["dataset"] == "ds"
    assert event_ctx["operation"] == "loading"
    assert event_ctx["node"] == sample_node.name

    # -- node_error fallback ----------------------------------------------
    hooks._events.clear()
    hooks._current_dataset = None
    hooks._current_operation = None
    hooks._current_node = None
    hooks._started_nodes.add(sample_node.name)  # first node marked started

    later_node = node(lambda x: x, "x", "y", name="later")
    hooks._all_nodes.append(later_node)

    hooks.on_pipeline_error(exc)
    event_fb = hooks._events[-1]
    assert event_fb["node"] == later_node.name
    assert event_fb["status"] == "not_started"


# -----------------------------------------------------------------------------
# Internal helpers
# -----------------------------------------------------------------------------
def test_add_event_skips_when_no_nodes(hooks):
    hooks._add_event({"event": "dummy"})
    assert hooks._events == []
