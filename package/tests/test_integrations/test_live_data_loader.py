"""Tests for the deferred, once-only live data load."""

from __future__ import annotations

import threading

from kedro_viz.integrations.kedro.live_data_loader import LiveDataLoader


def test_ensure_loaded_without_configure_is_a_safe_no_op() -> None:
    """A caller that populated the data some other way has nothing to defer."""
    loader = LiveDataLoader()

    loader.ensure_loaded()


def test_ensure_loaded_runs_the_configured_load_once() -> None:
    loader = LiveDataLoader()
    calls = []
    loader.configure(lambda: calls.append("loaded"))

    loader.ensure_loaded()
    loader.ensure_loaded()
    loader.ensure_loaded()

    assert calls == ["loaded"]


def test_reconfigure_allows_loading_again() -> None:
    """A fresh ``configure()`` (e.g. a new server run) resets the once-only guard."""
    loader = LiveDataLoader()
    first_calls = []
    loader.configure(lambda: first_calls.append("loaded"))
    loader.ensure_loaded()

    second_calls = []
    loader.configure(lambda: second_calls.append("loaded"))
    loader.ensure_loaded()

    assert first_calls == ["loaded"]
    assert second_calls == ["loaded"]


def test_reset_clears_configuration_and_the_loaded_guard() -> None:
    loader = LiveDataLoader()
    calls = []
    loader.configure(lambda: calls.append("loaded"))
    loader.ensure_loaded()

    loader.reset()
    loader.ensure_loaded()

    # Reset cleared the configured load, so a later call cannot run it again.
    assert calls == ["loaded"]


def test_concurrent_first_calls_load_exactly_once() -> None:
    """Racing callers block on the same load instead of duplicating it."""
    loader = LiveDataLoader()
    started = threading.Event()
    finish_load = threading.Event()
    call_count = 0

    def slow_load() -> None:
        nonlocal call_count
        call_count += 1
        started.set()
        finish_load.wait(timeout=5)

    loader.configure(slow_load)

    threads = [threading.Thread(target=loader.ensure_loaded) for _ in range(5)]
    for thread in threads:
        thread.start()
    assert started.wait(timeout=5)
    finish_load.set()
    for thread in threads:
        thread.join(timeout=5)

    assert call_count == 1
