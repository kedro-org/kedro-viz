from unittest.mock import patch

import pytest

from kedro_viz.integrations.deployment.s3_deployer import _HTML_DIR, S3Deployer


# Test the S3Deployer class
class TestS3Deployer:
    @pytest.mark.parametrize(
        "region, bucket_name, expected_protocol, expected_path",
        [
            ("us-east-2", "s3://shareableviz", "s3", "shareableviz"),
            ("us-east-1", "shareableviz", "file", "shareableviz"),
        ],
    )
    def test_init(self, region, bucket_name, expected_protocol, expected_path):
        # Test the __init__ method
        deployer = S3Deployer(region, bucket_name)

        # Assertions to verify the initialization
        assert deployer._region == region
        assert deployer._bucket_name == bucket_name
        assert deployer._protocol == expected_protocol
        assert deployer._path == expected_path

    @pytest.mark.parametrize(
        "region, bucket_name",
        [("us-east-2", "s3://shareableviz"), ("us-east-1", "shareableviz")],
    )
    def test_upload_api_responses(self, region, bucket_name, mocker):
        deployer = S3Deployer(region, bucket_name)
        save_api_responses_to_fs_mock = mocker.patch(
            "kedro_viz.integrations.deployment.s3_deployer.save_api_responses_to_fs"
        )

        deployer._upload_api_responses()
        save_api_responses_to_fs_mock.assert_called_once_with(bucket_name)

    @pytest.mark.parametrize(
        "region, bucket_name",
        [("us-east-2", "s3://shareableviz"), ("us-east-1", "shareableviz")],
    )
    def test_upload_static_files(self, region, bucket_name):
        deployer = S3Deployer(region, bucket_name)

        # Mock the _remote_fs.put method to simulate a successful upload
        with patch.object(deployer._remote_fs, "put") as mock_put:
            deployer._upload_static_files()

            # Assert that _remote_fs.put was called with the expected arguments
            mock_put.assert_called_once_with(
                f"{str(_HTML_DIR)}/*", deployer._bucket_name, recursive=True
            )

    @pytest.mark.parametrize(
        "region, bucket_name",
        [("us-east-2", "s3://shareableviz"), ("us-east-1", "shareableviz")],
    )
    def test_deploy(self, region, bucket_name, mocker):
        deployer = S3Deployer(region, bucket_name)

        mocker.patch.object(deployer, "_upload_api_responses")
        mocker.patch.object(deployer, "_upload_static_files")

        deployer._deploy()

        deployer._upload_api_responses.assert_called_once()
        deployer._upload_static_files.assert_called_once()

    @pytest.mark.parametrize(
        "region, bucket_name",
        [("us-east-2", "s3://shareableviz"), ("us-east-1", "shareableviz")],
    )
    def test_get_deployed_url(self, region, bucket_name, mocker):
        deployer = S3Deployer(region, bucket_name)

        mocker.patch.object(deployer, "_deploy")
        url = deployer.get_deployed_url()

        deployer._deploy.assert_called_once()
        expected_url = (
            f"http://{deployer._path}.s3-website.{deployer._region}.amazonaws.com"
        )
        assert url.startswith("http://")
        assert url == expected_url
