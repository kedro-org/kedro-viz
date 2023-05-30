"""`kedro_viz.data_access.repositories.catalog` defines interface to
centralise access to Kedro data catalog."""
# pylint: disable=missing-class-docstring,missing-function-docstring,protected-access
from collections import defaultdict
from typing import Dict, Optional, Set

from kedro.io import AbstractDataSet, DataCatalog, DataSetNotFoundError, MemoryDataSet

from kedro_viz.constants import KEDRO_VERSION


class CatalogRepository:
    _catalog: DataCatalog

    def __init__(self):
        self._layers_mapping = None

    def get_catalog(self) -> DataCatalog:
        return self._catalog

    def set_catalog(self, value: DataCatalog):
        self._catalog = value

    def get_layers(self) -> Optional[Dict[str, Set[str]]]:
        """
        This method retrieves the layers from the catalog. For kedro-datasets versions before 1.3.0,
        the 'layers' attribute is defined directly in the catalog.

        From kedro-datasets 1.3.0 onwards, the 'layers' attribute is defined inside the 'metadata'
        under 'kedro-viz' plugin.

        Catalog before kedro-datasets 1.3.0:
            type: pandas.CSVDataSet
            filepath: /filepath/to/dataset
            layers: raw

        Catalog from kedro-datasets 1.3.0 onwards:
            type: pandas.CSVDataSet
            filepath: /filepath/to/dataset
            metadata:
                kedro-viz:
                    layers: raw

        Currently, Kedro up to 18.x and kedro-viz up to 6.x support both formats.
        However, support for the old format will be discontinued from Kedro 19.x and kedro-viz
        7.x onwards.
        It's recommended to follow the newest format for defining layers in the catalog.
        """
        if self._catalog.layers:
            return self._catalog.layers

        layers: Dict[str, Set[str]] = defaultdict(set)

        for dataset_name in self._catalog._data_sets:
            dataset = self._catalog._get_dataset(dataset_name)

            if hasattr(dataset, "metadata"):
                metadata = dataset.metadata or {}
                dataset_layer = metadata.get("kedro-viz", {}).get("layer")
                if dataset_layer:
                    layers[dataset_layer].add(dataset_name)
        return layers or None

    @staticmethod
    def strip_encoding(dataset_name: str) -> str:
        return dataset_name.split("@")[0]

    @property
    def layers_mapping(self):
        """Return layer mapping: dataset_full_name -> layer it belongs to in the catalog"""

        if self._layers_mapping is not None:
            return self._layers_mapping

        layers = self.get_layers()

        if layers is None:
            self._layers_mapping = {
                self.strip_encoding(dataset_name): None
                for dataset_name in self._catalog._data_sets
            }
        else:
            self._layers_mapping = {}
            for layer, dataset_names in layers.items():
                self._layers_mapping.update(
                    {
                        self.strip_encoding(dataset_name): layer
                        for dataset_name in dataset_names
                    }
                )
        return self._layers_mapping

    def get_dataset(self, dataset_name: str) -> Optional[AbstractDataSet]:
        dataset_obj: Optional[AbstractDataSet]
        try:
            # Kedro 0.18.1 introduced the `suggest` argument to disable the expensive
            # fuzzy-matching process.
            if KEDRO_VERSION.match(">=0.18.1"):
                dataset_obj = self._catalog._get_dataset(dataset_name, suggest=False)
            else:  # pragma: no cover
                dataset_obj = self._catalog._get_dataset(dataset_name)
        except DataSetNotFoundError:
            dataset_obj = MemoryDataSet()

        return dataset_obj

    def get_layer_for_dataset(self, dataset_name: str) -> Optional[str]:
        return self.layers_mapping.get(self.strip_encoding(dataset_name))

    def as_dict(self) -> Dict[str, Optional[AbstractDataSet]]:
        return {
            dataset_name: self.get_dataset(dataset_name)
            for dataset_name in self._catalog.list()
            if self.get_dataset(dataset_name) is not None
        }

    @staticmethod
    def is_dataset_param(dataset_name: str) -> bool:
        """Return whether a dataset is a parameter"""
        return (
            dataset_name.lower().startswith("params:") or dataset_name == "parameters"
        )
