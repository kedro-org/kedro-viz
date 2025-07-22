"""`kedro_viz.data_access.repositories.catalog` defines interface to
centralise access to Kedro data catalog."""

import logging
from typing import Optional

from kedro.io import DataCatalog, DatasetNotFoundError, MemoryDataset
from kedro.io.core import AbstractDataset
from packaging.version import parse

from kedro_viz.constants import KEDRO_VERSION
from kedro_viz.utils import TRANSCODING_SEPARATOR, _strip_transcoding

logger = logging.getLogger(__name__)


class CatalogRepository:
    _catalog: DataCatalog

    def __init__(self):
        self._layers_mapping = None

    def get_catalog(self) -> DataCatalog:
        return self._catalog

    def set_catalog(self, value: DataCatalog):
        self._catalog = value

    def _validate_layers_for_transcoding(self, dataset_name, layer):
        existing_layer = self._layers_mapping.get(dataset_name)
        if existing_layer is not None and existing_layer != layer:
            raise ValueError(
                "Transcoded datasets should have the same layer. "
                "Please ensure consistent layering in your Kedro catalog. "
                f"Mismatch found for: {dataset_name}"
            )

    @property
    def layers_mapping(self):  # noqa: PLR0912
        """Return layer mapping: dataset_name -> layer it belongs to in the catalog.
        metadata:
            kedro-viz:
                layer: raw
        """
        if self._layers_mapping is not None:
            return self._layers_mapping

        self._layers_mapping = {}

        datasets = self._catalog.keys()
        for dataset_name in datasets:
            dataset = self._catalog.get(dataset_name)

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
            else:
                if TRANSCODING_SEPARATOR in dataset_name:
                    dataset_name = _strip_transcoding(dataset_name)
                    self._validate_layers_for_transcoding(dataset_name, layer)
                self._layers_mapping[dataset_name] = layer

        return self._layers_mapping

    def get_dataset(self, dataset_name: str) -> "AbstractDataset":
        dataset_obj = self._catalog.get(dataset_name)
        return dataset_obj or MemoryDataset()

    def get_layer_for_dataset(self, dataset_name: str) -> Optional[str]:
        return self.layers_mapping.get(_strip_transcoding(dataset_name))
