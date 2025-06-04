import time
from unittest.mock import patch

from kedro_viz.api.rest.responses.run_events import DatasetStatus, NodeStatus
from kedro_viz.utils import (
    Spinner,
    calculate_pipeline_duration,
    convert_status_to_enum,
    merge_dicts,
    safe_int,
)


class TestUtils:
    def test_merge_dicts_flat(self):
        """Test merging flat dictionaries."""
        dict_one = {"a": 1, "b": 2}
        dict_two = {"b": 3, "c": 4}
        expected = {"a": 1, "b": 3, "c": 4}

        result = merge_dicts(dict_one, dict_two)
        assert result == expected

    def test_merge_dicts_nested(self):
        """Test merging nested dictionaries."""
        dict_one = {"a": {"x": 1}, "b": 2}
        dict_two = {"a": {"y": 2}, "c": 3}
        expected = {"a": {"x": 1, "y": 2}, "b": 2, "c": 3}

        result = merge_dicts(dict_one, dict_two)
        assert result == expected

    def test_merge_dicts_overwrite(self):
        """Test merging with overwriting nested keys."""
        dict_one = {"a": {"x": 1, "y": 2}}
        dict_two = {"a": {"x": 3}}
        expected = {"a": {"x": 3, "y": 2}}

        result = merge_dicts(dict_one, dict_two)
        assert result == expected

    def test_merge_dicts_empty(self):
        """Test merging when one dictionary is empty."""
        dict_one = {"a": 1}
        dict_two = {}
        expected = {"a": 1}

        result = merge_dicts(dict_one, dict_two)
        assert result == expected

        result = merge_dicts(dict_two, dict_one)
        assert result == expected

    def test_spinner_initialization(self):
        """Test that Spinner initializes with default values."""
        spinner = Spinner()
        assert spinner.message == "Processing"
        assert not spinner.stop_running

    def test_spinner_start_and_stop(self):
        """Test that the spinner starts and stops without errors."""
        spinner = Spinner("Testing")

        with patch("sys.stdout.write"):
            spinner.start()
            time.sleep(0.3)
            spinner.stop()

        assert spinner.stop_running is True
        assert not spinner._spinner_thread.is_alive()  # Ensure the thread stops

    def test_spinner_output(self):
        """Test that Spinner writes output while running."""
        spinner = Spinner("Loading")

        with patch("sys.stdout.write") as mock_write:
            spinner.start()
            time.sleep(0.2)
            spinner.stop()

        assert mock_write.call_count > 0

    def test_spinner_thread_cleanup(self):
        """Ensure that after stopping, the thread is properly cleaned up."""
        spinner = Spinner()
        spinner.start()
        time.sleep(0.2)
        spinner.stop()

        assert spinner._spinner_thread is not None
        assert not spinner._spinner_thread.is_alive()

    def test_safe_int_valid_inputs(self):
        """Test safe_int with valid inputs."""
        assert safe_int(42) == 42
        assert safe_int("123") == 123
        assert safe_int(3.14) == 3
        assert safe_int(True) == 1

    def test_safe_int_invalid_inputs(self):
        """Test safe_int with invalid inputs returns 0."""
        assert safe_int("abc") == 0
        assert safe_int(None) == 0
        assert safe_int([1, 2, 3]) == 0

    def test_convert_status_to_enum_valid(self):
        """Test convert_status_to_enum with valid status."""
        result = convert_status_to_enum("success", NodeStatus.FAIL)
        assert result == NodeStatus.SUCCESS

        result = convert_status_to_enum("SUCCESS", NodeStatus.FAIL)
        assert result == NodeStatus.SUCCESS

    def test_convert_status_to_enum_invalid(self):
        """Test convert_status_to_enum with invalid status returns default."""
        result = convert_status_to_enum("unknown", NodeStatus.SUCCESS)
        assert result == NodeStatus.SUCCESS

        result = convert_status_to_enum(None, DatasetStatus.AVAILABLE)
        assert result == DatasetStatus.AVAILABLE

    def test_calculate_pipeline_duration_from_timestamps(self):
        """Test calculating duration from valid timestamps."""
        start_time = "2023-01-01T10:00:00"
        end_time = "2023-01-01T10:15:30"
        nodes_durations = {"node1": 10.0}

        result = calculate_pipeline_duration(start_time, end_time, nodes_durations)
        assert result == 930.0  # 15 minutes 30 seconds

    def test_calculate_pipeline_duration_fallback(self):
        """Test fallback to node durations when timestamps are invalid."""
        nodes_durations = {"node1": 10.0, "node2": 20.0}

        # Invalid timestamps
        result = calculate_pipeline_duration("invalid", "timestamps", nodes_durations)
        assert result == 30.0  # Sum of node durations

        # No timestamps
        result = calculate_pipeline_duration(None, None, nodes_durations)
        assert result == 30.0

    def test_convert_status_debug_logging(self):
        """Test debug logging for unknown status."""
        with patch("kedro_viz.utils.logging.getLogger") as mock_logger:
            mock_logger_instance = mock_logger.return_value
            result = convert_status_to_enum("unknown_status", NodeStatus.SUCCESS)
            assert result == NodeStatus.SUCCESS
            mock_logger_instance.debug.assert_called_once()

    def test_calculate_duration_info_logging(self):
        """Test info logging for successful timestamp calculation."""
        with patch("kedro_viz.utils.logging.getLogger") as mock_logger:
            mock_logger_instance = mock_logger.return_value
            start_time = "2023-01-01T10:00:00"
            end_time = "2023-01-01T10:01:00"
            result = calculate_pipeline_duration(start_time, end_time, {})
            assert result == 60.0
            mock_logger_instance.info.assert_called_once()

    def test_calculate_duration_warning_logging(self):
        """Test warning logging for invalid timestamps."""
        with patch("kedro_viz.utils.logging.getLogger") as mock_logger:
            mock_logger_instance = mock_logger.return_value
            result = calculate_pipeline_duration(
                "invalid", "2023-01-01T10:00:00", {"node1": 10.0}
            )
            assert result == 10.0
            mock_logger_instance.warning.assert_called_once()
