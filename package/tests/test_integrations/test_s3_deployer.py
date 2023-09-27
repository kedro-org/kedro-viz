import pytest

from kedro_viz import __version__
from kedro_viz.integrations.deployment.s3_deployer import _HTML_DIR, S3Deployer


# Test the S3Deployer class
@pytest.fixture
def region():
    return "us-east-2"


@pytest.fixture
def bucket_name():
    return "shareableviz"


class TestS3Deployer:
    def test_upload_api_responses(self, mocker, region, bucket_name):
        mocker.patch("fsspec.filesystem")
        deployer = S3Deployer(region, bucket_name)
        save_api_responses_to_fs_mock = mocker.patch(
            "kedro_viz.integrations.deployment.s3_deployer.save_api_responses_to_fs"
        )

        deployer._upload_api_responses()
        save_api_responses_to_fs_mock.assert_called_once_with(deployer._bucket_path)

    def test_upload_static_files(self, mocker, region, bucket_name):
        mocker.patch("fsspec.filesystem")
        deployer = S3Deployer(region, bucket_name)
        deployer._upload_static_files(_HTML_DIR)
        deployer._remote_fs.put.assert_called_once_with(
            f"{str(_HTML_DIR)}/*", deployer._bucket_path, recursive=True
        )

    def test_upload_static_file_failed(self, mocker, region, bucket_name, caplog):
        mocker.patch("fsspec.filesystem")
        deployer = S3Deployer(region, bucket_name)
        deployer._remote_fs.put.side_effect = Exception("Error")
        with pytest.raises(Exception) as _:
            deployer._upload_static_files(_HTML_DIR)
        assert "Upload failed: Error" in caplog.text

    def test_upload_deploy_viz_metadata_file(self, mocker, region, bucket_name):
        mocker.patch("fsspec.filesystem")
        deployer = S3Deployer(region, bucket_name)
        deployer._upload_deploy_viz_metadata_file()
        deployer._remote_fs.open.assert_called_once_with(
            f"{deployer._bucket_path}/api/deploy-viz-metadata", "w"
        )
        deployer._remote_fs.open.return_value.__enter__.return_value.write.assert_called_once()

    def test_upload_deploy_viz_metadata_file_failed(
        self, mocker, region, bucket_name, caplog
    ):
        mocker.patch("fsspec.filesystem")
        deployer = S3Deployer(region, bucket_name)
        deployer._remote_fs.open.side_effect = Exception("Error")
        with pytest.raises(Exception) as _:
            deployer._upload_deploy_viz_metadata_file()
        assert "Upload failed: Error" in caplog.text

    def test_deploy(self, region, bucket_name, mocker):
        mocker.patch("fsspec.filesystem")
        deployer = S3Deployer(region, bucket_name)

        mocker.patch.object(deployer, "_upload_api_responses")
        mocker.patch.object(deployer, "_upload_static_files")
        mocker.patch.object(deployer, "_upload_deploy_viz_metadata_file")

        deployer._deploy()

        deployer._upload_api_responses.assert_called_once()
        deployer._upload_static_files.assert_called_once()
        deployer._upload_deploy_viz_metadata_file.assert_called_once()

    def test_deploy_and_get_url(self, region, bucket_name, mocker):
        mocker.patch("fsspec.filesystem")
        deployer = S3Deployer(region, bucket_name)

        mocker.patch.object(deployer, "_deploy")
        url = deployer.deploy_and_get_url()

        deployer._deploy.assert_called_once()
        expected_url = f"http://{deployer._bucket_name}.s3-website.{deployer._region}.amazonaws.com"
        assert url.startswith("http://")
        assert url == expected_url
