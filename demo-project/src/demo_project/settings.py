"""Project settings."""
# List the installed plugins for which to disable auto-registry
# DISABLE_HOOKS_FOR_PLUGINS = ("kedro-viz",)

# Define custom context class. Defaults to `KedroContext`
# CONTEXT_CLASS = KedroContext

# Define the configuration folder. Defaults to `conf`
# CONF_ROOT = "conf"

from kedro.config import OmegaConfigLoader  # NOQA

CONFIG_LOADER_CLASS = OmegaConfigLoader
