"""`kedro_viz.integrations.kedro.hooks` defines hooks to add additional
functionalities for a kedro run."""

import json
import logging
import os
from collections import defaultdict
from pathlib import Path
from typing import TYPE_CHECKING, Any, Iterable, Union

import fsspec
from kedro.framework.hooks import hook_impl
from kedro.io import DataCatalog

from kedro_viz.constants import VIZ_METADATA_ARGS
from kedro_viz.launchers.utils import _find_kedro_project
from kedro_viz.utils import TRANSCODING_SEPARATOR, _strip_transcoding

if TYPE_CHECKING:
    from kedro.io.core import AbstractDataset

try:
    from multiprocessing.managers import BaseProxy, SyncManager
except ImportError:  # pragma: no cover
    SyncManager = None
    BaseProxy = None

try:  # pragma: no cover
    from kedro.io import KedroDataCatalog

    IS_KEDRODATACATALOG = True
except ImportError:  # pragma: no cover
    KedroDataCatalog = None  # type: ignore
    IS_KEDRODATACATALOG = False

from kedro.io.core import get_filepath_str

logger = logging.getLogger(__name__)


class DatasetStatsHook:
    """Class to collect dataset statistics during a kedro run
    and save it to a JSON file. The class currently supports
    (pd.DataFrame) dataset instances"""

    # Class attributes for shared state in parallel runs
    _shared_manager_for_parallel_runs: Union[SyncManager, None] = None
    _shared_stats_dict_for_parallel_runs: Union[dict, None] = None
    _main_process_catalog_for_filesize: Union[DataCatalog, "KedroDataCatalog", None] = None

    def __init__(self, shared_stats_proxy_from_parent: Union[dict, None] = None):
        self._is_this_instance_using_shared_dict: bool = False

        # If explicitly passed a shared proxy from parent, use it
        if shared_stats_proxy_from_parent is not None and \
                BaseProxy is not None and isinstance(shared_stats_proxy_from_parent, BaseProxy):
            self._stats = shared_stats_proxy_from_parent
            self._is_this_instance_using_shared_dict = True
            logger.debug("DatasetStatsHook initialized with explicit shared_stats_proxy")
        # Otherwise check if class-level shared dict is available
        elif DatasetStatsHook._shared_stats_dict_for_parallel_runs is not None and \
                BaseProxy is not None and isinstance(DatasetStatsHook._shared_stats_dict_for_parallel_runs, BaseProxy):
            self._stats = DatasetStatsHook._shared_stats_dict_for_parallel_runs
            self._is_this_instance_using_shared_dict = True
            logger.debug("DatasetStatsHook initialized using class shared_stats proxy")
        # Fall back to local defaultdict
        else:
            self._stats = defaultdict(dict)
            self._is_this_instance_using_shared_dict = False
            logger.debug("DatasetStatsHook initialized with local defaultdict")

        self.datasets: dict[str, "AbstractDataset"] = {}

    @hook_impl
    def on_parallel_runner_start(self, manager: SyncManager, catalog: Union[DataCatalog, "KedroDataCatalog"]):
        """Hook to be invoked by ParallelRunner to share the SyncManager and catalog."""
        if not SyncManager:
            return

        logger.info("DatasetStatsHook: Setting up shared state for parallel execution")

        # Set up class-level shared resources
        if DatasetStatsHook._shared_manager_for_parallel_runs is None:
            DatasetStatsHook._shared_manager_for_parallel_runs = manager
            DatasetStatsHook._shared_stats_dict_for_parallel_runs = manager.dict()
            logger.debug("Created shared stats dictionary for parallel runs")

        DatasetStatsHook._main_process_catalog_for_filesize = catalog

        # Update this instance to use the shared dict
        self._stats = DatasetStatsHook._shared_stats_dict_for_parallel_runs
        self._is_this_instance_using_shared_dict = True

    @hook_impl
    def after_catalog_created(self, catalog: Union[DataCatalog, "KedroDataCatalog"]):
        """Hooks to be invoked after a data catalog is created.

        Args:
            catalog: The catalog that was created.
        """
        # Check for KedroDataCatalog first (DataCatalog 2.0)
        try:
            if IS_KEDRODATACATALOG and isinstance(catalog, KedroDataCatalog):
                self.datasets = (
                    catalog.datasets
                )  # This gives access to both lazy normal datasets
                logger.debug("Using KedroDataCatalog for dataset statistics collection")
            # For original DataCatalog
            elif hasattr(catalog, "_datasets"):
                self.datasets = catalog._datasets
            else:
                # Support for older Kedro versions
                self.datasets = catalog._data_sets  # type: ignore
        except Exception as exc:  # pragma: no cover
            logger.warning("Unable to access datasets in catalog: %s", exc)
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

            # Get the stats to dump - convert proxy to dict if needed
            if BaseProxy is not None and isinstance(self._stats, BaseProxy):
                logger.debug("Converting shared stats proxy to dict for JSON dump")
                final_stats = dict(self._stats)
            else:
                final_stats = self._stats

            with stats_file_path.open("w", encoding="utf8") as file:
                sorted_stats_data = {
                    dataset_name: self.format_stats(stats)
                    for dataset_name, stats in final_stats.items()
                }
                json.dump(sorted_stats_data, file)

            logger.info(f"Dataset statistics saved to {stats_file_path}")

        except Exception as exc:  # pragma: no cover
            logger.warning(
                "Unable to write dataset statistics for the pipeline: %s", exc
            )

    @hook_impl
    def get_picklable_hook_implementations_for_subprocess(self) -> Iterable[Any] | None:
        """Provide a picklable hook instance for ParallelRunner subprocesses."""
        shared_proxy = DatasetStatsHook._shared_stats_dict_for_parallel_runs

        if shared_proxy is not None and \
                BaseProxy is not None and isinstance(shared_proxy, BaseProxy):
            logger.debug("Providing new DatasetStatsHook instance for subprocess with shared proxy")
            # Create a new instance that will use the shared proxy
            hook_for_child = DatasetStatsHook(shared_stats_proxy_from_parent=shared_proxy)
            return [hook_for_child]
        else:
            logger.debug("No shared proxy available, not providing hook for subprocess")
            return None

    def create_dataset_stats(self, dataset_name: str, data: Any):
        """Helper method to create dataset statistics.
        Currently supports (pd.DataFrame) dataset instances.

        Args:
            dataset_name: The dataset name for which we need the statistics
            data: Actual data that is loaded/saved to the catalog

        """
        try:
            import pandas as pd

            stats_dataset_name = self.get_stats_dataset_name(dataset_name)
            target_stats_dict = self._get_target_stats_dict()

            if target_stats_dict is None:
                logger.error(f"Cannot collect stats for {dataset_name} - no stats dict available")
                return

            if isinstance(data, pd.DataFrame):
                new_stats = {
                    "rows": int(data.shape[0]),
                    "columns": int(data.shape[1])
                }

                # Try to get file size
                current_dataset = self._get_dataset_for_filesize(dataset_name)
                if current_dataset:
                    file_size = self.get_file_size(current_dataset)
                    if file_size is not None:
                        new_stats["file_size"] = file_size

                # Update stats
                if stats_dataset_name in target_stats_dict:
                    existing_stats = dict(target_stats_dict[stats_dataset_name])
                    existing_stats.update(new_stats)
                    target_stats_dict[stats_dataset_name] = existing_stats
                else:
                    target_stats_dict[stats_dataset_name] = new_stats

                logger.debug(f"Updated stats for dataset '{stats_dataset_name}'")

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

        Returns:
            File size for the dataset if available, otherwise None.
        """
        try:
            filepath = None
            # Try to get filepath using standard method
            if hasattr(dataset, "protocol") and hasattr(dataset, "_filepath") and dataset._filepath:
                filepath = get_filepath_str(dataset._filepath, dataset.protocol)
            # Fallback to direct filepath access
            elif hasattr(dataset, "_filepath") and dataset._filepath:
                filepath = str(dataset._filepath)
            elif hasattr(dataset, "filepath") and dataset.filepath:
                filepath = str(dataset.filepath)
            else:
                return None

            if not filepath:
                return None

            fs, path_in_fs = fsspec.core.url_to_fs(filepath)
            if fs.exists(path_in_fs):
                file_size = fs.size(path_in_fs)
                return file_size
            else:
                return None

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

    def _get_target_stats_dict(self) -> Union[dict, defaultdict, None]:
        """Get the appropriate stats dictionary based on whether we're in parallel mode."""
        return self._stats

    def _get_dataset_for_filesize(self, dataset_name: str) -> Any:
        """Get dataset object for file size calculation."""
        # First try local datasets
        dataset = self.datasets.get(dataset_name)

        # If not found locally and we're in parallel mode, try main catalog
        if not dataset and self._is_this_instance_using_shared_dict and \
                DatasetStatsHook._main_process_catalog_for_filesize:
            try:
                catalog = DatasetStatsHook._main_process_catalog_for_filesize
                if catalog.exists(dataset_name):
                    dataset = catalog._get_dataset(dataset_name)
            except Exception as e:
                logger.warning(
                    f"Error accessing main catalog for '{dataset_name}' file size: {e}"
                )

        return dataset


dataset_stats_hook = DatasetStatsHook()
