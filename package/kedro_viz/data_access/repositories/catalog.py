"""`kedro_viz.data_access.repositories.catalog` defines interface to
centralise access to Kedro data catalog."""
# pylint: disable=missing-class-docstring,missing-function-docstring,protected-access
import logging

from typing import Optional, List

from kedro.io import AbstractDataSet, DataCatalog, DataSetNotFoundError
from kedro_viz.api.graphql.types import TrackingDataset

from kedro_viz.constants import KEDRO_VERSION

from kedro.io.core import Version as DataSetVersion

logger = logging.getLogger(__name__)


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
                # Kedro 0.18.1 introduced the `suggest` argument to disable the expensive
                # fuzzy-matching process.
                if KEDRO_VERSION.match(">=0.18.1"):
                    dataset_obj = self._catalog._get_dataset(
                        dataset_name, suggest=False
                    )
                else:  # pragma: no cover
                    dataset_obj = self._catalog._get_dataset(dataset_name)
            except DataSetNotFoundError:  # pragma: no cover
                dataset_obj = None
        else:
            dataset_obj = self._catalog._data_sets.get(dataset_name)  # pragma: no cover
        return dataset_obj

    def get_layer_for_dataset(self, dataset_name: str) -> Optional[str]:
        return self.layers_mapping.get(self.strip_encoding(dataset_name))

    # TODO: test
    def get_tracking_dataset_by_run_ids(self, run_ids: List[str]):
        all_runs_for_all_datasets = {}
        for dataset_name, dataset in self.get_tracking_datasets():
            all_runs_for_one_dataset = {}
            for run_id in run_ids:
                # Set the load_version to run_id
                dataset._version = DataSetVersion(run_id, None)
                if dataset.exists():
                    data = dataset.load()
                    all_runs_for_one_dataset[run_id] = data
                else:
                    all_runs_for_one_dataset[run_id] = {}
                    logger.warning(
                        "'%s' with version '%s' could not be found",
                        dataset_name,
                        run_id,
                    )
            all_runs_for_all_datasets[dataset_name] = all_runs_for_one_dataset
            # TODO: define TrackingDatasetModel?
        return all_runs_for_all_datasets

    def get_tracking_datasets(self):
        return {
            dataset_name: dataset
            for dataset_name, dataset in self._catalog._data_sets.items()
            if self.is_tracking_dataset(dataset)
        }

    @staticmethod
    def is_tracking_dataset(dataset):
        # TODO: think about where this import goes
        from kedro.extras.datasets import tracking, json

        tracking.JSONDataSet.load = json.JSONDataSet.load
        tracking.MetricsDataSet.load = json.JSONDataSet.load

        return isinstance(dataset, (tracking.JSONDataSet, tracking.MetricsDataSet))

    @staticmethod
    def is_dataset_param(dataset_name: str) -> bool:
        """Return whether a dataset is a parameter"""
        return (
            dataset_name.lower().startswith("params:") or dataset_name == "parameters"
        )
