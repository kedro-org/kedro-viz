from kedro.framework.hooks import hook_impl
from collections import defaultdict


class DatasetStatsHook:
    def __init__(self):
        self._stats = defaultdict(dict)

    @hook_impl
    def after_context_created(self, context):
        self._catalog = context.catalog

    @hook_impl
    def after_dataset_loaded(self, dataset_name, data):
        import pandas as pd

        if isinstance(data, pd.DataFrame):
            self._stats[dataset_name] = {}
            self._stats[dataset_name]["rows"] = int(data.shape[0])
            self._stats[dataset_name]["columns"] = int(data.shape[1])
            self._stats[dataset_name]["file_size"] = int(data.size)
           

            print(data)

    @hook_impl
    def after_pipeline_run(self):
        import json

        with open("stats.json", "w") as f:
            json.dump(self._stats, f)


dataset_stats_hook = DatasetStatsHook()
