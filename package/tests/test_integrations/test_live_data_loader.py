"""Tests for the deferred, once-only live data load."""

from __future__ import annotations

import threading

import pytest

from kedro_viz.integrations.kedro.live_data_loader import (
    LiveDataLoader,
    LiveDataLoadError,
)


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


def test_a_failed_load_is_not_retried() -> None:
    """Recovery policy: one attempt only. Later calls fail fast without rerunning it."""
    loader = LiveDataLoader()
    attempts = []

    def failing_load() -> None:
        attempts.append("attempt")
        raise RuntimeError("broken")

    loader.configure(failing_load)

    with pytest.raises(LiveDataLoadError):
        loader.ensure_loaded()

    # Two more calls: neither should re-run the load.
    with pytest.raises(LiveDataLoadError):
        loader.ensure_loaded()
    with pytest.raises(LiveDataLoadError):
        loader.ensure_loaded()

    assert attempts == ["attempt"]


def test_a_failed_load_chains_the_original_exception() -> None:
    """The original failure stays discoverable via ``__cause__`` for diagnosis."""
    loader = LiveDataLoader()
    original = RuntimeError("broken")

    def failing_load() -> None:
        raise original

    loader.configure(failing_load)

    with pytest.raises(LiveDataLoadError) as excinfo:
        loader.ensure_loaded()

    assert excinfo.value.__cause__ is original


def test_reconfigure_after_a_failure_allows_loading_again() -> None:
    """A fresh ``configure()`` clears the remembered failure, same as a fresh run."""
    loader = LiveDataLoader()
    loader.configure(lambda: (_ for _ in ()).throw(RuntimeError("broken")))
    with pytest.raises(LiveDataLoadError):
        loader.ensure_loaded()

    calls = []
    loader.configure(lambda: calls.append("loaded"))
    loader.ensure_loaded()

    assert calls == ["loaded"]


def test_reset_after_a_failure_clears_the_remembered_error() -> None:
    loader = LiveDataLoader()
    loader.configure(lambda: (_ for _ in ()).throw(RuntimeError("broken")))
    with pytest.raises(LiveDataLoadError):
        loader.ensure_loaded()

    loader.reset()

    # Nothing configured any more, so this is a safe no-op, not a replay of the failure.
    loader.ensure_loaded()


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


def test_concurrent_first_calls_attempt_a_failing_load_exactly_once() -> None:
    """Racing callers on a failing load all get the error; only one attempt is made."""
    loader = LiveDataLoader()
    started = threading.Event()
    finish_load = threading.Event()
    call_count = 0
    errors: list[BaseException] = []

    def slow_failing_load() -> None:
        nonlocal call_count
        call_count += 1
        started.set()
        finish_load.wait(timeout=5)
        raise RuntimeError("broken")

    def call_and_collect() -> None:
        try:
            loader.ensure_loaded()
        except BaseException as exc:  # noqa: BLE001
            errors.append(exc)

    loader.configure(slow_failing_load)

    threads = [threading.Thread(target=call_and_collect) for _ in range(5)]
    for thread in threads:
        thread.start()
    assert started.wait(timeout=5)
    finish_load.set()
    for thread in threads:
        thread.join(timeout=5)

    assert call_count == 1
    assert len(errors) == 5
    assert all(isinstance(exc, LiveDataLoadError) for exc in errors)
