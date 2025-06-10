import json
from pathlib import Path
from time import perf_counter
from unittest.mock import Mock

import pytest
from kedro.io import DataCatalog, MemoryDataset
from kedro.pipeline import Pipeline, node
from kedro.pipeline.node import Node as KedroNode

from kedro_viz.integrations.kedro.run_hooks import PipelineRunStatusHook


@pytest.fixture
def hooks():
    """Create an instance of PipelineRunStatusHook."""
    return PipelineRunStatusHook()


@pytest.fixture
def mock_generate_timestamp(mocker):
    """Mock generate_timestamp function with consistent return value."""
    return mocker.patch(
        "kedro_viz.integrations.kedro.run_hooks.generate_timestamp",
        return_value="2021-01-01T00:00:00.000Z",
    )


@pytest.fixture
def mock_hash_node_run_hooks(mocker):
    """Mock hash_node function for run_hooks module with consistent return value."""
    return mocker.patch(
        "kedro_viz.integrations.kedro.run_hooks.hash_node",
        return_value="test_node_hash",
    )


@pytest.fixture
def mock_create_dataset_event(mocker):
    """Mock create_dataset_event function."""
    return mocker.patch(
        "kedro_viz.integrations.kedro.run_hooks.create_dataset_event",
        return_value={"event": "mocked_dataset_event", "dataset": "test_dataset"},
    )


@pytest.fixture
def mock_write_events(mocker):
    """Mock _write_events method."""
    return mocker.patch.object(PipelineRunStatusHook, "_write_events")


def test_after_catalog_created_standard(hooks, sample_catalog):
    """Test after_catalog_created hook with standard DataCatalog."""
    hooks.after_catalog_created(sample_catalog)
    assert hooks._datasets == sample_catalog._datasets


def test_after_catalog_created_import_error(hooks, mocker):
    """Test after_catalog_created hook when KedroDataCatalog import fails (covers lines 65-66)."""
    # Create a mock catalog with _datasets attribute
    mock_catalog = Mock()
    mock_catalog._datasets = {"fallback_dataset": "fallback_data"}

    # Store the original import function
    original_import = __import__

    # Mock the local import within the function to raise ImportError
    def mock_import_side_effect(name, globals=None, locals=None, fromlist=(), level=0):
        if name == "kedro.io" and "KedroDataCatalog" in fromlist:
            raise ImportError("No module named 'kedro.io'")
        # For any other imports, use the original import
        return original_import(name, globals, locals, fromlist, level)

    mocker.patch("builtins.__import__", side_effect=mock_import_side_effect)
    hooks.after_catalog_created(mock_catalog)

    # Should fall back to _datasets attribute
    assert hooks._datasets == {"fallback_dataset": "fallback_data"}


def test_after_catalog_created_kedro_data_catalog(hooks, mocker):
    """Test after_catalog_created hook with KedroDataCatalog to cover lines 62-64."""

    # Create a real class to simulate KedroDataCatalog
    class MockKedroDataCatalog:
        """Mock class to simulate KedroDataCatalog behavior."""

        pass

    # Create a catalog instance that inherits from our mock class
    class TestCatalog(MockKedroDataCatalog):
        def __init__(self):
            self.datasets = {"kedro_dataset": "kedro_data"}

    catalog = TestCatalog()

    # Patch the import to use our mock class
    import sys
    from unittest.mock import patch

    mock_module = Mock()
    mock_module.KedroDataCatalog = MockKedroDataCatalog

    with patch.dict(sys.modules, {"kedro.io": mock_module}):
        # Now call the method - isinstance should work naturally
        hooks.after_catalog_created(catalog)

    # Verify the KedroDataCatalog path was taken
    assert hooks._datasets == {"kedro_dataset": "kedro_data"}


def test_before_pipeline_run_default(hooks, sample_pipeline, mock_generate_timestamp):
    """Test before_pipeline_run hook with default pipeline."""
    hooks.before_pipeline_run({"pipeline_name": None}, sample_pipeline)

    assert len(hooks._all_nodes) == 1
    assert len(hooks._started_nodes) == 0
    assert len(hooks._events) == 1

    event = hooks._events[0]
    assert event["event"] == "before_pipeline_run"
    assert event["timestamp"] == "2021-01-01T00:00:00.000Z"

    mock_generate_timestamp.assert_called_once()


def test_before_pipeline_run_named_pipeline_skips(hooks, sample_pipeline):
    """Test before_pipeline_run hook skips named pipelines."""
    hooks.before_pipeline_run({"pipeline_name": "test_pipeline"}, sample_pipeline)

    # Should not add events or nodes for named pipelines
    assert len(hooks._events) == 0
    assert len(hooks._all_nodes) == 0


def test_dataset_loading_workflow(hooks, sample_node, mock_create_dataset_event):
    """Test complete dataset loading workflow."""
    # Set up pipeline nodes so events can be added
    hooks._all_nodes = [sample_node]

    # Test before_dataset_loaded
    hooks.before_dataset_loaded("test_dataset", sample_node)
    assert hooks._current_dataset == "test_dataset"
    assert hooks._current_operation == "loading"
    assert hooks._current_node == sample_node

    # Test after_dataset_loaded
    test_data = {"key": "value"}
    hooks.after_dataset_loaded("test_dataset", test_data)

    assert len(hooks._events) == 1
    assert hooks._events[0]["event"] == "mocked_dataset_event"
    assert hooks._current_dataset is None
    assert hooks._current_operation is None

    mock_create_dataset_event.assert_called_once_with(
        "after_dataset_loaded", "test_dataset", test_data, hooks._datasets
    )


def test_dataset_saving_workflow(hooks, sample_node, mock_create_dataset_event):
    """Test complete dataset saving workflow."""
    # Set up pipeline nodes so events can be added
    hooks._all_nodes = [sample_node]

    # Test before_dataset_saved
    hooks.before_dataset_saved("test_dataset", sample_node)
    assert hooks._current_dataset == "test_dataset"
    assert hooks._current_operation == "saving"
    assert hooks._current_node == sample_node

    # Test after_dataset_saved
    test_data = {"key": "value"}
    hooks.after_dataset_saved("test_dataset", test_data)

    assert len(hooks._events) == 1
    assert hooks._events[0]["event"] == "mocked_dataset_event"
    assert hooks._current_dataset is None
    assert hooks._current_operation is None


def test_node_execution_workflow(hooks, sample_node, mock_hash_node_run_hooks):
    """Test complete node execution workflow."""
    # Set up pipeline nodes so events can be added
    hooks._all_nodes = [sample_node]

    # Test before_node_run
    hooks.before_node_run(sample_node)
    assert sample_node.name in hooks._node_start
    assert hooks._current_node == sample_node
    assert sample_node.name in hooks._started_nodes
    assert isinstance(hooks._node_start[sample_node.name], float)

    # Test after_node_run
    hooks.after_node_run(sample_node)

    assert len(hooks._events) == 1
    event = hooks._events[0]
    assert event["event"] == "after_node_run"
    assert event["node"] == sample_node.name
    assert event["node_id"] == "test_node_hash"
    assert event["status"] == "success"
    assert "duration_sec" in event
    assert isinstance(event["duration_sec"], float)
    assert hooks._current_node is None


def test_after_pipeline_run_default(
    hooks, sample_node, mock_generate_timestamp, mock_write_events
):
    """Test after_pipeline_run hook with default pipeline."""
    # Set up pipeline nodes so events can be added
    hooks._all_nodes = [sample_node]

    hooks.after_pipeline_run({"pipeline_name": None})

    assert len(hooks._events) == 1
    event = hooks._events[0]
    assert event["event"] == "after_pipeline_run"
    assert event["timestamp"] == "2021-01-01T00:00:00.000Z"

    mock_write_events.assert_called_once()


def test_after_pipeline_run_named_pipeline_skips(hooks):
    """Test after_pipeline_run hook skips named pipelines."""
    hooks.after_pipeline_run({"pipeline_name": "test_pipeline"})
    assert len(hooks._events) == 0


def test_on_node_error(
    hooks,
    sample_node,
    mock_hash_node_run_hooks,
    mock_generate_timestamp,
    mock_write_events,
):
    """Test on_node_error hook."""
    # Set up pipeline nodes so events can be added
    hooks._all_nodes = [sample_node]

    error = ValueError("Test error")
    hooks.on_node_error(error, sample_node)

    assert len(hooks._events) == 1
    event = hooks._events[0]
    assert event["event"] == "on_node_error"
    assert event["node"] == sample_node.name
    assert event["node_id"] == "test_node_hash"
    assert event["error"] == "Test error"
    assert event["timestamp"] == "2021-01-01T00:00:00.000Z"

    mock_write_events.assert_called_once()


def test_on_pipeline_error_with_context(
    hooks,
    sample_node,
    mock_hash_node_run_hooks,
    mock_generate_timestamp,
    mock_write_events,
):
    """Test on_pipeline_error hook with dataset and node context."""
    # Set up pipeline nodes so events can be added
    hooks._all_nodes = [sample_node]

    # Set up context
    hooks._current_dataset = "test_dataset"
    hooks._current_operation = "loading"
    hooks._current_node = sample_node

    error = ValueError("Test pipeline error")
    hooks.on_pipeline_error(error)

    assert len(hooks._events) == 1
    event = hooks._events[0]
    assert event["event"] == "on_pipeline_error"
    assert event["error"] == "Test pipeline error"
    assert event["dataset"] == "test_dataset"
    assert event["operation"] == "loading"
    assert event["node"] == sample_node.name
    assert event["node_id"] == "test_node_hash"


def test_on_pipeline_error_with_unstarted_node(
    hooks,
    sample_node,
    mock_hash_node_run_hooks,
    mock_generate_timestamp,
    mock_write_events,
):
    """Test on_pipeline_error hook identifies unstarted nodes."""
    # Set up all nodes but no started nodes
    hooks._all_nodes = [sample_node]
    hooks._started_nodes = set()

    error = ValueError("Test pipeline error")
    hooks.on_pipeline_error(error)

    event = hooks._events[0]
    assert event["node"] == sample_node.name
    assert event["node_id"] == "test_node_hash"
    assert event["status"] == "not_started"


def test_write_events_no_project(hooks, mocker, caplog):
    """Test _write_events method when no Kedro project is found."""
    mock_find_kedro_project = mocker.patch(
        "kedro_viz.integrations.kedro.hooks_utils._find_kedro_project",
        return_value=None,
    )

    hooks._events = [{"event": "test_event"}]
    hooks._write_events()

    assert "No Kedro project found; skipping write." in caplog.text
    mock_find_kedro_project.assert_called_once()


def test_add_event_skips_when_no_nodes(hooks):
    """ensure _add_event returns early when no nodes are present."""
    assert hooks._all_nodes == []
    hooks._add_event({"event": "dummy"})
    assert hooks._events == []


def test_after_node_run_without_before(hooks, sample_node, mock_hash_node_run_hooks):
    """call after_node_run **without** a preceding before_node_run so
    `start` resolves to None and duration becomes 0.0.
    """
    # Populate _all_nodes so _add_event won't bail out.
    hooks._all_nodes = [sample_node]

    hooks.after_node_run(sample_node)

    assert len(hooks._events) == 1
    event = hooks._events[0]
    assert event["event"] == "after_node_run"
    assert event["duration_sec"] == 0.0
    assert event["node_id"] == "test_node_hash"
