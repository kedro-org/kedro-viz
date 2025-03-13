import time
from unittest.mock import patch

from kedro_viz.utils import Spinner, merge_dicts


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
