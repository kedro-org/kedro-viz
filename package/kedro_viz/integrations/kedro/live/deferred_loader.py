"""Run the live Kedro load after the graph is served, not at startup.

The graph routes (``/api/main`` and ``/api/pipelines/{id}``) are served from the inspection
snapshot. Only ``/api/nodes/{id}`` and ``--save-file`` (including ``kedro viz deploy``) still
need the live ``DataAccessManager``. The load runs once, whichever comes first:

- ``preload``: a background task that starts after ``/api/main`` is sent (not with
  ``--autoreload``). So every session that opens the graph pays for the load, but after
  the graph, not before it.
- ``ensure_loaded``: the first ``/api/nodes/{id}`` or ``--save-file`` call. If a preload is
  already running, it waits for it.
"""

from __future__ import annotations

import logging
import threading
from typing import Callable, Optional

logger = logging.getLogger(__name__)


class DeferredDataLoadError(RuntimeError):
    """Raised by ``ensure_loaded`` once the deferred live load has already failed.

    A stable, user-facing message distinct from whatever the underlying load raised (chained
    as ``__cause__``), so every caller after the first gets the same clear explanation instead
    of the original exception replayed with no context about why it's happening again.
    """


class DeferredDataLoader:
    """Run a configured load at most once, thread-safely.

    Recovery policy: a failed load is not retried. Every call after the first failure
    immediately raises `DeferredDataLoadError` instead of repeating the (expensive,
    already-failed) load.
    """

    def __init__(self) -> None:
        # Held for the whole load. configure() and reset() take it too, so a load from the
        # old configuration can't mark the new one as loaded.
        self._lock = threading.Lock()
        self._loaded = False
        self._load: Optional[Callable[[], object]] = None
        self._error: Optional[BaseException] = None
        # A separate lock, so starting a preload never waits on a running load.
        self._preload_lock = threading.Lock()
        self._preload_started = False

    def configure(self, load: Callable[[], object]) -> None:
        """Bind this run's load call. Does not run it yet.

        Waits for a running load to finish first.
        """
        with self._lock, self._preload_lock:
            self._load = load
            self._loaded = False
            self._error = None
            self._preload_started = False

    def reset(self) -> None:
        """Clear the configured load, the once-only guard and any remembered failure.

        Waits for a running load to finish first.
        """
        with self._lock, self._preload_lock:
            self._load = None
            self._loaded = False
            self._error = None
            self._preload_started = False

    def preload(self) -> None:
        """Run the load now, before anything needs it. Never raises.

        It runs as a FastAPI background task after ``/api/main`` is sent. The server tracks
        it, so shutdown waits for it and the load can clean up.

        Only the first call per ``configure()`` does anything. Other calls return straight
        away rather than waiting on the load. It also does nothing if no load is configured,
        or the load has already run.

        If the load fails, the error is logged. The next ``ensure_loaded()`` call then raises
        ``DeferredDataLoadError``, the same as without a preload.
        """
        with self._preload_lock:
            if (
                self._preload_started
                or self._load is None
                or self._loaded
                or self._error is not None
            ):
                return
            self._preload_started = True

        try:
            self.ensure_loaded()
        except DeferredDataLoadError:
            # Already logged. The request that needs the data reports it.
            pass

    def ensure_loaded(self) -> None:
        """Run the configured load once. Safe to call repeatedly, including concurrently.

        A no-op when nothing was configured: a caller that populated the live repositories
        by some other means (tests, a direct ``populate_data`` call) has nothing to defer.

        Raises:
            DeferredDataLoadError: If the load has already failed once -- see the class
                docstring for why this isn't retried.
        """
        if self._loaded:
            return
        if self._error is not None:
            self._raise_load_error()

        with self._lock:
            if self._loaded:
                return
            if self._load is None:
                return
            if self._error is not None:
                self._raise_load_error()

            try:
                self._load()
            except Exception as exc:  # noqa: BLE001
                self._error = exc
                logger.exception(
                    "Kedro-Viz: the live project load failed. Node metadata and "
                    "--save-file will be unavailable for the rest of this run."
                )
                self._raise_load_error()
            else:
                self._loaded = True

    def _raise_load_error(self) -> None:
        raise DeferredDataLoadError(
            "Kedro-Viz could not load the live project data, node metadata and "
            "--save-file are unavailable for the rest of this run. See the server log "
            "for the original error."
        ) from self._error


deferred_data_loader = DeferredDataLoader()
