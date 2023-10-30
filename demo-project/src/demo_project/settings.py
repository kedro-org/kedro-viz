"""Project settings."""
# List the installed plugins for which to disable auto-registry
# DISABLE_HOOKS_FOR_PLUGINS = ("kedro-viz",)

from pathlib import Path

# Define where to store data from a KedroSession. Defaults to BaseSessionStore.
# from kedro.framework.session.store import ShelveStore
from kedro_viz.integrations.kedro.sqlite_store import SQLiteStore

SESSION_STORE_CLASS = SQLiteStore
SESSION_STORE_ARGS = {"path": str(Path(__file__).parents[2] / "data")}

# Setup for collaborative experiment tracking.
# SESSION_STORE_ARGS = {"path": str(Path(__file__).parents[2] / "data"),
#                       "remote_path": "s3://{path-to-session_store}" }

# Define custom context class. Defaults to `KedroContext`
# CONTEXT_CLASS = KedroContext

# Define the configuration folder. Defaults to `conf`
# CONF_ROOT = "conf"

from kedro.config import OmegaConfigLoader  # NOQA

CONFIG_LOADER_CLASS = OmegaConfigLoader
