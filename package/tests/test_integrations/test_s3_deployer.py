import pytest

from kedro_viz import __version__
from kedro_viz.integrations.deployment.s3_deployer import S3Deployer


# Test the S3Deployer class
@pytest.fixture
def region():
    return "us-east-2"


@pytest.fixture
def bucket_name():
    return "shareableviz"


class TestS3Deployer:
    def test_deploy(self, region, bucket_name, mocker):
        mocker.patch("fsspec.filesystem")
        deployer = S3Deployer(region, bucket_name)

        mocker.patch.object(deployer, "_upload_api_responses")
        mocker.patch.object(deployer, "_upload_static_files")
        mocker.patch.object(deployer, "_upload_deploy_viz_metadata_file")

        deployer.deploy()

        deployer._upload_api_responses.assert_called_once()
        deployer._upload_static_files.assert_called_once()
        deployer._upload_deploy_viz_metadata_file.assert_called_once()

    def test_deploy_and_get_url(self, region, bucket_name, mocker):
        mocker.patch("fsspec.filesystem")
        deployer = S3Deployer(region, bucket_name)

        mocker.patch.object(deployer, "deploy")
        url = deployer.deploy_and_get_url()

        deployer.deploy.assert_called_once()
        expected_url = f"http://{deployer._bucket_name}.s3-website.{deployer._region}.amazonaws.com"
        assert url.startswith("http://")
        assert url == expected_url
