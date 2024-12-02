"""Project settings."""
# List the installed plugins for which to disable auto-registry
# DISABLE_HOOKS_FOR_PLUGINS = ("kedro-viz",)

from kedro.config import OmegaConfigLoader  # NOQA

CONFIG_LOADER_CLASS = OmegaConfigLoader
