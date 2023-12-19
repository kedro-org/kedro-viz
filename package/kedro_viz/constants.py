"""`kedro_viz.constants` defines constants to be used throughout the application."""
import kedro
from packaging.version import parse

DEFAULT_REGISTERED_PIPELINE_ID = "__default__"
KEDRO_VERSION = parse(kedro.__version__)
ROOT_MODULAR_PIPELINE_ID = "__root__"

DEFAULT_HOST = "127.0.0.1"
DEFAULT_PORT = 4141

VIZ_DEPLOY_TIME_LIMIT = 60

AWS_REGIONS = [
    "us-east-2",
    "us-east-1",
    "us-west-1",
    "us-west-2",
    "af-south-1",
    "ap-east-1",
    "ap-south-2",
    "ap-southeast-3",
    "ap-southeast-4",
    "ap-south-1",
    "ap-northeast-3",
    "ap-northeast-2",
    "ap-southeast-1",
    "ap-southeast-2",
    "ap-northeast-1",
    "ca-central-1",
    "cn-north-1",
    "cn-northwest-1",
    "eu-central-1",
    "eu-west-1",
    "eu-west-2",
    "eu-south-1",
    "eu-west-3",
    "eu-north-1",
    "eu-south-2",
    "eu-central-2",
    "sa-east-1",
    "me-south-1",
    "me-central-1",
    "il-central-1",
]
