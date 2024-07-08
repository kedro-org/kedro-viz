"""`kedro_viz.data_access.repositories.catalog` defines interface to
centralise access to Kedro data catalog."""

# pylint: disable=missing-class-docstring,missing-function-docstring,protected-access
import logging
from typing import TYPE_CHECKING, Dict, Optional

from kedro.io import DataCatalog
from packaging.version import parse

from kedro_viz.constants import KEDRO_VERSION
from kedro_viz.utils import TRANSCODING_SEPARATOR, _strip_transcoding

try:
    # kedro 0.18.11 onwards
    from kedro.io import DatasetNotFoundError, MemoryDataset
except ImportError:  # pragma: no cover
    # older versions
    from kedro.io import DataSetNotFoundError as DatasetNotFoundError  # type: ignore
    from kedro.io import MemoryDataSet as MemoryDataset  # type: ignore

if TYPE_CHECKING:
    try:
        # kedro 0.18.12 onwards
        from kedro.io.core import AbstractDataset
    except ImportError:
        # older versions
        from kedro.io.core import AbstractDataSet as AbstractDataset  # type: ignore

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
    def layers_mapping(self):
        # pylint: disable=too-many-branches
        """Return layer mapping: dataset_name -> layer it belongs to in the catalog
        From kedro-datasets 1.3.0 onwards, the 'layers' attribute is defined inside the 'metadata'
        under 'kedro-viz' plugin.

        Catalog before kedro-datasets 1.3.0:
            type: pandas.CSVDataset
            filepath: /filepath/to/dataset
            layers: raw

        Catalog from kedro-datasets 1.3.0 onwards:
            type: pandas.CSVDataset
            filepath: /filepath/to/dataset
            metadata:
                kedro-viz:
                    layer: raw

        Currently, Kedro up to 18.x supports both formats. However,
        support for the old format will be discontinued from Kedro 19.x.
        Kedro-viz will continue to support both formats.
        It's recommended to follow the newest format for defining layers in the catalog.
        """
        if self._layers_mapping is not None:
            return self._layers_mapping

        self._layers_mapping = {}

        # Temporary try/except block so the Kedro develop branch can work with Viz.
        try:
            datasets = self._catalog._data_sets
        # pylint: disable=broad-exception-caught
        except Exception:  # pragma: no cover
            datasets = self._catalog._datasets

        # Support for Kedro 0.18.x
        if KEDRO_VERSION < parse("0.19.0"):  # pragma: no cover
            if self._catalog.layers is None:
                self._layers_mapping = {
                    _strip_transcoding(dataset_name): None for dataset_name in datasets
                }
            else:
                for layer, dataset_names in self._catalog.layers.items():
                    for dataset_name in dataset_names:
                        if TRANSCODING_SEPARATOR in dataset_name:
                            dataset_name = _strip_transcoding(dataset_name)
                            self._validate_layers_for_transcoding(dataset_name, layer)
                        self._layers_mapping[dataset_name] = layer

        for dataset_name in datasets:
            dataset = self._catalog._get_dataset(dataset_name)
            metadata = getattr(dataset, "metadata", None)
            if not metadata:
                continue
            try:
                layer = dataset.metadata["kedro-viz"]["layer"]
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

    def get_dataset(self, dataset_name: str) -> Optional["AbstractDataset"]:
        dataset_obj: Optional["AbstractDataset"]
        try:
            # Kedro 0.18.1 introduced the `suggest` argument to disable the expensive
            # fuzzy-matching process.
            if KEDRO_VERSION >= parse("0.18.1"):
                dataset_obj = self._catalog._get_dataset(dataset_name, suggest=False)
            else:  # pragma: no cover
                dataset_obj = self._catalog._get_dataset(dataset_name)
        except DatasetNotFoundError:
            dataset_obj = MemoryDataset()

        return dataset_obj

    def get_layer_for_dataset(self, dataset_name: str) -> Optional[str]:
        return self.layers_mapping.get(_strip_transcoding(dataset_name))

    def as_dict(self) -> Dict[str, Optional["AbstractDataset"]]:
        return {
            dataset_name: self.get_dataset(dataset_name)
            for dataset_name in self._catalog.list()
            if self.get_dataset(dataset_name) is not None
        }
