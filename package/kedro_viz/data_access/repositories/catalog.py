"""`kedro_viz.data_access.repositories.catalog` defines interface to
centralise access to Kedro data catalog."""
# pylint: disable=missing-class-docstring,missing-function-docstring,protected-access
from typing import Optional
from unittest.mock import patch

from kedro.io import (
    AbstractDataSet,
    AbstractVersionedDataSet,
    DataCatalog,
    DataSetNotFoundError,
    Version,
)

from kedro_viz.constants import KEDRO_VERSION

# Kedro-Viz doesn't need to know the close matches for missing datasets,
# and `difflib.get_close_matches` is too costly if performed repeatedly.
# Before Kedro 0.18.1, use the `_get_dataset` method without the verbose
# error introduced in https://github.com/kedro-org/kedro/commit/f7dd247.
if KEDRO_VERSION.match(">=0.16.0") and KEDRO_VERSION.match("<0.18.1"):

    def _get_dataset(
        self, data_set_name: str, version: Version = None
    ) -> AbstractDataSet:
        if data_set_name not in self._data_sets:
            raise DataSetNotFoundError(
                "DataSet '{}' not found in the catalog".format(data_set_name)
            )

        data_set = self._data_sets[data_set_name]
        if version and isinstance(
            data_set, AbstractVersionedDataSet
        ):  # pragma: no cover
            # we only want to return a similar-looking dataset,
            # not modify the one stored in the current catalog
            data_set = data_set._copy(  # pylint: disable=protected-access
                _version=version
            )

        return data_set


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
                if KEDRO_VERSION.match(">=0.18.1"):  # pragma: no cover
                    dataset_obj = self._catalog._get_dataset(  # type: ignore
                        dataset_name, suggest=False
                    )
                else:
                    with patch.object(DataCatalog, "_get_dataset", new=_get_dataset):
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
