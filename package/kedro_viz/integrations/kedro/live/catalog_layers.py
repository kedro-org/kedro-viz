"""Read ``kedro-viz`` layer metadata directly from a live, populated Kedro catalog.

Unlike ``inspection.builders.layers._extract_layers`` (which reads the raw catalog config, so it
works without a live catalog), this reads each dataset's actual ``.metadata``, so it also reflects
any layer a project hook added, changed or removed on the populated catalog (``--include-hooks``).
"""

from __future__ import annotations

import logging
from typing import TYPE_CHECKING, Dict

from kedro_viz.integrations.kedro.inspection.builders.layers import _set_layer
from kedro_viz.integrations.utils import get_dataset_lite_safe

if TYPE_CHECKING:
    from kedro.io import DataCatalog
    from kedro.pipeline import Pipeline

logger = logging.getLogger(__name__)


def resolve_live_catalog_layers(
    catalog: DataCatalog, pipelines: Dict[str, Pipeline], is_lite: bool = False
) -> Dict[str, str]:
    """Return the kedro-viz layer for each dataset in a live, populated catalog.

    Materializes dataset factory pattern entries referenced by the pipelines first, so their
    metadata (and therefore layer) can be read: Kedro only resolves a pattern into a concrete
    dataset once something asks the catalog for it by name.

    Outside lite mode, a broken dataset (e.g. a missing kedro-datasets extra) raises here same
    as always; in lite mode it degrades to UnavailableDataset instead.

    Raises:
        ValueError: If transcoded variants of one dataset declare different layers.
    """
    _materialize_factory_datasets(catalog, pipelines, is_lite)

    layer_by_dataset_name: Dict[str, str] = {}
    for dataset_name in catalog.keys():
        dataset = get_dataset_lite_safe(catalog, dataset_name, is_lite)
        metadata = getattr(dataset, "metadata", None)
        if not metadata:
            continue
        try:
            layer = metadata["kedro-viz"]["layer"]
        except (AttributeError, KeyError):  # pragma: no cover
            logger.debug(
                "No layer info provided under metadata in the catalog for %s",
                dataset_name,
            )
            continue
        _set_layer(layer_by_dataset_name, dataset_name, layer)
    return layer_by_dataset_name


def _materialize_factory_datasets(
    catalog: DataCatalog, pipelines: Dict[str, Pipeline], is_lite: bool = False
) -> None:
    """Force factory-pattern catalog entries referenced by the pipelines to resolve."""
    all_datasets = {
        name for pipeline in pipelines.values() for name in pipeline.datasets()
    }
    for dataset_name in all_datasets:
        try:
            get_dataset_lite_safe(catalog, dataset_name, is_lite)
        except Exception:  # noqa: BLE001
            continue
