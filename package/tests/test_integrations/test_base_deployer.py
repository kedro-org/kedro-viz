from pathlib import Path

import pytest

from kedro_viz import __version__
from kedro_viz.integrations.deployment.base_deployer import _HTML_DIR, BaseDeployer


# Test the BaseDeployer class
class TestBaseDeployer:
    def test_copy_api_responses_to_build(self, mocker):
        mocker.patch("fsspec.filesystem")
        build = BaseDeployer()
        save_api_responses_to_fs_mock = mocker.patch(
            "kedro_viz.integrations.deployment.base_deployer.save_api_responses_to_fs"
        )

        build._copy_api_responses_to_build()
        save_api_responses_to_fs_mock.assert_called_once_with(build._build_path)

    def test_copy_static_files_to_build(self, mocker):
        mocker.patch("fsspec.filesystem")
        mocker.patch("kedro_viz.integrations.kedro.telemetry.get_heap_app_id")
        mocker.patch("kedro_viz.integrations.kedro.telemetry.get_heap_identity")

        build = BaseDeployer()
        build._copy_static_files_to_build(_HTML_DIR)

        assert build._local_fs.cp.call_count == 1

    def test_upload_static_file_failed(self, mocker, caplog):
        mocker.patch("fsspec.filesystem")
        build = BaseDeployer()
        build._local_fs.cp.side_effect = Exception("Error")
        with pytest.raises(Exception) as _:
            build._copy_static_files_to_build(_HTML_DIR)
        assert "Copying static files failed: Error" in caplog.text

    def test_copy_deploy_viz_metadata_file_to_build(self, mocker):
        mocker.patch("fsspec.filesystem")
        build = BaseDeployer()
        build._copy_deploy_viz_metadata_file_to_build()

        expected_path = Path("build/api/deploy-viz-metadata")
        build._local_fs.open.assert_called_once_with(expected_path, "w")

    def test_copy_deploy_viz_metadata_file_to_build_failed(self, mocker, caplog):
        mocker.patch("fsspec.filesystem")
        build = BaseDeployer()
        build._local_fs.open.side_effect = Exception("Error")
        with pytest.raises(Exception) as _:
            build._copy_deploy_viz_metadata_file_to_build()
        assert "Creating metadata file failed: Error" in caplog.text

    def test_build(self, mocker):
        mocker.patch("fsspec.filesystem")
        build = BaseDeployer()

        mocker.patch("kedro_viz.server.load_and_populate_data")
        mocker.patch.object(build, "_copy_static_files_to_build")
        mocker.patch.object(build, "_copy_api_responses_to_build")
        mocker.patch.object(build, "_copy_deploy_viz_metadata_file_to_build")

        build.build()

        build._copy_static_files_to_build.assert_called_once_with(_HTML_DIR)
        build._copy_api_responses_to_build.assert_called_once()
        build._copy_deploy_viz_metadata_file_to_build.assert_called_once()
