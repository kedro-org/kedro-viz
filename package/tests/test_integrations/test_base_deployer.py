from pathlib import Path

import fsspec
import pytest

from kedro_viz import __version__
from kedro_viz.integrations.deployment.base_deployer import _HTML_DIR, BaseDeployer


# Test the BaseDeployer class
class TestBaseDeployer:
    def test_upload_api_responses(self, mocker):
        save_api_responses_to_fs_mock = mocker.patch(
            "kedro_viz.integrations.deployment.base_deployer.save_api_responses_to_fs"
        )
        build = ConcreteBaseDeployer()
        build._upload_api_responses(False)

        save_api_responses_to_fs_mock.assert_called_once_with(
            build._path, build._fs, False
        )

    def test_upload_static_files(self, mocker):
        mocker.patch("fsspec.filesystem")
        mocker.patch("kedro_viz.integrations.kedro.telemetry.get_heap_app_id")
        mocker.patch("kedro_viz.integrations.kedro.telemetry.get_heap_identity")

        build = ConcreteBaseDeployer()
        build._upload_static_files(_HTML_DIR)

        assert build._fs.put.call_count == 2

    def test_upload_static_file_failed(self, mocker, caplog):
        mocker.patch("fsspec.filesystem")
        build = ConcreteBaseDeployer()

        build._fs.put.side_effect = Exception("Error")
        with pytest.raises(Exception) as _:
            build._upload_static_files(_HTML_DIR)
        assert "Upload failed: Error" in caplog.text

    def test_upload_deploy_viz_metadata_file(self, mocker):
        mocker.patch("fsspec.filesystem")
        build = ConcreteBaseDeployer()
        build._upload_deploy_viz_metadata_file()

        expected_path = "build/api/deploy-viz-metadata"
        build._fs.open.assert_called_once_with(expected_path, "w")

    def test_upload_deploy_viz_metadata_file_failed(self, mocker, caplog):
        mocker.patch("fsspec.filesystem")
        build = ConcreteBaseDeployer()
        build._fs.open.side_effect = Exception("Error")
        with pytest.raises(Exception) as _:
            build._upload_deploy_viz_metadata_file()
        assert "Upload failed: Error" in caplog.text

    def test_deploy(self, mocker):
        mocker.patch("fsspec.filesystem")
        build = ConcreteBaseDeployer()

        mocker.patch("kedro_viz.server.load_and_populate_data")
        mocker.patch.object(build, "_upload_static_files")
        mocker.patch.object(build, "_upload_api_responses")
        mocker.patch.object(build, "_upload_deploy_viz_metadata_file")

        build.deploy()

        build._upload_static_files.assert_called_once_with(_HTML_DIR)
        build._upload_api_responses.assert_called_once()
        build._upload_deploy_viz_metadata_file.assert_called_once()


class ConcreteBaseDeployer(BaseDeployer):
    """a concrete subclass that inherits from BaseDeployer for test purpose."""

    def __init__(self):
        """Initialize ConcreteBaseDeployer with path and fs."""
        super().__init__()
        self._path = Path("build")
        self._fs = fsspec.filesystem("file")
