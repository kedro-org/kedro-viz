"""`kedro_viz.data_access.repositories.catalog` defines interface to
centralise access to Kedro data catalog."""
# pylint: disable=missing-class-docstring,missing-function-docstring,protected-access
from typing import Optional

from kedro.io import AbstractDataSet, DataCatalog, DataSetNotFoundError

from kedro_viz.constants import KEDRO_VERSION


class CatalogRepository:
    _catalog: DataCatalog

    def __init__(self):
        self._layers_mapping = None

    def get_catalog(self) -> DataCatalog:
        return self._catalog

    def set_catalog(self, value: DataCatalog):
        self._catalog = value

    @staticmethod
    def strip_encoding(dataset_name: str) -> str:
        return dataset_name.split("@")[0]

    @property
    def layers_mapping(self):
        """Return layer mapping: dataset_full_name -> layer it belongs to in the catalog"""
        if self._layers_mapping is not None:
            return self._layers_mapping

        if self._catalog.layers is None:
            self._layers_mapping = {
                self.strip_encoding(dataset_name): None
                for dataset_name in self._catalog._data_sets
            }
        else:
            self._layers_mapping = {}
            for layer, dataset_names in self._catalog.layers.items():
                self._layers_mapping.update(
                    {
                        self.strip_encoding(dataset_name): layer
                        for dataset_name in dataset_names
                    }
                )
        return self._layers_mapping

    def get_dataset(self, dataset_name: str) -> Optional[AbstractDataSet]:
        dataset_obj: Optional[AbstractDataSet]
        if KEDRO_VERSION.match(">=0.16.0"):
            try:
                dataset_obj = self._catalog._get_dataset(dataset_name)
            except DataSetNotFoundError:  # pragma: no cover
                dataset_obj = None
        else:
            dataset_obj = self._catalog._data_sets.get(dataset_name)  # pragma: no cover
        return dataset_obj

    def get_layer_for_dataset(self, dataset_name: str) -> Optional[str]:
        return self.layers_mapping.get(self.strip_encoding(dataset_name))

    @staticmethod
    def is_dataset_param(dataset_name: str) -> bool:
        """Return whether a dataset is a parameter"""
        return (
            dataset_name.lower().startswith("params:") or dataset_name == "parameters"
        )
