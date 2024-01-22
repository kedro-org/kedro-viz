import pytest

from kedro_viz import __version__
from kedro_viz.integrations.deployment.aws_deployer import AWSDeployer


# Test the AWSDeployer class
@pytest.fixture
def endpoint():
    return "http://shareableviz.s3-website.us-east-2.amazonaws.com/"


@pytest.fixture
def bucket_name():
    return "shareableviz"


class TestAWSDeployer:
    def test_deploy(self, endpoint, bucket_name, mocker):
        mocker.patch("fsspec.filesystem")
        deployer = AWSDeployer(endpoint, bucket_name)

        mocker.patch.object(deployer, "_upload_api_responses")
        mocker.patch.object(deployer, "_upload_static_files")
        mocker.patch.object(deployer, "_upload_deploy_viz_metadata_file")

        deployer.deploy()

        deployer._upload_api_responses.assert_called_once()
        deployer._upload_static_files.assert_called_once()
        deployer._upload_deploy_viz_metadata_file.assert_called_once()
