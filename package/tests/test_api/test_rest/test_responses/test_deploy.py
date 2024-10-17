import pytest

from kedro_viz.api.rest.responses.deploy import save_api_responses_to_fs


class TestDeployResponse:
    @pytest.mark.parametrize(
        "file_path, protocol, is_all_previews_enabled",
        [
            ("s3://shareableviz", "s3", True),
            ("abfs://shareableviz", "abfs", False),
            ("shareableviz", "file", True),
        ],
    )
    def test_save_api_responses_to_fs(
        self, file_path, protocol, is_all_previews_enabled, mocker
    ):
        mock_api_main_response_to_fs = mocker.patch(
            "kedro_viz.api.rest.responses.deploy.save_api_main_response_to_fs"
        )
        mock_api_node_response_to_fs = mocker.patch(
            "kedro_viz.api.rest.responses.deploy.save_api_node_response_to_fs"
        )
        mock_api_pipeline_response_to_fs = mocker.patch(
            "kedro_viz.api.rest.responses.deploy.save_api_pipeline_response_to_fs"
        )

        mock_filesystem = mocker.patch("fsspec.filesystem")
        mock_filesystem.return_value.protocol = protocol

        save_api_responses_to_fs(
            file_path, mock_filesystem.return_value, is_all_previews_enabled
        )

        mock_api_main_response_to_fs.assert_called_once_with(
            f"{file_path}/api/main", mock_filesystem.return_value
        )
        mock_api_node_response_to_fs.assert_called_once_with(
            f"{file_path}/api/nodes",
            mock_filesystem.return_value,
            is_all_previews_enabled,
        )
        mock_api_pipeline_response_to_fs.assert_called_once_with(
            f"{file_path}/api/pipelines", mock_filesystem.return_value
        )
