import json
from datetime import datetime, timezone
from pathlib import Path
from unittest.mock import patch
from tempfile import TemporaryDirectory

from kedro.pipeline.node import Node as KedroNode

from kedro_viz.integrations.kedro.hooks_utils import (
    TIME_FORMAT,
    extract_file_paths,
    get_file_size,
    write_events_to_file,
    hash_node,
    create_dataset_event,
    compute_size,
    generate_timestamp,
    is_default_run,
)


class TestPureFunctions:
    """Test pure utility functions that don't need mocking."""

    def test_hash_node_with_kedro_node(self):
        """Test hash_node function with KedroNode - no mocking needed."""
        def dummy_func(x):
            return x

        from kedro.pipeline import node
        kedro_node = node(
            func=dummy_func, inputs="input_data", outputs="output_data", name="test_node"
        )

        result = hash_node(kedro_node)
        
        # Should return a consistent hash
        assert isinstance(result, str)
        assert len(result) > 0
        # Should be deterministic
        assert result == hash_node(kedro_node)

    def test_hash_node_with_string(self):
        """Test hash_node function with string input - no mocking needed."""
        test_input = "test_dataset"
        result = hash_node(test_input)
        
        assert isinstance(result, str)
        assert len(result) > 0
        # Should be deterministic
        assert result == hash_node(test_input)

    def test_extract_file_paths(self):
        """Test extract_file_paths function - no mocking needed."""
        class MockDataset:
            def __init__(self, filepath=None, _filepath=None):
                if filepath:
                    self.filepath = filepath
                if _filepath:
                    self._filepath = _filepath

        # Test with filepath
        dataset_with_filepath = MockDataset(filepath="/path/to/file.csv")
        paths = extract_file_paths(dataset_with_filepath)
        assert paths == ["/path/to/file.csv"]

        # Test with _filepath
        dataset_with_private_filepath = MockDataset(_filepath="/private/path/file.csv")
        paths = extract_file_paths(dataset_with_private_filepath)
        assert paths == ["/private/path/file.csv"]

        # Test with both
        dataset_with_both = MockDataset(filepath="/path1.csv", _filepath="/path2.csv")
        paths = extract_file_paths(dataset_with_both)
        assert paths == ["/path1.csv", "/path2.csv"]

        # Test with neither
        dataset_without_filepath = MockDataset()
        paths = extract_file_paths(dataset_without_filepath)
        assert paths == []

    def test_generate_timestamp_format(self):
        """Test generate_timestamp function - no mocking needed."""
        result = generate_timestamp()

        # Verify the timestamp format
        assert isinstance(result, str)
        # Check if it matches the expected format
        parsed_time = datetime.strptime(result, TIME_FORMAT)
        assert parsed_time is not None
        
        # Should be recent (within last minute)
        now = datetime.now(tz=timezone.utc)
        parsed_time_utc = parsed_time.replace(tzinfo=timezone.utc)
        time_diff = abs((now - parsed_time_utc).total_seconds())
        assert time_diff < 60  # Within 1 minute


class TestCreateDatasetEvent:
    """Test create_dataset_event with minimal mocking."""

    def test_create_dataset_event_basic(self):
        """Test create_dataset_event function with basic parameters - no mocking needed."""
        event_type = "after_dataset_loaded"
        dataset_name = "test_dataset"

        result = create_dataset_event(event_type, dataset_name)

        expected = {
            "event": event_type,
            "dataset": dataset_name,
            "node_id": hash_node(dataset_name),  # We know this works from previous tests
            "status": "Available",
        }

        assert result == expected

    def test_create_dataset_event_with_datasets_but_no_size(self):
        """Test when datasets provided but no size computed."""
        class MockDataset:
            pass  # No filepath attributes

        datasets = {"test_dataset": MockDataset()}
        
        result = create_dataset_event(
            "after_dataset_saved", "test_dataset", "some_data", datasets
        )
        
        # Should not include size_bytes since no filepath available
        assert "size_bytes" not in result
        assert result["event"] == "after_dataset_saved"


class TestComputeSize:
    """Test compute_size function with minimal, focused mocking."""

    def test_compute_size_no_dataset(self):
        """Test compute_size function when dataset not found - no mocking needed."""
        result = compute_size("nonexistent_dataset", "test_data", {})
        assert result is None

    def test_compute_size_no_filepath(self):
        """Test compute_size when dataset has no filepath - no mocking needed."""
        class MockDataset:
            pass  # No filepath attributes

        datasets = {"test_dataset": MockDataset()}
        result = compute_size("test_dataset", "test_data", datasets)
        assert result is None

    @patch("kedro_viz.integrations.kedro.hooks_utils.get_file_size")
    def test_compute_size_with_filepath(self, mock_get_file_size):
        """Test compute_size function with dataset that has filepath - minimal mocking."""
        mock_get_file_size.return_value = 1024

        class MockDataset:
            def __init__(self):
                self.filepath = "/path/to/file.csv"

        datasets = {"test_dataset": MockDataset()}
        result = compute_size("test_dataset", "test_data", datasets)

        assert result == 1024
        mock_get_file_size.assert_called_once_with("/path/to/file.csv")


class TestFileOperations:
    """Test file operations with real files (no mocking)."""

    def test_write_events_to_file_integration(self):
        """Test write_events_to_file with real filesystem operations."""
        test_events_json = '[\n  {\n    "event": "test_event"\n  }\n]'
        
        with TemporaryDirectory() as temp_dir:
            project_path = Path(temp_dir)
            events_dir = ".viz"
            events_file = "test_events.json"
            
            # This should work without mocking
            write_events_to_file(project_path, events_dir, events_file, test_events_json)
            
            # Verify file was created
            expected_path = project_path / events_dir / events_file
            assert expected_path.exists()
            
            # Verify contents
            content = expected_path.read_text(encoding="utf8")
            assert content == test_events_json


class TestOnlyWhenMockingIsNecessary:
    """Examples of when mocking is actually necessary."""

    @patch("kedro_viz.integrations.kedro.hooks_utils.get_file_size")
    def test_compute_size_with_mocked_file_system(self, mock_get_file_size):
        """Mock only external dependencies like file system operations."""
        mock_get_file_size.return_value = 3072

        class MockDataset:
            def __init__(self):
                self.filepath = "/some/file.csv"

        datasets = {"test_dataset": MockDataset()}
        result = compute_size("test_dataset", "any_data", datasets)

        assert result == 3072
        mock_get_file_size.assert_called_once_with("/some/file.csv")


class TestIsDefaultRun:
    """Test is_default_run function."""

    def test_is_default_run_returns_true_for_empty_params(self):
        """Test is_default_run returns True when no filtering parameters are set."""
        # Test various combinations of empty/falsy values
        test_cases = [
            {},  # Empty dict
            {"pipeline_name": None, "tags": [], "namespace": ""},  # Mix of falsy values
            {"extra_param": "ignored"},  # Non-filtering params ignored
        ]
        
        for run_params in test_cases:
            result = is_default_run(run_params)
            assert result is True

    def test_is_default_run_returns_false_when_filtering_params_set(self):
        """Test is_default_run returns False when any filtering parameter is set."""
        result = is_default_run({"pipeline_name": "custom"})
        assert result is False
