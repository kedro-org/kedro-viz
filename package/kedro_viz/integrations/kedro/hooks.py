import json
import logging
from collections import defaultdict
from pathlib import Path
from typing import Any, Union, Iterable, TYPE_CHECKING
import os

import fsspec

try:
    from multiprocessing.managers import SyncManager, BaseProxy
except ImportError:  # pragma: no cover
    SyncManager = None
    BaseProxy = None

from kedro.framework.hooks import hook_impl
from kedro.io import DataCatalog

if TYPE_CHECKING:
    from kedro.io.core import AbstractDataset
try:
    from kedro.io import KedroDataCatalog

    IS_KEDRODATACATALOG = True
except ImportError:
    KedroDataCatalog = None
    IS_KEDRODATACATALOG = False

from kedro_viz.constants import VIZ_METADATA_ARGS
from kedro_viz.launchers.utils import _find_kedro_project
from kedro_viz.utils import TRANSCODING_SEPARATOR, _strip_transcoding

logger = logging.getLogger(__name__)


class DatasetStatsHook:
    _shared_manager_for_parallel_runs: Union[SyncManager, None] = None
    _shared_stats_dict_for_parallel_runs: Union[dict, None] = None
    _main_process_catalog_for_filesize: Union[DataCatalog, "KedroDataCatalog", None] = None

    def __init__(self, shared_stats_proxy_from_parent: Union[dict, None] = None):
        current_pid = os.getpid()
        self._is_this_instance_using_shared_dict: bool = False

        if shared_stats_proxy_from_parent is not None and \
                BaseProxy is not None and isinstance(shared_stats_proxy_from_parent, BaseProxy):
            self._stats = shared_stats_proxy_from_parent
            self._is_this_instance_using_shared_dict = True
            logger.info(
                f"DSWH (PID:{current_pid}) __init__ (id:{id(self)}): Initialized WITH EXPLICIT shared_stats_proxy. "
                f"is_shared=True, stats_type={type(self._stats)}"
            )
        elif DatasetStatsHook._shared_stats_dict_for_parallel_runs is not None and \
                BaseProxy is not None and isinstance(DatasetStatsHook._shared_stats_dict_for_parallel_runs, BaseProxy):
            self._stats = DatasetStatsHook._shared_stats_dict_for_parallel_runs
            self._is_this_instance_using_shared_dict = True
            logger.info(
                f"DSWH (PID:{current_pid}) __init__ (id:{id(self)}): Initialized using CLASS shared_stats proxy. "
                f"is_shared=True, stats_type={type(self._stats)}"
            )
        else:
            self._stats = defaultdict(dict)
            self._is_this_instance_using_shared_dict = False
            logger.info(
                f"DSWH (PID:{current_pid}) __init__ (id:{id(self)}): Initialized with LOCAL defaultdict. "
                f"is_shared=False, stats_type={type(self._stats)}"
            )
        self.datasets: dict[str, "AbstractDataset"] = {}

    @staticmethod
    def _get_basic_dataframe_stats(data_object: Any) -> dict:
        stats = {}
        try:
            import pandas as pd
            if isinstance(data_object, pd.DataFrame):
                stats["rows"], stats["columns"] = int(data_object.shape[0]), int(data_object.shape[1])
            elif isinstance(data_object, pd.Series):
                stats["rows"], stats["columns"] = int(data_object.shape[0]), 1
        except ImportError:  # pragma: no cover
            logger.debug("DSWH: Pandas not found.")
        except Exception as e:  # pragma: no cover
            logger.warning(f"DSWH: Error df/series stats: {e}")
        return stats

    @staticmethod
    def _get_dataset_file_size(dataset_obj: Any, dataset_name_for_log: str) -> Union[int, None]:
        current_pid = os.getpid()
        try:
            filepath_str = None
            if hasattr(dataset_obj, "protocol") and hasattr(dataset_obj, "_filepath") and dataset_obj._filepath:
                try:
                    from kedro.io.core import get_filepath_str
                    filepath_str = get_filepath_str(
                        str(dataset_obj._filepath), str(dataset_obj.protocol))
                except ImportError:  # pragma: no cover
                    logger.debug(f"DSWH (PID:{current_pid}): Cannot import get_fp_str for {dataset_name_for_log}.")
            if not filepath_str:
                if hasattr(dataset_obj, "_filepath") and dataset_obj._filepath:
                    filepath_str = str(dataset_obj._filepath)
                elif hasattr(dataset_obj, "filepath") and dataset_obj.filepath:  # pragma: no cover
                    filepath_str = str(dataset_obj.filepath)
                else:  # pragma: no cover
                    return None
            if not filepath_str: return None  # pragma: no cover
            fs, path_in_fs = fsspec.core.url_to_fs(filepath_str)
            if fs.exists(path_in_fs): return fs.size(path_in_fs)  # pragma: no cover
            return None  # pragma: no cover
        except Exception:  # pragma: no cover
            return None

    @hook_impl
    def on_parallel_runner_start(self, manager: SyncManager,
                                 catalog: Union[DataCatalog, "KedroDataCatalog"]):
        if not SyncManager: return  # pragma: no cover
        pid = os.getpid()
        logger.info(
            f"DSWH (PID:{pid}) on_parallel_runner_start (on instance id:{id(self)}): Setting CLASS and INSTANCE shared attributes.")

        if DatasetStatsHook._shared_manager_for_parallel_runs is None:
            DatasetStatsHook._shared_manager_for_parallel_runs = manager
            DatasetStatsHook._shared_stats_dict_for_parallel_runs = manager.dict()
            logger.info(
                f"DSWH (PID:{pid}): CLASS _shared_stats_dict_for_parallel_runs type set to: {type(DatasetStatsHook._shared_stats_dict_for_parallel_runs)}")

        DatasetStatsHook._main_process_catalog_for_filesize = catalog

        self._stats = DatasetStatsHook._shared_stats_dict_for_parallel_runs
        self._is_this_instance_using_shared_dict = True
        logger.info(
            f"DSWH (PID:{pid}) Main hook instance (id:{id(self)}) re-configured after on_parallel_runner_start. "
            f"is_shared={self._is_this_instance_using_shared_dict}, stats_type={type(self._stats)}")

    @hook_impl
    def after_catalog_created(self, catalog: Union[DataCatalog, "KedroDataCatalog"]):
        pid = os.getpid()
        logger.debug(f"DSWH (PID:{pid}): after_catalog_created for instance {id(self)}. Populating self.datasets.")
        try:
            if IS_KEDRODATACATALOG and isinstance(catalog, KedroDataCatalog):  # pragma: no cover
                self.datasets = catalog.datasets
            elif hasattr(catalog, "_datasets"):
                self.datasets = catalog._datasets
            elif hasattr(catalog, "_data_sets"):  # pragma: no cover
                self.datasets = catalog._data_sets
            else:  # pragma: no cover
                self.datasets = {}
            logger.info(
                f"DSWH (PID:{pid}): self.datasets populated for instance {id(self)}. Length: {len(self.datasets)}.")
        except Exception as exc:  # pragma: no cover
            logger.warning(f"DSWH (PID:{pid}): Error accessing datasets for instance {id(self)}: {exc}")
            self.datasets = {}

    def _get_target_stats_dict(self, current_pid_for_log: int) -> Union[dict, defaultdict, None]:
        if self._is_this_instance_using_shared_dict:
            if BaseProxy is not None and isinstance(self._stats, BaseProxy):
                logger.debug(
                    f"DSWH (PID:{current_pid_for_log}) _get_target_stats_dict on instance {id(self)}: Using SHARED (instance flag True, _stats is BaseProxy). Type: {type(self._stats)}")
                return self._stats
            else:  # pragma: no cover
                logger.error(
                    f"DSWH (PID:{current_pid_for_log}) _get_target_stats_dict on instance {id(self)}: Instance marked shared, but self._stats is NOT BaseProxy (Type: {type(self._stats)}). INCONSISTENT!")
                return None
        else:
            logger.warning(
                f"DSWH (PID:{current_pid_for_log}) _get_target_stats_dict on instance {id(self)}: Using LOCAL (instance flag False). Type: {type(self._stats)}")
            return self._stats

    def _collect_and_store_stats(self, dataset_name: str, data: Any):
        current_pid = os.getpid()
        target_stats_dict = self._get_target_stats_dict(current_pid)

        if target_stats_dict is None:  # pragma: no cover
            logger.error(
                f"DSWH (PID:{current_pid}): target_stats_dict is None for {dataset_name} on instance {id(self)}. CANNOT COLLECT STATS.")
            return

        if not hasattr(self, 'datasets') or self.datasets is None:  # pragma: no cover
            logger.error(
                f"DSWH (PID {current_pid}): self.datasets MISSING from hook instance {id(self)} for {dataset_name}! Re-initializing.")
            self.datasets = {}

        stats_dataset_name = self.get_stats_dataset_name(dataset_name)
        new_stats_for_ds_key = DatasetStatsHook._get_basic_dataframe_stats(data)

        dataset_obj_for_filesize = self.datasets.get(dataset_name)

        # Check if running in child context for file size lookup
        is_shared_mode_for_file_lookup = self._is_this_instance_using_shared_dict

        if not dataset_obj_for_filesize and is_shared_mode_for_file_lookup and DatasetStatsHook._main_process_catalog_for_filesize:
            # This fallback might be less reliable with spawn/forkserver due to _main_process_catalog_for_filesize class attr
            # However, self.datasets (populated by child's after_catalog_created) should be the primary source in child.
            logger.debug(
                f"DSWH (PID:{current_pid}): '{dataset_name}' not in self.datasets (len {len(self.datasets)}), trying main catalog for fs.")
            try:  # pragma: no cover
                if DatasetStatsHook._main_process_catalog_for_filesize.exists(dataset_name):
                    dataset_obj_for_filesize = DatasetStatsHook._main_process_catalog_for_filesize._get_dataset(
                        dataset_name)
            except Exception as e:  # pragma: no cover
                logger.warning(
                    f"DSWH (PID:{current_pid}): Error accessing main catalog for '{dataset_name}' for file size: {e}")

        if dataset_obj_for_filesize:
            file_size = DatasetStatsHook._get_dataset_file_size(dataset_obj_for_filesize, dataset_name)
            if file_size is not None:
                new_stats_for_ds_key["file_size"] = file_size
        elif new_stats_for_ds_key:  # Only log if there were other stats, to avoid noise for non-data datasets
            logger.debug(f"DSWH (PID:{current_pid}): No dataset object for '{dataset_name}' for file size.")

        if new_stats_for_ds_key:
            existing_stats_for_ds_key = {}
            if stats_dataset_name in target_stats_dict:
                try:
                    existing_stats_for_ds_key = dict(target_stats_dict[stats_dataset_name])
                except Exception as e:  # pragma: no cover
                    logger.warning(
                        f"DSWH (PID:{current_pid}): Error retrieving existing for '{stats_dataset_name}': {e}")

            existing_stats_for_ds_key.update(new_stats_for_ds_key)
            target_stats_dict[stats_dataset_name] = existing_stats_for_ds_key
            logger.info(
                f"DSWH (PID:{current_pid}): Updated stats for '{stats_dataset_name}'. Target dict type: {type(target_stats_dict)}.")
        else:  # pragma: no cover
            logger.debug(f"DSWH (PID:{current_pid}): No new stats to update for {stats_dataset_name}.")

    @hook_impl
    def after_dataset_loaded(self, dataset_name: str, data: Any):
        logger.debug(f"DSWH (PID:{os.getpid()}) after_dataset_loaded for {dataset_name} on instance {id(self)}.")
        self._collect_and_store_stats(dataset_name, data)

    @hook_impl
    def after_dataset_saved(self, dataset_name: str, data: Any):
        logger.debug(f"DSWH (PID:{os.getpid()}) after_dataset_saved for {dataset_name} on instance {id(self)}.")
        self._collect_and_store_stats(dataset_name, data)

    @hook_impl
    def after_pipeline_run(self):
        pid = os.getpid()
        logger.info(
            f"DSWH (PID:{pid}): after_pipeline_run on instance {id(self)}. self._is_shared={self._is_this_instance_using_shared_dict}, self._stats type={type(self._stats)}")
        try:
            kedro_project_path = _find_kedro_project(Path.cwd())
            if not kedro_project_path: logger.warning("DSWH: No Kedro project."); return  # pragma: no cover
            stats_file_path = kedro_project_path / VIZ_METADATA_ARGS['path'] / "stats.json"
            stats_file_path.parent.mkdir(parents=True, exist_ok=True)
            final_stats_to_dump = {}

            # Access self._stats which should be the shared dict proxy if in parallel mode correctly configured
            # or the local dict if not.
            if BaseProxy is not None and isinstance(self._stats, BaseProxy):
                logger.debug("DSWH: Finalizing from SHARED (BaseProxy from self._stats of main instance).")
                final_stats_to_dump = dict(self._stats)  # Convert proxy to dict for JSON dump
            elif isinstance(self._stats, (defaultdict, dict)):
                logger.debug("DSWH: Finalizing from LOCAL (self._stats is dict/defaultdict).")
                final_stats_to_dump = self._stats  # Already a dict or defaultdict
            else:  # pragma: no cover
                logger.error(f"DSWH: self._stats unexpected type {type(self._stats)}.");
                return

            with stats_file_path.open("w", encoding="utf8") as file:
                sorted_stats_data = {k: self.format_stats(v) for k, v in final_stats_to_dump.items()}
                json.dump(sorted_stats_data, file)
            logger.info(f"DSWH: Stats saved to {stats_file_path}")
            if not final_stats_to_dump: logger.warning("DSWH: Stats file empty.")  # pragma: no cover
        except Exception as exc:  # pragma: no cover
            logger.warning("DSWH: Error writing stats: %s", exc, exc_info=True)

    def format_stats(self, stats: dict) -> dict:
        sort_order = ["rows", "columns", "file_size"]
        return {s: stats.get(s) for s in sort_order if s in stats}

    def get_stats_dataset_name(self, dataset_name: str) -> str:
        return _strip_transcoding(dataset_name) if TRANSCODING_SEPARATOR in dataset_name else dataset_name

    @hook_impl
    def get_picklable_hook_implementations_for_subprocess(self) -> Iterable[Any] | None:
        pid = os.getpid()
        shared_proxy_to_pass = DatasetStatsHook._shared_stats_dict_for_parallel_runs

        if shared_proxy_to_pass is not None and \
                BaseProxy is not None and isinstance(shared_proxy_to_pass, BaseProxy):
            logger.info(
                f"DSWH (PID:{pid}) get_picklable_hook_implementations_for_subprocess (on instance id:{id(self)}): "
                f"CLASS shared_stats_dict is a proxy. Providing a NEW instance for subprocess, passing proxy explicitly."
            )
            hook_for_child = DatasetStatsHook(shared_stats_proxy_from_parent=shared_proxy_to_pass)

            logger.info(
                f"DSWH (PID:{pid}) Instance FOR CHILD (id:{id(hook_for_child)}) PREPARED in main process: "
                f"is_shared={hook_for_child._is_this_instance_using_shared_dict}, "
                f"stats_type={type(hook_for_child._stats)}"
            )
            return [hook_for_child]
        elif shared_proxy_to_pass is not None:  # pragma: no cover
            logger.warning(
                f"DSWH (PID:{pid}) get_picklable_hook_implementations_for_subprocess: "
                f"Class shared_dict is NOT a BaseProxy (type: {type(shared_proxy_to_pass)}). "
                "This might happen if it's the initial defaultdict. "
                "Not providing hook, as shared state seems incorrectly configured for child."
            )
            return None
        else:  # pragma: no cover
            logger.warning(
                f"DSWH (PID:{pid}) get_picklable_hook_implementations_for_subprocess: Class shared_dict is None. "
                "Not providing hook (this might be okay if not in parallel mode or if this hook shouldn't run in child)."
            )
            return None


dataset_stats_hook = DatasetStatsHook()
