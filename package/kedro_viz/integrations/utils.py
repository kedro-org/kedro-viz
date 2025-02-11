"""`kedro_viz.integrations.utils` provides utility functions and classes
to integrate Kedro-Viz with external data sources.
"""

from typing import Any, Union

try:
    # kedro 0.18.12 onwards
    from kedro.io.core import AbstractDataset
except ImportError:  # pragma: no cover
    # older versions
    from kedro.io.core import AbstractDataSet as AbstractDataset  # type: ignore

_EMPTY = object()

import sys
import time
import threading
from itertools import cycle

class _VizNullPluginManager:  # pragma: no cover
    """This class creates an empty ``hook_manager`` that will ignore all calls to hooks
    and registered plugins allowing the runner to function if no ``hook_manager``
    has been instantiated.

    NOTE: _VizNullPluginManager is a clone of _NullPluginManager class in Kedro.
    This was introduced to support the earliest version of Kedro which does not
    have _NullPluginManager defined
    """

    def __init__(self, *args, **kwargs):
        pass

    def __getattr__(self, name):
        return self

    def __call__(self, *args, **kwargs):
        pass


class UnavailableDataset(AbstractDataset):  # pragma: no cover
    """This class is a custom dataset implementation for `Kedro Viz Lite`
    when kedro-datasets are unavailable"""

    def __init__(
        self,
        data: Any = _EMPTY,
        metadata: Union[dict[str, Any], None] = None,
    ):
        self._data = data
        self.metadata = metadata

    def _load(self, *args, **kwargs):
        pass

    def _save(self, *args, **kwargs):
        pass

    load = _load
    save = _save

    def _exists(self):
        pass

    def _describe(self) -> dict[str, Any]:
        return {"data": self._data}




class Spinner:
    def __init__(self, message: str = "Processing"):
        self.spinner = cycle(["-", "\\", "|", "/"])
        self.message = message
        self.stop_running = False

    def start(self):
        def run_spinner():
            while not self.stop_running:
                sys.stdout.write(f"\r{self.message} {next(self.spinner)} ")
                sys.stdout.flush()
                time.sleep(0.1)
            sys.stdout.write("\r" + " " * (len(self.message) + 2) + "\r")  # Clear the line

        self._spinner_thread = threading.Thread(target=run_spinner, daemon=True)
        self._spinner_thread.start()

    def stop(self):
        self.stop_running = True
        self._spinner_thread.join()
