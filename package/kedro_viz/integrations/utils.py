"""`kedro_viz.integrations.utils` provides utility functions and classes
to integrate Kedro-Viz with external data sources.
"""

from typing import Any, Union

from kedro.io.core import AbstractDataset

_EMPTY = object()


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

    def _load(self, *args, **kwargs):  # pragma: no cover
        pass

    def _save(self, *args, **kwargs):  # pragma: no cover
        pass

    load = _load
    save = _save

    def _exists(self):  # pragma: no cover
        pass

    def _describe(self) -> dict[str, Any]:  # pragma: no cover
        return {"data": self._data}
