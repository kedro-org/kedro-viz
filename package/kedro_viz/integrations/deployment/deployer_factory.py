"""`kedro_viz.integrations.deployment.deployer_factory` creates
Kedro-viz deployer class instances"""

from kedro_viz.constants import SHAREABLEVIZ_SUPPORTED_PLATFORMS
from kedro_viz.integrations.deployment.aws_deployer import AWSDeployer
from kedro_viz.integrations.deployment.azure_deployer import AzureDeployer
from kedro_viz.integrations.deployment.gcp_deployer import GCPDeployer
from kedro_viz.integrations.deployment.local_deployer import LocalDeployer


class DeployerFactory:
    """A class to handle creation of deployer class instances."""

    @staticmethod
    def create_deployer(platform, endpoint=None, bucket_name=None):
        """Instantiate Kedro-viz deployer classes"""
        platform_name = platform.lower()
        if platform_name == "aws":
            return AWSDeployer(endpoint, bucket_name)
        if platform_name == "azure":
            return AzureDeployer(endpoint, bucket_name)
        if platform_name == "gcp":
            return GCPDeployer(endpoint, bucket_name)
        if platform_name == "local":
            return LocalDeployer()
        raise ValueError(
            f"Invalid platform '{platform}' specified. \n"
            f"Kedro-Viz supports the following platforms - {*SHAREABLEVIZ_SUPPORTED_PLATFORMS,}"
        )
