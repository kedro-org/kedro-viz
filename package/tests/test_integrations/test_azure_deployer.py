import pytest

from kedro_viz import __version__
from kedro_viz.integrations.deployment.azure_deployer import AzureDeployer

try:
    from azure.storage.blob import ContentSettings
except ImportError:  # pragma: no cover
    pass


# Test the AzureDeployer class
@pytest.fixture
def endpoint():
    return "https://test-bucket.z13.web.core.windows.net/"


@pytest.fixture
def bucket_name():
    return "test-bucket"


@pytest.fixture
def mock_file_system(mocker):
    yield mocker.patch("fsspec.filesystem")


class TestAzureDeployer:
    def test_deploy(self, endpoint, bucket_name, mocker):
        deployer = AzureDeployer(endpoint, bucket_name)

        mocker.patch.object(deployer, "_upload_api_responses")
        mocker.patch.object(deployer, "_upload_static_files")
        mocker.patch.object(deployer, "_upload_deploy_viz_metadata_file")

        deployer.deploy()

        deployer._upload_api_responses.assert_called_once()
        deployer._upload_static_files.assert_called_once()
        deployer._upload_deploy_viz_metadata_file.assert_called_once()

    def test_write_heap_injected_index(self, endpoint, bucket_name, mock_file_system):
        mock_html_content = "<html>Mocked Content</html>"
        deployer = AzureDeployer(endpoint, bucket_name)

        deployer._write_heap_injected_index(mock_html_content)

        # Assertions
        deployer._fs.write_bytes.assert_called_once_with(
            path=f"{deployer._path}/index.html",
            value=mock_html_content,
            overwrite=True,
            **{"content_settings": ContentSettings(content_type="text/html")},
        )

    def test_upload_static_files(
        self, endpoint, bucket_name, tmp_path, mocker, mock_file_system
    ):
        deployer = AzureDeployer(endpoint, bucket_name)
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
                path="abfs://$web/test_file.html",
                value=mock_html_content.encode("utf-8"),
                overwrite=True,
                **{"content_settings": ContentSettings(content_type="text/html")},
            )

            mock_ingest_heap_analytics.assert_called_once()
