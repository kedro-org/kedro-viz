import re

import pytest

from kedro_viz.constants import SHAREABLEVIZ_SUPPORTED_PLATFORMS
from kedro_viz.integrations.deployment.aws_deployer import AWSDeployer
from kedro_viz.integrations.deployment.azure_deployer import AzureDeployer
from kedro_viz.integrations.deployment.deployer_factory import DeployerFactory
from kedro_viz.integrations.deployment.gcp_deployer import GCPDeployer
from kedro_viz.integrations.deployment.local_deployer import LocalDeployer


@pytest.mark.parametrize(
    "platform, endpoint, bucket_name, deployer_class",
    [
        ("aws", "http://mocked-url.com", "shareableviz", AWSDeployer),
        ("azure", "http://mocked-url.com", "shareableviz", AzureDeployer),
        ("gcp", "http://mocked-url.com", "shareableviz", GCPDeployer),
    ],
)
def test_create_deployer(platform, endpoint, bucket_name, deployer_class):
    deployer = DeployerFactory.create_deployer(platform, endpoint, bucket_name)
    assert isinstance(deployer, deployer_class)
    assert deployer._endpoint == endpoint
    assert deployer._bucket_name == bucket_name


def test_create_deployer_local():
    deployer = DeployerFactory.create_deployer("local")
    assert isinstance(deployer, LocalDeployer)


def test_create_deployer_invalid_platform():
    with pytest.raises(
        ValueError,
        match=re.escape(
            f"Invalid platform 'invalid_platform' specified. \n"
            f"Kedro-Viz supports the following platforms - {*SHAREABLEVIZ_SUPPORTED_PLATFORMS,}"
        ),
    ):
        DeployerFactory.create_deployer("invalid_platform")
