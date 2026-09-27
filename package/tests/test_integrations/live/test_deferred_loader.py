"""Tests for the deferred, once-only live data load."""

from __future__ import annotations

import threading

import pytest

from kedro_viz.integrations.kedro.live.deferred_loader import (
    DeferredDataLoader,
    DeferredDataLoadError,
)


def test_ensure_loaded_without_configure_is_a_safe_no_op() -> None:
    """A caller that populated the data some other way has nothing to defer."""
    loader = DeferredDataLoader()

    loader.ensure_loaded()


def test_ensure_loaded_runs_the_configured_load_once() -> None:
    loader = DeferredDataLoader()
    calls = []
    loader.configure(lambda: calls.append("loaded"))

    loader.ensure_loaded()
    loader.ensure_loaded()
    loader.ensure_loaded()

    assert calls == ["loaded"]


def test_reconfigure_allows_loading_again() -> None:
    """A fresh ``configure()`` (e.g. a new server run) resets the once-only guard."""
    loader = DeferredDataLoader()
    first_calls = []
    loader.configure(lambda: first_calls.append("loaded"))
    loader.ensure_loaded()

    second_calls = []
    loader.configure(lambda: second_calls.append("loaded"))
    loader.ensure_loaded()

    assert first_calls == ["loaded"]
    assert second_calls == ["loaded"]


def test_reset_clears_configuration_and_the_loaded_guard() -> None:
    loader = DeferredDataLoader()
    calls = []
    loader.configure(lambda: calls.append("loaded"))
    loader.ensure_loaded()

    loader.reset()
    loader.ensure_loaded()

    # Reset cleared the configured load, so a later call cannot run it again.
    assert calls == ["loaded"]


def test_a_failed_load_is_not_retried() -> None:
    """Recovery policy: one attempt only. Later calls fail fast without rerunning it."""
    loader = DeferredDataLoader()
    attempts = []

    def failing_load() -> None:
        attempts.append("attempt")
        raise RuntimeError("broken")

    loader.configure(failing_load)

    with pytest.raises(DeferredDataLoadError):
        loader.ensure_loaded()

    # Two more calls: neither should re-run the load.
    with pytest.raises(DeferredDataLoadError):
        loader.ensure_loaded()
    with pytest.raises(DeferredDataLoadError):
        loader.ensure_loaded()

    assert attempts == ["attempt"]


def test_a_failed_load_chains_the_original_exception() -> None:
    """The original failure stays discoverable via ``__cause__`` for diagnosis."""
    loader = DeferredDataLoader()
    original = RuntimeError("broken")

    def failing_load() -> None:
        raise original

    loader.configure(failing_load)

    with pytest.raises(DeferredDataLoadError) as excinfo:
        loader.ensure_loaded()

    assert excinfo.value.__cause__ is original


def test_reconfigure_after_a_failure_allows_loading_again() -> None:
    """A fresh ``configure()`` clears the remembered failure, same as a fresh run."""
    loader = DeferredDataLoader()
    loader.configure(lambda: (_ for _ in ()).throw(RuntimeError("broken")))
    with pytest.raises(DeferredDataLoadError):
        loader.ensure_loaded()

    calls = []
    loader.configure(lambda: calls.append("loaded"))
    loader.ensure_loaded()

    assert calls == ["loaded"]


def test_reset_after_a_failure_clears_the_remembered_error() -> None:
    loader = DeferredDataLoader()
    loader.configure(lambda: (_ for _ in ()).throw(RuntimeError("broken")))
    with pytest.raises(DeferredDataLoadError):
        loader.ensure_loaded()

    loader.reset()

    # Nothing configured any more, so this is a safe no-op, not a replay of the failure.
    loader.ensure_loaded()


def test_concurrent_first_calls_load_exactly_once() -> None:
    """Racing callers block on the same load instead of duplicating it."""
    loader = DeferredDataLoader()
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
    loader = DeferredDataLoader()
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
    assert all(isinstance(exc, DeferredDataLoadError) for exc in errors)


def test_preload_runs_the_configured_load_once() -> None:
    loader = DeferredDataLoader()
    calls = []
    loader.configure(lambda: calls.append("loaded"))

    loader.preload()
    loader.preload()
    # Already loaded, so this doesn't load again.
    loader.ensure_loaded()

    assert calls == ["loaded"]


def test_preload_without_configure_is_a_safe_no_op() -> None:
    DeferredDataLoader().preload()


def test_preload_after_the_load_finished_does_nothing() -> None:
    loader = DeferredDataLoader()
    calls = []
    loader.configure(lambda: calls.append("loaded"))
    loader.ensure_loaded()

    loader.preload()

    assert calls == ["loaded"]


def test_a_second_preload_returns_at_once_while_the_first_is_loading() -> None:
    """Page reloads don't queue up behind a running load."""
    loader = DeferredDataLoader()
    started = threading.Event()
    release = threading.Event()
    calls = []

    def slow_load() -> None:
        calls.append("loaded")
        started.set()
        release.wait(timeout=5)

    loader.configure(slow_load)
    first = threading.Thread(target=loader.preload)
    first.start()
    assert started.wait(timeout=5)

    second = threading.Thread(target=loader.preload)
    second.start()
    second.join(timeout=1)
    assert not second.is_alive(), "the second preload should not wait for the load"

    release.set()
    first.join(timeout=5)
    assert calls == ["loaded"]


def test_a_request_during_the_preload_waits_instead_of_loading_again() -> None:
    loader = DeferredDataLoader()
    started = threading.Event()
    release = threading.Event()
    calls = []

    def slow_load() -> None:
        calls.append("loaded")
        started.set()
        release.wait(timeout=5)

    loader.configure(slow_load)
    preload = threading.Thread(target=loader.preload)
    preload.start()
    assert started.wait(timeout=5)

    request = threading.Thread(target=loader.ensure_loaded)
    request.start()
    request.join(timeout=0.2)
    assert request.is_alive(), "the request should wait for the running load"

    release.set()
    request.join(timeout=5)
    preload.join(timeout=5)
    assert not request.is_alive()
    assert calls == ["loaded"]


def test_a_failed_preload_does_not_raise_and_is_reported_on_next_use() -> None:
    """A failed preload doesn't raise. The next caller still gets the error."""
    loader = DeferredDataLoader()
    attempts = []

    def failing_load() -> None:
        attempts.append("attempt")
        raise RuntimeError("broken")

    loader.configure(failing_load)

    loader.preload()

    with pytest.raises(DeferredDataLoadError):
        loader.ensure_loaded()
    # The failure is remembered, so nothing retries the load.
    loader.preload()
    assert attempts == ["attempt"]


def test_reconfigure_allows_a_new_preload() -> None:
    """After a new ``configure()`` (a new server run), the preload runs again."""
    loader = DeferredDataLoader()
    loader.configure(lambda: None)
    loader.preload()

    calls = []
    loader.configure(lambda: calls.append("loaded"))
    loader.preload()

    assert calls == ["loaded"]


def test_reset_prevents_a_preload() -> None:
    loader = DeferredDataLoader()
    calls = []
    loader.configure(lambda: calls.append("loaded"))

    loader.reset()
    loader.preload()

    assert calls == []


@pytest.mark.parametrize("change", ["configure", "reset_then_configure"])
def test_changing_the_configuration_waits_for_a_running_load(change: str) -> None:
    """A running load can't mark the next configuration as loaded.

    Otherwise the old load would finish after ``configure()``, set the loaded flag, and
    the new load would never run.
    """
    loader = DeferredDataLoader()
    started = threading.Event()
    release = threading.Event()

    def old_load() -> None:
        started.set()
        release.wait(timeout=5)

    new_calls = []
    loader.configure(old_load)
    running = threading.Thread(target=loader.ensure_loaded)
    running.start()
    assert started.wait(timeout=5)

    def change_configuration() -> None:
        if change == "reset_then_configure":
            loader.reset()
        loader.configure(lambda: new_calls.append("loaded"))

    changer = threading.Thread(target=change_configuration)
    changer.start()
    changer.join(timeout=0.2)
    assert changer.is_alive(), "reconfiguring should wait for the running load"

    release.set()
    running.join(timeout=5)
    changer.join(timeout=5)
    loader.ensure_loaded()

    assert new_calls == ["loaded"]
