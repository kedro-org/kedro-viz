"""`kedro_viz.constants` defines constants to be used throughout the application."""
import kedro
from packaging.version import parse

DEFAULT_REGISTERED_PIPELINE_ID = "__default__"
KEDRO_VERSION = parse(kedro.__version__)
ROOT_MODULAR_PIPELINE_ID = "__root__"

DEFAULT_HOST = "127.0.0.1"
DEFAULT_PORT = 4141
