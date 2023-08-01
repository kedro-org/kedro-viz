import logging

from kedro.framework.hooks import hook_impl
from collections import defaultdict

logger = logging.getLogger(__name__)


class DatasetStatsHook:
    def __init__(self):
        self._stats = defaultdict(dict)

    @hook_impl
    def after_dataset_loaded(self, dataset_name, data):
        try:
            import pandas as pd

            if isinstance(data, pd.DataFrame):
                self._stats[dataset_name] = {}
                self._stats[dataset_name]["rows"] = int(data.shape[0])
                self._stats[dataset_name]["columns"] = int(data.shape[1])

        except Exception as e:
            logger.error(
                f"Error creating the stats for the dataset {dataset_name} : {e}"
            )

    @hook_impl
    def after_pipeline_run(self):
        try:
            import json

            with open("stats.json", "w") as f:
                json.dump(self._stats, f)

        except Exception as e:
            logger.error(f"Error writing the stats for the pipeline: {e}")


dataset_stats_hook = DatasetStatsHook()
