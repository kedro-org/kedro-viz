import pytest

from kedro_viz import __version__
from kedro_viz.integrations.deployment.gcp_deployer import GCPDeployer


# Test the GCPDeployer class
@pytest.fixture
def endpoint():
    return "http://34.120.87.227/"


@pytest.fixture
def bucket_name():
    return "test-bucket"


@pytest.fixture
def mock_file_system(mocker):
    yield mocker.patch("fsspec.filesystem")


class TestGCPDeployer:
    def test_deploy(self, endpoint, bucket_name, mocker):
        deployer = GCPDeployer(endpoint, bucket_name)

        mocker.patch.object(deployer, "_upload_api_responses")
        mocker.patch.object(deployer, "_upload_static_files")
        mocker.patch.object(deployer, "_upload_deploy_viz_metadata_file")

        deployer.deploy()

        deployer._upload_api_responses.assert_called_once()
        deployer._upload_static_files.assert_called_once()
        deployer._upload_deploy_viz_metadata_file.assert_called_once()

    def test_upload_static_files(
        self, endpoint, bucket_name, tmp_path, mocker, mock_file_system
    ):
        deployer = GCPDeployer(endpoint, bucket_name)
        mock_ingest_heap_analytics = mocker.patch.object(
            deployer, "_ingest_heap_analytics"
        )
        mock_html_content = "<html><body>Test Content</body></html>"

        # Create a temporary HTML file with some test content
        temp_file_path = tmp_path / "test_file.html"
        with open(temp_file_path, "w", encoding="utf-8") as temp_file:
            temp_file.write(mock_html_content)

        with mocker.patch("mimetypes.guess_type", return_value=("text/html", None)):
            deployer._upload_static_files(tmp_path)
            deployer._fs.write_bytes.assert_called_once_with(
                path=f"gcs://{bucket_name}/test_file.html",
                value=mock_html_content.encode("utf-8"),
                content_type="text/html",
            )

            mock_ingest_heap_analytics.assert_called_once()
