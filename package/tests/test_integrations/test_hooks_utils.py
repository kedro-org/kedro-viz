import json
from datetime import datetime, timezone
from pathlib import Path
from tempfile import TemporaryDirectory

from kedro.pipeline.node import Node as KedroNode

from kedro_viz.integrations.kedro.hooks_utils import (
    TIME_FORMAT,
    compute_size,
    create_dataset_event,
    extract_file_paths,
    generate_timestamp,
    get_file_size,
    hash_node,
    is_default_run,
    write_events,
    write_events_to_file,
)


def test_hash_node_with_kedro_node():
    """Test hash_node function with KedroNode - no mocking needed."""

    def dummy_func(x):
        return x

    from kedro.pipeline import node

    kedro_node = node(
        func=dummy_func,
        inputs="input_data",
        outputs="output_data",
        name="test_node",
    )

    result = hash_node(kedro_node)

    # Should return a consistent hash
    assert isinstance(result, str)
    assert len(result) > 0
    # Should be deterministic
    assert result == hash_node(kedro_node)


def test_hash_node_with_string():
    """Test hash_node function with string input - no mocking needed."""
    test_input = "test_dataset"
    result = hash_node(test_input)

    assert isinstance(result, str)
    assert len(result) > 0
    # Should be deterministic
    assert result == hash_node(test_input)


def test_extract_file_paths():
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


def test_generate_timestamp_format():
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


def test_create_dataset_event_basic():
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


def test_create_dataset_event_with_datasets_but_no_size():
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


def test_compute_size_no_dataset():
    """Test compute_size function when dataset not found - no mocking needed."""
    result = compute_size("nonexistent_dataset", {})
    assert result is None


def test_compute_size_no_filepath():
    """Test compute_size when dataset has no filepath - no mocking needed."""

    class MockDataset:
        pass  # No filepath attributes

    datasets = {"test_dataset": MockDataset()}
    result = compute_size("test_dataset", datasets)
    assert result is None


def test_compute_size_with_filepath(mock_get_file_size):
    """Test compute_size function with dataset that has filepath - minimal mocking."""

    class MockDataset:
        def __init__(self):
            self.filepath = "/path/to/file.csv"

    datasets = {"test_dataset": MockDataset()}
    result = compute_size("test_dataset", datasets)

    assert result == 1024
    mock_get_file_size.assert_called_once_with("/path/to/file.csv")


def test_write_events_to_file_integration():
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


def test_compute_size_with_mocked_file_system(mocker):
    """Mock only external dependencies like file system operations."""
    mock_get_file_size = mocker.patch(
        "kedro_viz.integrations.kedro.hooks_utils.get_file_size",
        return_value=3072,
    )

    class MockDataset:
        def __init__(self):
            self.filepath = "/some/file.csv"

    datasets = {"test_dataset": MockDataset()}
    result = compute_size("test_dataset", datasets)

    assert result == 3072
    mock_get_file_size.assert_called_once_with("/some/file.csv")


def test_is_default_run_returns_true_for_empty_params():
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


def test_is_default_run_returns_false_when_filtering_params_set():
    """Test is_default_run returns False when any filtering parameter is set."""
    result = is_default_run({"pipeline_name": "custom"})
    assert result is False


def test_create_dataset_event_includes_size(mocker):
    """size_bytes gets added when compute_size returns a number."""

    mocker.patch(
        "kedro_viz.integrations.kedro.hooks_utils.compute_size",
        return_value=2048,
    )

    event = create_dataset_event(
        event_type="after_dataset_saved",
        dataset_name="my_dataset",
        dataset_value="dummy",
        datasets={"my_dataset": object()},
    )

    assert event["size_bytes"] == 2048
    assert event["status"] == "Available"


def test_get_file_size_existing_path(mocker):
    """happy-path where the file exists and has a size."""
    fake_fs = mocker.Mock()
    fake_fs.exists.return_value = True
    fake_fs.size.return_value = 1234

    # url_to_fs returns our stub FS plus a path string
    mocker.patch("fsspec.core.url_to_fs", return_value=(fake_fs, "dummy/path"))

    size = get_file_size("dummy/path")

    assert size == 1234  # line 87 executed
    fake_fs.exists.assert_called_once_with("dummy/path")
    fake_fs.size.assert_called_once_with("dummy/path")


def test_write_events_invokes_write_events_to_file(mocker):
    """json.dumps and delegated file-write."""
    events = [{"event": "foo"}]

    with TemporaryDirectory() as tmp:
        proj_path = Path(tmp)

        mocker.patch(
            "kedro_viz.integrations.kedro.hooks_utils._find_kedro_project",
            return_value=proj_path,
        )

        spy = mocker.patch(
            "kedro_viz.integrations.kedro.hooks_utils.write_events_to_file"
        )

        write_events(events)

        spy.assert_called_once()
        args = spy.call_args[0]
        assert args[0] == proj_path
        assert json.loads(args[3]) == events
