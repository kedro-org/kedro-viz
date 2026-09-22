"""Defer the legacy live Kedro load until something actually needs it.

The inspection snapshot serves ``/api/main`` and ``/api/pipelines/{id}`` directly, so nothing
on that path needs a live Kedro catalog or session. ``/api/nodes/{id}`` and ``--save-file``
(including ``kedro viz deploy``) are the two remaining consumers of the live-loaded
``DataAccessManager``. This loader keeps the live load out of server startup, running it once,
on first use, so a session that never asks for node metadata or a static export never pays for it.
"""

from __future__ import annotations

import threading
from typing import Callable, Optional


class LiveDataLoader:
    """Run a configured load exactly once, on first use, thread-safely."""

    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._loaded = False
        self._load: Optional[Callable[[], object]] = None

    def configure(self, load: Callable[[], object]) -> None:
        """Bind this run's load call. Does not run it yet."""
        self._load = load
        self._loaded = False

    def reset(self) -> None:
        """Clear any configured load and the once-only guard."""
        self._load = None
        self._loaded = False

    def ensure_loaded(self) -> None:
        """Run the configured load once. Safe to call repeatedly, including concurrently.

        A no-op when nothing was configured: a caller that populated the live repositories
        by some other means (tests, a direct ``populate_data`` call) has nothing to defer.
        """
        if self._loaded:
            return
        with self._lock:
            if self._loaded or self._load is None:
                return
            self._load()
            self._loaded = True


live_data_loader = LiveDataLoader()
