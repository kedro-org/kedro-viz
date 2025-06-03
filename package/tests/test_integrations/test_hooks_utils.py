import json
from datetime import datetime, timezone
from pathlib import Path
from unittest.mock import Mock, patch

import pytest
from kedro.pipeline.node import Node as KedroNode

from kedro_viz.integrations.kedro.hooks_utils import (
    TIME_FORMAT,
    compute_size,
    create_dataset_event,
    generate_timestamp,
    hash_node,
    write_events,
)


@pytest.fixture
def example_kedro_node():
    """Create a simple Kedro node for testing."""
    def dummy_func(x):
        return x
    
    from kedro.pipeline import node
    return node(
        func=dummy_func,
        inputs="input_data",
        outputs="output_data", 
        name="test_node"
    )


@pytest.fixture
def mock_datasets():
    """Mock datasets dictionary with different dataset types."""
    class MockDataset:
        def __init__(self, filepath=None, _filepath=None):
            if filepath:
                self.filepath = filepath
            if _filepath:
                self._filepath = _filepath
    
    return {
        "dataset_with_filepath": MockDataset(filepath="/path/to/file.csv"),
        "dataset_with_private_filepath": MockDataset(_filepath="/private/path/file.csv"),
        "dataset_without_filepath": MockDataset(),
    }


class TestHashNode:
    """Tests for hash_node function."""

    def test_hash_node_with_kedro_node(self, example_kedro_node, mocker):
        """Test hash_node function with KedroNode."""
        mock_hash = mocker.patch(
            "kedro_viz.integrations.kedro.hooks_utils._hash",
            return_value="test_hash"
        )
        
        result = hash_node(example_kedro_node)
        
        assert result == "test_hash"
        mock_hash.assert_called_once_with(str(example_kedro_node))

    def test_hash_node_with_string(self, mocker):
        """Test hash_node function with string input."""
        mock_hash_input_output = mocker.patch(
            "kedro_viz.integrations.kedro.hooks_utils._hash_input_output",
            return_value="test_io_hash"
        )
        
        test_input = "test_dataset"
        result = hash_node(test_input)
        
        assert result == "test_io_hash"
        mock_hash_input_output.assert_called_once_with(test_input)


class TestCreateDatasetEvent:
    """Tests for create_dataset_event function."""

    def test_create_dataset_event_basic(self):
        """Test create_dataset_event function with basic parameters."""
        event_type = "after_dataset_loaded"
        dataset_name = "test_dataset"
        
        result = create_dataset_event(event_type, dataset_name)
        
        expected = {
            "event": event_type,
            "dataset": dataset_name,
            "node_id": hash_node(dataset_name),
            "status": "Available"
        }
        
        assert result == expected

    def test_create_dataset_event_with_size(self, mock_datasets, mocker):
        """Test create_dataset_event function with size calculation."""
        mock_compute_size = mocker.patch(
            "kedro_viz.integrations.kedro.hooks_utils.compute_size",
            return_value=1024
        )
        
        event_type = "after_dataset_saved"
        dataset_name = "test_dataset"
        dataset_value = "test_data"
        
        result = create_dataset_event(event_type, dataset_name, dataset_value, mock_datasets)
        
        expected = {
            "event": event_type,
            "dataset": dataset_name,
            "node_id": hash_node(dataset_name),
            "status": "Available",
            "size_bytes": 1024
        }
        
        assert result == expected
        mock_compute_size.assert_called_once_with(dataset_name, dataset_value, mock_datasets)


class TestComputeSize:
    """Tests for compute_size function."""

    def test_compute_size_no_dataset(self):
        """Test compute_size function when dataset not found."""
        result = compute_size("nonexistent_dataset", "test_data", {})
        assert result is None

    @patch("kedro_viz.integrations.kedro.hooks_utils.fsspec.core.url_to_fs")
    def test_compute_size_with_filepath(self, mock_url_to_fs):
        """Test compute_size function with dataset that has filepath."""
        mock_filesystem = Mock()
        mock_filesystem.exists.return_value = True
        mock_filesystem.size.return_value = 1024
        mock_url_to_fs.return_value = (mock_filesystem, "/path/to/file.csv")
        
        class MockDataset:
            def __init__(self):
                self.filepath = "/path/to/file.csv"
        
        datasets = {"test_dataset": MockDataset()}
        result = compute_size("test_dataset", "test_data", datasets)
        
        assert result == 1024
        mock_filesystem.exists.assert_called_once_with("/path/to/file.csv")
        mock_filesystem.size.assert_called_once_with("/path/to/file.csv")

    @patch("kedro_viz.integrations.kedro.hooks_utils.fsspec.core.url_to_fs")
    def test_compute_size_pandas_dataframe_with_filepath(self, mock_url_to_fs):
        """Test compute_size function with pandas DataFrame and filepath."""
        pytest.importorskip("pandas")
        import pandas as pd
        
        mock_filesystem = Mock()
        mock_filesystem.exists.return_value = True
        mock_filesystem.size.return_value = 3072
        mock_url_to_fs.return_value = (mock_filesystem, "/dataframe.csv")
        
        class MockDataset:
            def __init__(self):
                self.filepath = "/dataframe.csv"
        
        dataset_value = pd.DataFrame({'a': [1, 2, 3]})
        datasets = {"dataframe_dataset": MockDataset()}
        
        result = compute_size("dataframe_dataset", dataset_value, datasets)
        
        assert result == 3072

    @patch("kedro_viz.integrations.kedro.hooks_utils.fsspec.core.url_to_fs")
    def test_compute_size_file_not_exists(self, mock_url_to_fs):
        """Test compute_size function when file doesn't exist."""
        mock_filesystem = Mock()
        mock_filesystem.exists.return_value = False
        mock_url_to_fs.return_value = (mock_filesystem, "/nonexistent.csv")
        
        class MockDataset:
            def __init__(self):
                self.filepath = "/nonexistent.csv"
        
        datasets = {"test_dataset": MockDataset()}
        result = compute_size("test_dataset", "test_data", datasets)
        
        assert result is None


class TestWriteEvents:
    """Tests for write_events function."""

    def test_write_events_success(self, setup_kedro_project, mocker):
        """Test write_events function successfully writes events."""
        mock_find_kedro_project = mocker.patch(
            "kedro_viz.integrations.kedro.hooks_utils._find_kedro_project",
            return_value=setup_kedro_project
        )
        
        test_events = [
            {"event": "test_event_1", "timestamp": "2021-01-01T00:00:00.000Z"},
            {"event": "test_event_2", "timestamp": "2021-01-01T00:01:00.000Z"}
        ]
        
        write_events(test_events)
        
        # Check if events file is created
        expected_events_file_path = setup_kedro_project / ".viz/kedro_pipeline_events.json"
        assert expected_events_file_path.exists()
        
        # Verify the contents of the events file
        with expected_events_file_path.open("r", encoding="utf8") as file:
            data = json.load(file)
        
        assert data == test_events
        mock_find_kedro_project.assert_called_once()

    def test_write_events_no_kedro_project(self, mocker, caplog):
        """Test write_events function when no Kedro project is found."""
        mock_find_kedro_project = mocker.patch(
            "kedro_viz.integrations.kedro.hooks_utils._find_kedro_project",
            return_value=None
        )
        
        test_events = [{"event": "test_event"}]
        
        write_events(test_events)
        
        assert "No Kedro project found; skipping write." in caplog.text
        mock_find_kedro_project.assert_called_once()


class TestGenerateTimestamp:
    """Tests for generate_timestamp function."""

    def test_generate_timestamp_format(self):
        """Test generate_timestamp function returns correctly formatted timestamp."""
        result = generate_timestamp()
        
        # Verify the timestamp format
        assert isinstance(result, str)
        # Check if it matches the expected format
        try:
            parsed_time = datetime.strptime(result, TIME_FORMAT)
            assert parsed_time is not None
        except ValueError:
            pytest.fail(f"Generated timestamp '{result}' does not match expected format '{TIME_FORMAT}'")
