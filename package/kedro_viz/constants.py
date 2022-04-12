"""`kedro_viz.constants` defines constants to be used throughout the application."""
import kedro
from semver import VersionInfo

DEFAULT_REGISTERED_PIPELINE_ID = "__default__"
KEDRO_VERSION = VersionInfo.parse(kedro.__version__)
ROOT_MODULAR_PIPELINE_ID = "__root__"
