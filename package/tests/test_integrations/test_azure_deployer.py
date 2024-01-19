import pytest

from kedro_viz import __version__
from kedro_viz.integrations.deployment.azure_deployer import AzureDeployer


# Test the AzureDeployer class
@pytest.fixture
def endpoint():
    return "https://shareableviz.z13.web.core.windows.net/"


@pytest.fixture
def bucket_name():
    return "shareableviz"

@pytest.fixture
def mock_fsspec(mocker):
    yield mocker.patch("fsspec.filesystem")



class TestAzureDeployer:
    def test_deploy(self, endpoint, bucket_name, mocker, mock_fsspec):
        deployer = AzureDeployer(endpoint, bucket_name)

        mocker.patch.object(deployer, "_upload_api_responses")
        mocker.patch.object(deployer, "_upload_static_files")
        mocker.patch.object(deployer, "_upload_deploy_viz_metadata_file")

        deployer.deploy()

        deployer._upload_api_responses.assert_called_once()
        deployer._upload_static_files.assert_called_once()
        deployer._upload_deploy_viz_metadata_file.assert_called_once()

    # def _write_heap_injected_index(self, html_content):
    #     self._fs.write_bytes(
    #         path=f"{self._path}/index.html",
    #         value=html_content,
    #         overwrite=True,
    #         **{"content_settings": ContentSettings(content_type="text/html")},
    #     )
    
    # def test_write_heap_injected_index(mocker, endpoint, bucket_name, mock_fsspec):
    #     html_content = "<html>Mocked Content</html>"
    #     deployer = AzureDeployer(endpoint, bucket_name)

    #     # Mock the _write_bytes method of the fs_mock
    #     with mocker.patch.object(mock_fsspec, '_write_bytes') as mock_write_bytes:
    #         deployer._write_heap_injected_index(html_content)

    #     # Assertions
    #     mock_write_bytes.assert_called_once_with(
    #         path="/your/path/index.html",
    #         value=html_content,
    #         overwrite=True,
    #         content_settings={"content_type": "text/html"},
    #     )

    # def _upload_static_files(self, html_dir: Path):
    #     logger.debug("Uploading static html files to %s.", self._path)
    #     try:
    #         file_list = glob.glob(f"{str(html_dir)}/**/*", recursive=True)

    #         for local_file_path in file_list:
    #             content_type, _ = mimetypes.guess_type(local_file_path)

    #             # ignore directories
    #             if content_type is None:
    #                 continue

    #             relative_path = local_file_path[len(str(html_dir)) + 1 :]
    #             remote_file_path = f"{self._path}/{relative_path}"

    #             # Read the contents of the local file
    #             with open(local_file_path, "rb") as file:
    #                 content = file.read()

    #             self._fs.write_bytes(
    #                 path=remote_file_path,
    #                 value=content,
    #                 overwrite=True,
    #                 **{"content_settings": ContentSettings(content_type=content_type)},
    #             )

    #         self._ingest_heap_analytics()

    #     except Exception as exc:  # pragma: no cover
    #         logger.exception("Upload failed: %s ", exc)
    #         raise exc





    def test_deploy_and_get_url(self, endpoint, bucket_name, mocker):
        mocker.patch("fsspec.filesystem")
        deployer = AzureDeployer(endpoint, bucket_name)

        mocker.patch.object(deployer, "deploy")
        url = deployer.deploy_and_get_url()

        deployer.deploy.assert_called_once()
        expected_url = endpoint
        assert url.startswith("https://")
        assert url == expected_url
