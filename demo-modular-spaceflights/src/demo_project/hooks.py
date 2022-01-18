"""Project hooks."""
import logging
import time
from typing import Any, Dict, Iterable, Optional

from kedro.config import TemplatedConfigLoader
from kedro.framework.hooks import hook_impl
from kedro.io import DataCatalog
from kedro.versioning import Journal


class ProjectHooks:
    @hook_impl
    def register_config_loader(
        self, conf_paths: Iterable[str], env: str, extra_params: Dict[str, Any]
    ) -> TemplatedConfigLoader:
        return TemplatedConfigLoader(
            conf_paths, globals_pattern="*globals.yml", globals_dict={}
        )

    @hook_impl
    def register_catalog(
        self,
        catalog: Optional[Dict[str, Dict[str, Any]]],
        credentials: Dict[str, Dict[str, Any]],
        load_versions: Dict[str, str],
        save_version: str,
        journal: Journal,
    ) -> DataCatalog:
        return DataCatalog.from_config(
            catalog, credentials, load_versions, save_version, journal
        )


class TimingHooks:
    """
    This class is designed to highlight how hooks can be added
    to the lifecycle of a Kedro run. You can read more here:
    https://kedro.readthedocs.io/en/latest/07_extend_kedro/02_hooks.html
    """

    def __init__(self) -> None:
        """This constructor is used to hold state between different parts
        of the dataset loading lifecycle
        """
        self._load_start = 0
        self._load_end = 0

    def _start_timing(self):
        """Set time operation starts"""
        self._load_start = time.time()

    def _stop_timing(self):
        """Set time operation ends"""
        self._load_end = time.time()

    @property
    def current_duration(self) -> float:
        """Get the delta between the two timestamps"""
        return self._load_end - self._load_start

    @property
    def _logger(self):
        """Utility property to get a named logger"""
        return logging.getLogger(self.__class__.__name__)

    @hook_impl
    def before_dataset_loaded(self, dataset_name: str) -> None:
        """Start timing when dataset starts loading"""
        self._start_timing()

    @hook_impl
    def after_dataset_loaded(self, dataset_name: str, data: Any) -> None:
        """Stop timing once in memory and report duration"""
        self._stop_timing()
        message = self._humanise_duration(self.current_duration)
        self._logger.info("Dataset '%s' took %s to load ⏳", dataset_name, message)

    @staticmethod
    def _humanise_duration(current_duration: float) -> str:
        """Convert timedelta to human readable string"""
        duration = round(current_duration)
        if duration <= 1:
            message = "less than a second"
        elif duration > 1 and duration < 60:
            message = f"{duration} seconds"
        else:
            message = f"{round(duration/60)} seconds"
        return message
