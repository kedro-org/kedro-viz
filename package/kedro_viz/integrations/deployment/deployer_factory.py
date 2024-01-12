from kedro_viz.integrations.deployment import LocalDeployer, S3Deployer


class DeployerFactory:
    @staticmethod
    def create_deployer(platform, region=None, bucket_name=None):
        if platform == "s3":
            return S3Deployer(region, bucket_name)
        elif platform == "local":
            return LocalDeployer()
        else:
            raise ValueError("Invalid platform specified")
