"""`kedro_viz.integrations.utils` provides utility functions and classes
to integrate Kedro-Viz with external data sources.
"""

import logging
from typing import TYPE_CHECKING, Any, Optional, Union

from kedro.io.core import AbstractDataset, DatasetError

from kedro_viz.models.metadata import Metadata

if TYPE_CHECKING:
    from kedro.io import DataCatalog

logger = logging.getLogger(__name__)

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
        reason: Optional[str] = None,
    ):
        self._data = data
        self.metadata = metadata
        # Why this dataset became unavailable, surfaced when its own node is requested.
        self.reason = reason

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


def get_dataset_lite_safe(
    catalog: "DataCatalog", dataset_name: str, is_lite: bool = False
) -> Union[AbstractDataset, None]:
    """Return a catalog dataset, outside lite mode exactly as ``catalog.get(dataset_name)`` would.

    In lite mode, a dataset that fails to load (e.g. a missing kedro-datasets extra) is replaced
    with ``UnavailableDataset`` and written back into the catalog under ``dataset_name``, so every
    caller that asks for this name afterwards consistently gets the same placeholder back.
    """
    if not is_lite:
        return catalog.get(dataset_name)

    reason: Optional[str] = None
    try:
        return catalog.get(dataset_name)
    except DatasetError as exc:
        # Same banner the live --lite loader sets for missing project imports, so a
        # missing/broken kedro-datasets dependency flags it too. The full reason is
        # logged when this dataset's own node is requested, not for every dataset a
        # bulk project load happens to touch.
        Metadata.set_has_missing_dependencies(True)
        reason = str(exc)
        logger.debug(
            "Kedro-Viz: dataset '%s' could not be loaded and will show as unavailable:\n%s",
            dataset_name,
            exc,
        )
    except Exception:  # noqa: BLE001
        # Last-resort guard: anything a dataset's constructor raises that isn't a
        # DatasetError (e.g. a native extension aborting on import) still shouldn't crash
        # whichever caller touched this dataset first.
        logger.debug(
            "Kedro-Viz: dataset '%s' could not be loaded and will show as unavailable.",
            dataset_name,
        )
    dataset = UnavailableDataset(reason=reason)
    try:
        catalog[dataset_name] = dataset
    except Exception:  # noqa: BLE001
        # Best-effort: the placeholder still gets returned to this caller even if it
        # couldn't be cached for the next one.
        logger.debug(
            "Kedro-Viz: could not cache the unavailable placeholder for dataset '%s'.",
            dataset_name,
        )
    return dataset
