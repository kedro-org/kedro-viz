"""`kedro_viz.integrations.deployment.deployer_factory` creates
Kedro-viz deployer class instances"""

from kedro_viz.integrations.deployment.local_deployer import LocalDeployer
from kedro_viz.integrations.deployment.s3_deployer import S3Deployer


class DeployerFactory:
    """A class to handle creation of deployer class instances."""

    @staticmethod
    def create_deployer(platform, region=None, bucket_name=None):
        """Instantiate Kedro-viz deployer classes"""
        if platform == "s3":
            return S3Deployer(region, bucket_name)
        if platform == "local":
            return LocalDeployer()
        raise ValueError(f"Invalid platform '{platform}' specified")
