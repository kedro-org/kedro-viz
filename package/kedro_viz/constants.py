"""`kedro_viz.constants` defines constants to be used throughout the application."""

import kedro
from packaging.version import parse

DEFAULT_REGISTERED_PIPELINE_ID = "__default__"
KEDRO_VERSION = parse(kedro.__version__)
ROOT_MODULAR_PIPELINE_ID = "__root__"

DEFAULT_HOST = "127.0.0.1"
DEFAULT_PORT = 4141

VIZ_DEPLOY_TIME_LIMIT = 300

SHAREABLEVIZ_SUPPORTED_PLATFORMS = ["aws", "azure", "gcp"]

PACKAGE_REQUIREMENTS = {
    "fsspec": {
        "min_compatible_version": "2023.9.0",
        "warning_message": "Publish and share Kedro-Viz requires fsspec >= 2023.9.0",
    },
    "kedro-datasets": {
        "min_compatible_version": "2.1.0",
        "warning_message": "Experiment Tracking is exclusively supported "
        "for users with kedro-datasets >= 2.1.0",
    },
}

VIZ_SESSION_STORE_ARGS = {"path": ".viz"}
VIZ_METADATA_ARGS = {"path": ".viz"}
