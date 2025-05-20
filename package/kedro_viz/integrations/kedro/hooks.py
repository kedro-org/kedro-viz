"""`kedro_viz.integrations.kedro.hooks` defines hooks to add additional
functionalities for a kedro run."""

import json
import logging
from collections import defaultdict
from pathlib import Path
from typing import Any, Union
import os

import fsspec
try:
    from multiprocessing.managers import SyncManager, BaseProxy # type: ignore
except ImportError:  # pragma: no cover
    SyncManager = None # type: ignore
    BaseProxy = None # type: ignore

from kedro.framework.hooks import hook_impl
from kedro.io import DataCatalog

try:  # pragma: no cover
    from kedro.io import KedroDataCatalog

    IS_KEDRODATACATALOG = True
except ImportError:  # pragma: no cover
    KedroDataCatalog = None  # type: ignore
    IS_KEDRODATACATALOG = False

from kedro.io.core import get_filepath_str

from kedro_viz.constants import VIZ_METADATA_ARGS
from kedro_viz.launchers.utils import _find_kedro_project
from kedro_viz.utils import TRANSCODING_SEPARATOR, _strip_transcoding

logger = logging.getLogger(__name__)


class DatasetStatsHook:
    """Class to collect dataset statistics during a kedro run
    and save it to a JSON file. The class currently supports
    (pd.DataFrame) dataset instances"""

    _shared_manager_for_parallel_runs: Union[SyncManager, None] = None
    _shared_stats_dict_for_parallel_runs: Union[dict, None] = None
    _parallel_run_initiated_by_main_process: bool = False

    def __init__(self):
        self._is_configured_for_parallel_run: bool = False
        current_pid = os.getpid() # For logging

        if DatasetStatsHook._parallel_run_initiated_by_main_process and \
           DatasetStatsHook._shared_stats_dict_for_parallel_runs is not None:
            self._stats = DatasetStatsHook._shared_stats_dict_for_parallel_runs
            self._is_configured_for_parallel_run = True
            logger.debug(
                "DatasetStatsHook instance (PID: %s) configured to use SHARED stats dictionary.",
                current_pid,
            )
        else:
            self._stats = defaultdict(dict)
            logger.debug(
                "DatasetStatsHook instance (PID: %s) configured to use LOCAL stats dictionary.",
                current_pid,
            )
        self.datasets = {}

    @hook_impl
    def on_parallel_runner_start(self, manager: SyncManager): # type: ignore
        if not SyncManager: # pragma: no cover
            logger.warning("DatasetStatsHook: SyncManager not available. Parallel stats sharing disabled.")
            return

        logger.info("DatasetStatsHook (PID: %s): on_parallel_runner_start called. Initializing shared stats.", os.getpid())
        DatasetStatsHook._shared_manager_for_parallel_runs = manager
        DatasetStatsHook._shared_stats_dict_for_parallel_runs = manager.dict() # type: ignore
        DatasetStatsHook._parallel_run_initiated_by_main_process = True

        self._stats = DatasetStatsHook._shared_stats_dict_for_parallel_runs
        self._is_configured_for_parallel_run = True
        logger.info("DatasetStatsHook (PID: %s): Main process instance configured with shared stats dict.", os.getpid())

    @hook_impl
    def after_catalog_created(self, catalog: Union[DataCatalog, "KedroDataCatalog"]):
        """Hooks to be invoked after a data catalog is created.

        Args:
            catalog: The catalog that was created.
        """
        # Check for KedroDataCatalog first (DataCatalog 2.0)
        logger.debug("DatasetStatsHook (PID: %s): after_catalog_created called.", os.getpid())
        try:
            if IS_KEDRODATACATALOG and isinstance(catalog, KedroDataCatalog):
                self.datasets = catalog.datasets
            elif hasattr(catalog, "_datasets"): # type: ignore
                self.datasets = catalog._datasets # type: ignore
            elif hasattr(catalog, "_data_sets"): # type: ignore
                self.datasets = catalog._data_sets # type: ignore
            else:
                self.datasets = {}
            if not self.datasets:
                logger.debug("DatasetStatsHook (PID: %s): 'catalog.datasets' is empty after catalog creation.", os.getpid())
        except Exception as exc:  # pragma: no cover
            logger.warning("DatasetStatsHook (PID: %s): Unable to access datasets in catalog: %s", os.getpid(), exc)
            self.datasets = {}

    @hook_impl
    def after_dataset_loaded(self, dataset_name: str, data: Any):
        """Hook to be invoked after a dataset is loaded from the catalog.
        Once the dataset is loaded, extract the required dataset statistics.
        The hook currently supports (pd.DataFrame) dataset instances

        Args:
            dataset_name: name of the dataset that was loaded from the catalog.
            data: the actual data that was loaded from the catalog.
        """
        logger.debug("DatasetStatsHook (PID: %s): after_dataset_loaded for %s.", os.getpid(), dataset_name)
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
        logger.debug("DatasetStatsHook (PID: %s): after_dataset_saved for %s.", os.getpid(), dataset_name)
        self.create_dataset_stats(dataset_name, data)

    @hook_impl
    def after_pipeline_run(self):
        """Hook to be invoked after a pipeline runs.
        Once the pipeline run completes, write the dataset
        statistics to stats.json file

        """
        logger.info("DatasetStatsHook (PID: %s): after_pipeline_run called.", os.getpid())
        try:
            kedro_project_path = _find_kedro_project(Path.cwd())

            if not kedro_project_path:
                logger.warning("DatasetStatsHook: Could not find Kedro project. Cannot save stats.")
                return

            stats_file_path = Path(f"{kedro_project_path}/{VIZ_METADATA_ARGS['path']}/stats.json")
            stats_file_path.parent.mkdir(parents=True, exist_ok=True)

            final_stats_to_dump = {}
            if self._is_configured_for_parallel_run and BaseProxy is not None and isinstance(self._stats, BaseProxy):
                logger.debug("DatasetStatsHook: Converting shared (BaseProxy) stats to dict for JSON dump.")
                final_stats_to_dump = dict(self._stats) # type: ignore
            elif isinstance(self._stats, (defaultdict, dict)):
                logger.debug("DatasetStatsHook: Using local (dict/defaultdict) stats for JSON dump.")
                final_stats_to_dump = self._stats
            else:
                logger.error(f"DatasetStatsHook: _stats is of unexpected type {type(self._stats)}. Cannot dump stats.")
                return

            with stats_file_path.open("w", encoding="utf8") as file:
                sorted_stats_data = {
                    dataset_name: self.format_stats(stats_data)
                    for dataset_name, stats_data in final_stats_to_dump.items()
                }
                json.dump(sorted_stats_data, file)
            logger.info(f"DatasetStatsHook: Dataset statistics saved to {stats_file_path}")

        except Exception as exc:  # pragma: no cover
            logger.warning("DatasetStatsHook: Unable to write dataset statistics: %s", exc, exc_info=True)

    def create_dataset_stats(self, dataset_name: str, data: Any):
        """Helper method to create dataset statistics.
        Currently supports (pd.DataFrame) dataset instances.

        Args:
            dataset_name: The dataset name for which we need the statistics
            data: Actual data that is loaded/saved to the catalog

        """
        current_pid = os.getpid()
        logger.debug(f"DatasetStatsHook (PID {current_pid}): create_dataset_stats for {dataset_name}. Using stats type: {type(self._stats)}")
        try:
            import pandas as pd

            stats_dataset_name = self.get_stats_dataset_name(dataset_name)

            current_dataset_node_stats = {}
            if self._is_configured_for_parallel_run:
                if self._stats is not None and stats_dataset_name in self._stats: # type: ignore
                    current_dataset_node_stats = self._stats[stats_dataset_name] # type: ignore # Retrieves a copy for modification
                else:
                    current_dataset_node_stats = {}
            elif isinstance(self._stats, defaultdict):
                current_dataset_node_stats = self._stats[stats_dataset_name]

            if isinstance(data, pd.DataFrame):
                current_dataset_node_stats["rows"] = int(data.shape[0])
                current_dataset_node_stats["columns"] = int(data.shape[1])

            current_dataset_obj = self.datasets.get(dataset_name)
            if current_dataset_obj:
                file_size = self.get_file_size(current_dataset_obj, dataset_name)
                if file_size is not None:
                    current_dataset_node_stats["file_size"] = file_size
            elif "file_size" not in current_dataset_node_stats :
                 logger.debug(
                    "DatasetStatsHook (PID %s): Dataset object for '%s' not found in local cache. File size not recorded by this instance.",
                     current_pid, dataset_name
                 )

            if current_dataset_node_stats and self._stats is not None:
                logger.debug(f"DatasetStatsHook (PID {current_pid}): Updating stats for {stats_dataset_name} with {current_dataset_node_stats}")
                self._stats[stats_dataset_name] = current_dataset_node_stats # type: ignore
            elif not current_dataset_node_stats:
                logger.debug(f"DatasetStatsHook (PID {current_pid}): No stats to update for {stats_dataset_name}.")


        except ImportError:  # pragma: no cover
            logger.debug("DatasetStatsHook (PID %s): pandas not found. Cannot collect DataFrame stats for %s.", current_pid, dataset_name)
        except Exception as exc:  # pragma: no cover
            logger.warning(
                "DatasetStatsHook (PID %s): Error creating stats for dataset '%s': %s", current_pid, dataset_name, exc, exc_info=True
            )

    def get_file_size(self, dataset: Any, dataset_name_for_log: str) -> Union[int, None]:
        """Helper method to return the file size of a dataset

        Args:
            dataset: A dataset instance for which we need the file size

        Returns:
            File size for the dataset if available, otherwise None.
        """
        current_pid = os.getpid()
        try:
            filepath_str = None
            # Attempt to use get_filepath_str for datasets with protocol and _filepath
            if hasattr(dataset, "protocol") and hasattr(dataset, "_filepath") and dataset._filepath:
                try:
                    from kedro.io.core import get_filepath_str # Import locally
                    filepath_str = get_filepath_str(str(dataset._filepath), str(dataset.protocol))
                except ImportError: # pragma: no cover
                    logger.warning("DatasetStatsHook (PID %s): Could not import get_filepath_str. Trying direct filepath attributes for %s.", current_pid, dataset_name_for_log)

            # Fallback to direct filepath attributes if get_filepath_str wasn't used or failed
            if not filepath_str:
                if hasattr(dataset, "_filepath") and dataset._filepath:
                    filepath_str = str(dataset._filepath)
                elif hasattr(dataset, "filepath") and dataset.filepath:
                    filepath_str = str(dataset.filepath)
                else:
                    logger.debug("DatasetStatsHook (PID %s): Dataset %s (%s) has no recognized filepath attribute.", current_pid, dataset_name_for_log, type(dataset).__name__)
                    return None

            if not filepath_str:
                logger.debug("DatasetStatsHook (PID %s): Resolved filepath is empty for dataset %s.", current_pid, dataset_name_for_log)
                return None

            logger.debug("DatasetStatsHook (PID %s): Attempting to get size for %s at %s", current_pid, dataset_name_for_log, filepath_str)
            fs, path_in_fs = fsspec.core.url_to_fs(filepath_str) # type: ignore
            if fs.exists(path_in_fs):
                file_size = fs.size(path_in_fs)
                logger.debug("DatasetStatsHook (PID %s): File size for %s is %s.", current_pid, dataset_name_for_log, file_size)
                return file_size
            else:
                logger.debug("DatasetStatsHook (PID %s): Filepath %s does not exist for dataset %s.", current_pid, path_in_fs, dataset_name_for_log)
                return None
        except Exception as exc: # pragma: no cover
            logger.warning("DatasetStatsHook (PID %s): Error getting file size for %s (%s): %s", current_pid, dataset_name_for_log, type(dataset).__name__, exc, exc_info=True)
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


        return _strip_transcoding(dataset_name) if TRANSCODING_SEPARATOR in dataset_name else dataset_name

dataset_stats_hook = DatasetStatsHook()
