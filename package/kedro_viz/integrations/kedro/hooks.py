"""`kedro_viz.integrations.kedro.hooks` defines hooks to add additional
functionalities for a kedro run."""

import json
import logging
from collections import defaultdict
from pathlib import Path
from typing import Any, Union

import fsspec
from kedro.framework.hooks import hook_impl
from kedro.io import DataCatalog
from kedro.io.core import get_filepath_str

from kedro_viz.constants import VIZ_METADATA_ARGS
from kedro_viz.launchers.utils import _find_kedro_project
from kedro_viz.utils import TRANSCODING_SEPARATOR, _strip_transcoding

logger = logging.getLogger(__name__)


class DatasetStatsHook:
    """Class to collect dataset statistics during a kedro run
    and save it to a JSON file. The class currently supports
    (pd.DataFrame) dataset instances and dictionaries of
    (pd.DataFrame) instances"""

    def __init__(self):
        self._stats = defaultdict(dict)

    @hook_impl
    def after_catalog_created(self, catalog: DataCatalog):
        try:
            self.datasets = catalog
        except Exception as exc:  # pragma: no cover
            logger.warning("Unable to access datasets in catalog: %s", exc)
            self.datasets = DataCatalog({})

    @hook_impl
    def after_dataset_loaded(self, dataset_name: str, data: Any):
        """Hook to be invoked after a dataset is loaded from the catalog.
        Once the dataset is loaded, extract the required dataset statistics.
        The hook currently supports (pd.DataFrame) dataset instances and
        dictionaries of (pd.DataFrame) instances

        Args:
            dataset_name: name of the dataset that was loaded from the catalog.
            data: the actual data that was loaded from the catalog.
        """

        self.create_dataset_stats(dataset_name, data)

    @hook_impl
    def after_dataset_saved(self, dataset_name: str, data: Any):
        """Hook to be invoked after a dataset is saved to the catalog.
        Once the dataset is saved, extract the required dataset statistics.
        The hook currently supports (pd.DataFrame) dataset instances and
        dictionaries of (pd.DataFrame) instances

        Args:
            dataset_name: name of the dataset that was saved to the catalog.
            data: the actual data that was saved to the catalog.
        """

        self.create_dataset_stats(dataset_name, data)

    @hook_impl
    def after_pipeline_run(self):
        """Hook to be invoked after a pipeline runs.
        Once the pipeline run completes, write the dataset
        statistics to stats.json file

        """
        try:
            kedro_project_path = _find_kedro_project(Path.cwd())

            if not kedro_project_path:
                logger.warning("Could not find a Kedro project to create stats file")
                return

            stats_file_path = Path(
                f"{kedro_project_path}/{VIZ_METADATA_ARGS['path']}/stats.json"
            )
            stats_file_path.parent.mkdir(parents=True, exist_ok=True)

            with stats_file_path.open("w", encoding="utf8") as file:
                sorted_stats_data = {
                    dataset_name: self.format_stats(stats)
                    for dataset_name, stats in self._stats.items()
                }
                json.dump(sorted_stats_data, file)

        except Exception as exc:  # pragma: no cover
            logger.warning(
                "Unable to write dataset statistics for the pipeline: %s", exc
            )

    def create_dataset_stats(self, dataset_name: str, data: Any):
        """Helper method to create dataset statistics.
        Currently supports (pd.DataFrame) dataset instances and dictionaries
        of (pd.DataFrame) instances, such as those returned by partitioned
        datasets (PartitionedDataset/IncrementalDataset) and multi-sheet Excel
        datasets. For dictionaries, the number of partitions/sheets, the total
        number of rows and, when every partition/sheet has the same number of
        columns, the number of columns are reported.

        Args:
            dataset_name: The dataset name for which we need the statistics
            data: Actual data that is loaded/saved to the catalog

        """
        try:
            import pandas as pd

            stats_dataset_name = self.get_stats_dataset_name(dataset_name)

            if isinstance(data, pd.DataFrame):
                self._stats[stats_dataset_name]["rows"] = int(data.shape[0])
                self._stats[stats_dataset_name]["columns"] = int(data.shape[1])

            elif isinstance(data, dict) and data:
                # PartitionedDataset returns a dict of lazy partition loaders
                # while multi-sheet Excel returns a dict of DataFrames.
                dataframes = [
                    value() if callable(value) else value for value in data.values()
                ]
                if not all(
                    isinstance(dataframe, pd.DataFrame) for dataframe in dataframes
                ):
                    return

                self._stats[stats_dataset_name]["partitions"] = len(dataframes)
                self._stats[stats_dataset_name]["rows"] = sum(
                    int(dataframe.shape[0]) for dataframe in dataframes
                )

                column_counts = {int(dataframe.shape[1]) for dataframe in dataframes}
                if len(column_counts) == 1:
                    self._stats[stats_dataset_name]["columns"] = column_counts.pop()

            else:
                return

            current_dataset = self.datasets.get(dataset_name)

            if current_dataset:
                dataset_file_size = self.get_file_size(current_dataset)
                if dataset_file_size:
                    self._stats[stats_dataset_name]["file_size"] = dataset_file_size

        except ImportError as exc:  # pragma: no cover
            logger.warning(
                "Unable to import dependencies to extract dataset statistics for %s : %s",
                dataset_name,
                exc,
            )
        except Exception as exc:  # pragma: no cover
            logger.warning(
                "[hook: after_dataset_saved] Unable to create statistics for the dataset %s : %s",
                dataset_name,
                exc,
            )

    def get_file_size(self, dataset: Any) -> Union[int, None]:
        """Helper method to return the file size of a dataset.
        For datasets backed by a single file the size of that file is returned.
        For directory-backed datasets, such as partitioned datasets, the sizes
        of all the files in the directory are summed.

        Args:
            dataset: A dataset instance for which we need the file size

        Returns:
            File size for the dataset if available, otherwise None.
        """
        try:
            if hasattr(dataset, "filepath") and dataset.filepath:
                filepath = dataset.filepath
            # Fallback to private '_filepath' for known datasets
            elif hasattr(dataset, "_filepath") and dataset._filepath:
                filepath = dataset._filepath
            # Partitioned datasets expose their directory path instead
            elif hasattr(dataset, "path") and dataset.path:
                filepath = dataset.path
            elif hasattr(dataset, "_path") and dataset._path:
                filepath = dataset._path
            else:
                return None

            fs, path_in_fs = fsspec.core.url_to_fs(str(filepath))
            if not fs.exists(path_in_fs):
                return None

            if fs.isdir(path_in_fs):
                return fs.du(path_in_fs, total=True)

            return fs.size(path_in_fs)

        except Exception as exc:  # pragma: no cover
            logger.warning(
                "Unable to get file size for the dataset %s: %s", dataset, exc
            )
            return None

    def format_stats(self, stats: dict) -> dict:
        """Sort the stats extracted from the datasets using the sort order

        Args:
            stats: A dictionary of statistics for a dataset

        Returns: A sorted dictionary based on the sort_order
        """
        # Custom sort order
        sort_order = ["partitions", "rows", "columns", "file_size"]
        return {stat: stats.get(stat) for stat in sort_order if stat in stats}

    def get_stats_dataset_name(self, dataset_name: str) -> str:
        """Get the dataset name for assigning stat values in the dictionary.
        If the dataset name contains transcoded information, strip the transcoding.

        Args:
            dataset_name: name of the dataset

        Returns: Dataset name without any transcoding information
        """

        stats_dataset_name = dataset_name

        # Strip transcoding
        is_transcoded_dataset = TRANSCODING_SEPARATOR in dataset_name
        if is_transcoded_dataset:
            stats_dataset_name = _strip_transcoding(dataset_name)

        return stats_dataset_name


dataset_stats_hook = DatasetStatsHook()
