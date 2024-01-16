import pytest

from kedro_viz.integrations.deployment.deployer_factory import DeployerFactory
from kedro_viz.integrations.deployment.local_deployer import LocalDeployer
from kedro_viz.integrations.deployment.s3_deployer import S3Deployer


def test_create_deployer_s3():
    deployer = DeployerFactory.create_deployer(
        "s3", region="us-east-1", bucket_name="my-bucket"
    )
    assert isinstance(deployer, S3Deployer)
    assert deployer._region == "us-east-1"
    assert deployer._bucket_name == "my-bucket"


def test_create_deployer_local():
    deployer = DeployerFactory.create_deployer("local")
    assert isinstance(deployer, LocalDeployer)


def test_create_deployer_invalid_platform():
    with pytest.raises(
        ValueError, match="Invalid platform 'invalid_platform' specified"
    ):
        DeployerFactory.create_deployer("invalid_platform")
