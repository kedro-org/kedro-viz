# pylint: disable=broad-exception-caught, protected-access
"""`kedro_viz.integrations.kedro.hooks` defines hooks to add additional
functionalities for a kedro run."""

import json
import logging
from collections import defaultdict
from pathlib import Path, PurePosixPath
from typing import Any, Union

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
    (pd.DataFrame) dataset instances"""

    def __init__(self):
        self._stats = defaultdict(dict)

    @hook_impl
    def after_catalog_created(self, catalog: DataCatalog):
        """Hooks to be invoked after a data catalog is created.

        Args:
            catalog: The catalog that was created.
        """
        # Temporary try/except block so the Kedro develop branch can work with Viz.
        try:
            self.datasets = catalog._datasets
        except Exception:  # pragma: no cover
            # Support for Kedro 0.18.x
            self.datasets = catalog._data_sets  # type: ignore[attr-defined]

    @hook_impl
    def after_dataset_loaded(self, dataset_name: str, data: Any):
        """Hook to be invoked after a dataset is loaded from the catalog.
        Once the dataset is loaded, extract the required dataset statistics.
        The hook currently supports (pd.DataFrame) dataset instances

        Args:
            dataset_name: name of the dataset that was loaded from the catalog.
            data: the actual data that was loaded from the catalog.
        """

        self.create_dataset_stats(dataset_name, data)

    @hook_impl
    def after_dataset_saved(self, dataset_name: str, data: Any):
        """Hook to be invoked after a dataset is saved to the catalog.
        Once the dataset is saved, extract the required dataset statistics.
        The hook currently supports (pd.DataFrame) dataset instances

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
        Currently supports (pd.DataFrame) dataset instances.

        Args:
            dataset_name: The dataset name for which we need the statistics
            data: Actual data that is loaded/saved to the catalog

        """
        try:
            import pandas as pd  # pylint: disable=import-outside-toplevel

            stats_dataset_name = self.get_stats_dataset_name(dataset_name)

            if isinstance(data, pd.DataFrame):
                self._stats[stats_dataset_name]["rows"] = int(data.shape[0])
                self._stats[stats_dataset_name]["columns"] = int(data.shape[1])

                current_dataset = self.datasets.get(dataset_name, None)

                if current_dataset:
                    self._stats[stats_dataset_name]["file_size"] = self.get_file_size(
                        current_dataset
                    )

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
        """Helper method to return the file size of a dataset

        Args:
            dataset: A dataset instance for which we need the file size

        Returns: file size for the dataset if file_path is valid, if not returns None
        """

        if not (hasattr(dataset, "_filepath") and dataset._filepath):
            return None

        try:
            file_path = get_filepath_str(
                PurePosixPath(dataset._filepath), dataset._protocol
            )
            return dataset._fs.size(file_path)

        except Exception as exc:
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
        sort_order = ["rows", "columns", "file_size"]
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
