"""Project settings."""
# List the installed plugins for which to disable auto-registry
# DISABLE_HOOKS_FOR_PLUGINS = ("kedro-viz",)

from pathlib import Path

from traitlets import default

# Define where to store data from a KedroSession. Defaults to BaseSessionStore.
# from kedro.framework.session.store import ShelveStore
from kedro_viz.integrations.kedro.sqlite_store import SQLiteStore

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
            self._stats[dataset_name]["filesize"] = int(data.size)
            self._stats[dataset_name]["columns"] = int(data.shape[1])
            self._stats[dataset_name]["rows"] = int(data.shape[0])

            print(data)
    @hook_impl
    def after_pipeline_run(self):
        import json
        with open("stats.json", "w") as f:
            json.dump(self._stats, f)



dataset_stats_hook = DatasetStatsHook()
HOOKS = (dataset_stats_hook,)
SESSION_STORE_CLASS = SQLiteStore
SESSION_STORE_ARGS = {"path": str(Path(__file__).parents[2] / "data")}

# Setup for collaborative experiment tracking.
# SESSION_STORE_ARGS = {"path": str(Path(__file__).parents[2] / "data"),
#                       "remote_path": "s3://{path-to-session_store}" }

# Define custom context class. Defaults to `KedroContext`
# CONTEXT_CLASS = KedroContext

# Define the configuration folder. Defaults to `conf`
# CONF_ROOT = "conf"

from kedro.config import TemplatedConfigLoader  # NOQA

CONFIG_LOADER_CLASS = TemplatedConfigLoader
CONFIG_LOADER_ARGS = {"globals_pattern": "*globals.yml", "globals_dict": {}}
