import pytest

from kedro_viz.integrations.deployment.aws_deployer import AWSDeployer
from kedro_viz.integrations.deployment.deployer_factory import DeployerFactory
from kedro_viz.integrations.deployment.local_deployer import LocalDeployer


def test_create_deployer_s3():
    deployer = DeployerFactory.create_deployer(
        "aws",
        endpoint="http://my-bucket.s3-website.us-east-2.amazonaws.com/",
        bucket_name="my-bucket",
    )
    assert isinstance(deployer, AWSDeployer)
    assert deployer._endpoint == "http://my-bucket.s3-website.us-east-2.amazonaws.com/"
    assert deployer._bucket_name == "my-bucket"


def test_create_deployer_local():
    deployer = DeployerFactory.create_deployer("local")
    assert isinstance(deployer, LocalDeployer)


def test_create_deployer_invalid_platform():
    with pytest.raises(
        ValueError, match="Invalid platform 'invalid_platform' specified"
    ):
        DeployerFactory.create_deployer("invalid_platform")
