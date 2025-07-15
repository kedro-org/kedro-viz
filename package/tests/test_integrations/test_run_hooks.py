from __future__ import annotations

import sys
from types import ModuleType
from typing import Any, Dict

import pytest
from kedro.io import DataCatalog, MemoryDataset
from kedro.pipeline import Pipeline, node
from kedro.pipeline.node import Node as KedroNode

from kedro_viz.integrations.kedro.run_hooks import (
    PipelineRunStatusHook,
    create_dataset_event,
)


@pytest.fixture()
def hooks() -> PipelineRunStatusHook:
    """Fresh hook instance for each test."""
    return PipelineRunStatusHook()


@pytest.fixture()
def sample_node() -> KedroNode:
    return node(lambda x: x, inputs="in", outputs="out", name="test_node")


class TestCatalogCreation:
    def test_after_catalog_created_with_catalog(self, hooks):
        """Test `after_catalog_created` stores the catalog."""

        class DummyCatalog:
            def __init__(self, datasets: Dict[str, Any]):
                self.datasets = datasets

            def keys(self):
                """Dictionary-like interface for DataCatalog 2.0"""
                return self.datasets.keys()

            def __getitem__(self, key):
                """Dictionary-like interface for DataCatalog 2.0"""
                return self.datasets[key]

        # Create a dummy catalog and pass to the hook
        catalog = DummyCatalog({"memory": object()})
        hooks.after_catalog_created(catalog)

        # Assert datasets were set correctly
        assert hooks._datasets == catalog


class TestPipelineRunLifecycle:
    def test_before_pipeline_run_default(self, hooks, example_pipelines):
        default_pipeline = example_pipelines["__default__"]
        hooks.before_pipeline_run({"pipeline_name": None}, default_pipeline)
        assert hooks._all_nodes == list(default_pipeline.nodes)
        assert hooks._events and hooks._events[0]["event"] == "before_pipeline_run"

    def test_before_pipeline_run_named_pipeline_skips(self, hooks, example_pipelines):
        default_pipeline = example_pipelines["__default__"]
        hooks.before_pipeline_run({"pipeline_name": "demo"}, default_pipeline)
        assert hooks._events == []

    def test_after_pipeline_run_default_flushes(
        self, hooks, example_pipelines, monkeypatch
    ):
        """all_green run should flush events once via `_add_event` with flush=True."""
        default_pipeline = example_pipelines["__default__"]
        hooks.before_pipeline_run({"pipeline_name": None}, default_pipeline)

        flush_called = {"flag": False}

        def fake_add_event(self, event, flush=False):
            if flush:
                flush_called["flag"] = True
            # mimic real behavior so that later assertions work
            self._events.append(event)

        monkeypatch.setattr(PipelineRunStatusHook, "_add_event", fake_add_event)
        hooks.after_pipeline_run({"pipeline_name": None})

        assert hooks._events[-1]["event"] == "after_pipeline_run"
        assert flush_called["flag"] is True

    def test_after_pipeline_run_named_pipeline_skips(self, hooks):
        """Should not emit event for non-default pipelines."""
        hooks.after_pipeline_run({"pipeline_name": "etl"})
        assert hooks._events == []

    def test_before_pipeline_run_non_sequential_runner_skips(
        self, hooks, example_pipelines
    ):
        """Should not emit event for non-sequential runners."""
        default_pipeline = example_pipelines["__default__"]
        hooks.before_pipeline_run({"runner": "ParallelRunner"}, default_pipeline)
        assert hooks._events == []

    def test_after_pipeline_run_non_sequential_runner_skips(self, hooks):
        """Should not emit event for non-sequential runners."""
        hooks.after_pipeline_run({"runner": "ParallelRunner"})
        assert hooks._events == []


class TestDatasetLifecycle:
    def test_dataset_loaded_emits_event(self, hooks, sample_node):
        hooks._all_nodes = [sample_node]

        hooks.before_dataset_loaded("dataset", sample_node)
        hooks.after_dataset_loaded("dataset", {"foo": "bar"})

        assert hooks._events[-1]["event"] == "after_dataset_loaded"

    def test_dataset_saved_emits_event(self, hooks, sample_node):
        hooks._all_nodes = [sample_node]

        hooks.before_dataset_saved("dataset", sample_node)
        hooks.after_dataset_saved("dataset", {"foo": "bar"})

        assert hooks._events[-1]["event"] == "after_dataset_saved"


class TestNodeLifecycle:
    def test_successful_node_run_records_duration_and_status(
        self, hooks, sample_node, monkeypatch
    ):
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

    def test_after_node_run_without_before_records_zero_duration(
        self, hooks, sample_node
    ):
        hooks._all_nodes = [sample_node]
        hooks.after_node_run(sample_node)

        event = hooks._events[-1]
        assert event["event"] == "after_node_run"
        assert event["duration"] == 0.0


class TestErrorHandling:
    def test_on_node_error_emits_event(self, hooks, sample_node):
        hooks._all_nodes = [sample_node]
        exc = RuntimeError("Error occurred")
        hooks.on_node_error(exc, sample_node)
        assert hooks._events[-1]["event"] == "on_node_error"

    def test_pipeline_error_uses_dataset_context_when_available(
        self, hooks, sample_node
    ):
        hooks._all_nodes = [sample_node]
        hooks._current_dataset = "ds"
        hooks._current_operation = "loading"
        hooks._current_node = sample_node

        exc = ValueError("fail")
        hooks.on_pipeline_error(exc)

        event = hooks._events[-1]
        assert event["dataset"] == "ds"
        assert event["operation"] == "loading"
        assert event["node"] == sample_node.name

    def test_pipeline_error_falls_back_to_first_not_started_node(
        self, hooks, sample_node
    ):
        hooks._all_nodes = [sample_node]
        hooks._current_dataset = None
        hooks._current_operation = None
        hooks._current_node = None
        hooks._started_nodes.add(sample_node.name)  # mark sample_node as started

        later_node = node(lambda x: x, "x", "y", name="later")
        hooks._all_nodes.append(later_node)

        exc = ValueError("fail")
        hooks.on_pipeline_error(exc)

        event = hooks._events[-1]
        assert event["node"] == later_node.name
        assert event["status"] == "not_started"


class TestInternalHelpers:
    def test_add_event_skips_when_no_nodes(self, hooks):
        hooks._add_event({"event": "dummy"})
        assert hooks._events == []

    def test_create_dataset_event_includes_size(self, tmp_path):
        fp = tmp_path / "d.txt"
        fp.write_text("abc")

        datasets = {"d": type("Local", (), {"filepath": str(fp)})()}
        evt = create_dataset_event("after_dataset_saved", "d", "value", datasets)

        assert evt["event"] == "after_dataset_saved"
        assert evt["dataset"] == "d"
        assert evt["size"] == 3
