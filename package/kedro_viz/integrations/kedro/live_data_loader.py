"""Defer the legacy live Kedro load until something actually needs it.

The inspection snapshot serves ``/api/main`` and ``/api/pipelines/{id}`` directly, so nothing
on that path needs a live Kedro catalog or session. ``/api/nodes/{id}`` and ``--save-file``
(including ``kedro viz deploy``) are the two remaining consumers of the live-loaded
``DataAccessManager``. This loader keeps the live load out of server startup, running it once,
on first use, so a session that never asks for node metadata or a static export never pays for it.
"""

from __future__ import annotations

import logging
import threading
from typing import Callable, Optional

logger = logging.getLogger(__name__)


class LiveDataLoadError(RuntimeError):
    """Raised by ``ensure_loaded`` once the deferred live load has already failed.

    A stable, user-facing message distinct from whatever the underlying load raised (chained
    as ``__cause__``), so every caller after the first gets the same clear explanation instead
    of the original exception replayed with no context about why it's happening again.
    """


class LiveDataLoader:
    """Run a configured load at most once, on first use, thread-safely.

    Recovery policy: a failed load is not retried. Every call after the first failure
    immediately raises `LiveDataLoadError` instead of repeating the (expensive,
    already-failed) load.
    """

    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._loaded = False
        self._load: Optional[Callable[[], object]] = None
        self._error: Optional[BaseException] = None

    def configure(self, load: Callable[[], object]) -> None:
        """Bind this run's load call. Does not run it yet."""
        self._load = load
        self._loaded = False
        self._error = None

    def reset(self) -> None:
        """Clear any configured load, the once-only guard and any remembered failure."""
        self._load = None
        self._loaded = False
        self._error = None

    def ensure_loaded(self) -> None:
        """Run the configured load once. Safe to call repeatedly, including concurrently.

        A no-op when nothing was configured: a caller that populated the live repositories
        by some other means (tests, a direct ``populate_data`` call) has nothing to defer.

        Raises:
            LiveDataLoadError: If the load has already failed once -- see the class
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
        raise LiveDataLoadError(
            "Kedro-Viz could not load the live project data, node metadata and "
            "--save-file are unavailable for the rest of this run. See the server log "
            "for the original error."
        ) from self._error


live_data_loader = LiveDataLoader()
