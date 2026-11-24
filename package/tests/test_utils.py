import sys
import time
from unittest.mock import patch

import pytest

from kedro_viz.utils import (
    Spinner,
    merge_dicts,
    stub_modules,
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


class TestStubModules:
    """Regression tests for the sys.modules stub-cleanup behind kedro-viz --lite."""

    def test_adds_and_removes_the_stub(self):
        marker = object()
        assert "totally_fake_stubbed_module" not in sys.modules

        with stub_modules({"totally_fake_stubbed_module": marker}):
            assert sys.modules["totally_fake_stubbed_module"] is marker

        assert "totally_fake_stubbed_module" not in sys.modules

    def test_is_a_noop_for_an_empty_mapping(self):
        before = set(sys.modules)
        with stub_modules({}):
            pass
        assert set(sys.modules) - before == set()

    def test_does_not_touch_a_module_that_already_exists(self):
        """A name that's already a real module is left alone -- not clobbered by the
        stub, and not deleted on exit either, since `stub_modules` never added it."""
        real_module = sys.modules["json"]

        with stub_modules({"json": object()}):
            # Still the real module inside the context: never overwritten.
            assert sys.modules["json"] is real_module

        # And still there afterwards.
        assert sys.modules["json"] is real_module

    def test_does_not_evict_a_real_import_that_happens_inside(
        self, monkeypatch, tmp_path
    ):
        """The exact regression this exists to prevent: a real module imported as a side
        effect while a stub is active must survive the stub's own cleanup on exit."""
        real_module_name = "totally_real_module_imported_during_stub_window"
        (tmp_path / f"{real_module_name}.py").write_text(
            "VALUE = 1\n", encoding="utf-8"
        )
        monkeypatch.syspath_prepend(str(tmp_path))
        assert real_module_name not in sys.modules

        try:
            with stub_modules({"totally_fake_stubbed_module": object()}):
                import importlib

                importlib.import_module(real_module_name)
                assert real_module_name in sys.modules

            # The real import survives; only the stub is gone.
            assert real_module_name in sys.modules
            assert "totally_fake_stubbed_module" not in sys.modules
        finally:
            sys.modules.pop(real_module_name, None)

    def test_does_not_remove_a_stub_that_was_replaced_by_a_real_import(self):
        """If something inside the window legitimately replaces the stub with a real
        module (e.g. it becomes importable mid-process), exit must not delete that
        real replacement just because the name matches a stub this context added."""
        replacement = object()

        with stub_modules({"totally_fake_stubbed_module": object()}):
            sys.modules["totally_fake_stubbed_module"] = replacement

        assert sys.modules.get("totally_fake_stubbed_module") is replacement
        del sys.modules["totally_fake_stubbed_module"]

    def test_cleans_up_even_when_the_body_raises(self):
        assert "totally_fake_stubbed_module" not in sys.modules

        with pytest.raises(RuntimeError):
            with stub_modules({"totally_fake_stubbed_module": object()}):
                raise RuntimeError("broken")

        assert "totally_fake_stubbed_module" not in sys.modules
