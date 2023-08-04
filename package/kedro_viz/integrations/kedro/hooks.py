# pylint: disable=broad-exception-caught
# pylint: disable=protected-access
"""`kedro_viz.integrations.kedro.hooks` defines hooks to add additional
functionalities for a kedro run."""

import json as json_lib
import logging
import sys
from collections import defaultdict
from typing import Any

import pandas as pd
from kedro.framework.hooks import hook_impl
from kedro.io import DataCatalog

from kedro_viz.integrations.kedro.utils import stats_order
from kedro_viz.models.utils import get_file_size

try:
    # kedro 0.18.11 onwards
    from kedro.io import MemoryDataset
except ImportError:  # pragma: no cover
    # older versions
    from kedro.io import MemoryDataSet as MemoryDataset

logger = logging.getLogger(__name__)


class DatasetStatsHook:
    """Class to collect dataset statistics during a kedro run
    and save it to a JSON file. The class currently supports
    (pd.DataFrame, list, dict and pd.core.series.Series) dataset instances"""

    def __init__(self):
        self._stats = defaultdict(dict)

    @hook_impl
    def after_catalog_created(self, catalog: DataCatalog):
        """Hook to be invoked after a data catalog is created.
        Use this hook and get the file_size for the dataset if it has filepath.

        Args:
            catalog: The catalog that was created.
        """
        try:
            datasets = catalog._data_sets

            for dataset_name, dataset in datasets.items():
                if not isinstance(dataset, MemoryDataset):
                    file_path = dataset._filepath  # noqa: no-member
                    self._stats[dataset_name]["file_size"] = get_file_size(file_path)

        except Exception as exc:  # pragma: no cover
            logger.warning(
                "Unable to process file_size stat for the dataset %s : %s",
                dataset_name,
                exc,
            )

    @hook_impl
    def after_dataset_loaded(self, dataset_name: str, data: Any):
        """Hook to be invoked after a dataset is loaded from the catalog.
        Once the dataset is loaded, extract the required dataset statistics.
        The hook currently supports (pd.DataFrame, list, dict and pd.core.series.Series)
        dataset instances

        Args:
            dataset_name: name of the dataset that was saved to the catalog.
            data: the actual data that was saved to the catalog.
        """
        try:
            if isinstance(data, pd.DataFrame):
                self._stats[dataset_name]["rows"] = int(data.shape[0])
                self._stats[dataset_name]["columns"] = int(data.shape[1])
            elif isinstance(data, (list, dict)):
                self._stats[dataset_name]["rows"] = int(len(data))
                self._stats[dataset_name]["file_size"] = sys.getsizeof(data)
            elif isinstance(data, pd.core.series.Series):
                self._stats[dataset_name]["rows"] = int(len(data))
                self._stats[dataset_name]["file_size"] = data.memory_usage(deep=True)

        except Exception as exc:  # pragma: no cover
            logger.warning(
                "Error creating the stats for the dataset %s : %s", dataset_name, exc
            )

    @hook_impl
    def after_pipeline_run(self):
        """Hook to be invoked after a pipeline runs.
        Once the pipeline run completes, write the dataset
        statistics to stats.json file

        """
        try:
            with open("stats.json", "w", encoding="utf8") as file:
                sorted_stats_data = {
                    dataset_name: stats_order(stats)
                    for dataset_name, stats in self._stats.items()
                }
                json_lib.dump(sorted_stats_data, file)

        except Exception as exc:  # pragma: no cover
            logger.warning("Error writing the stats for the pipeline: %s", exc)


dataset_stats_hook = DatasetStatsHook()
