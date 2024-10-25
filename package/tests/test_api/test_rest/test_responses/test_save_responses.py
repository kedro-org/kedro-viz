from unittest import mock
from unittest.mock import Mock, call, patch

import pytest

from kedro_viz.api.rest.responses.save_responses import (
    save_api_main_response_to_fs,
    save_api_node_response_to_fs,
    save_api_pipeline_response_to_fs,
    save_api_responses_to_fs,
    write_api_response_to_fs,
)


class TestSaveAPIResponse:
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
            "kedro_viz.api.rest.responses.save_responses.save_api_main_response_to_fs"
        )
        mock_api_node_response_to_fs = mocker.patch(
            "kedro_viz.api.rest.responses.save_responses.save_api_node_response_to_fs"
        )
        mock_api_pipeline_response_to_fs = mocker.patch(
            "kedro_viz.api.rest.responses.save_responses.save_api_pipeline_response_to_fs"
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

    def test_save_api_main_response_to_fs(self, mocker):
        expected_default_response = {"test": "json"}
        main_path = "/main"

        mock_get_default_response = mocker.patch(
            "kedro_viz.api.rest.responses.save_responses.get_pipeline_response",
            return_value=expected_default_response,
        )
        mock_write_api_response_to_fs = mocker.patch(
            "kedro_viz.api.rest.responses.save_responses.write_api_response_to_fs"
        )

        remote_fs = Mock()

        save_api_main_response_to_fs(main_path, remote_fs)

        mock_get_default_response.assert_called_once()
        mock_write_api_response_to_fs.assert_called_once_with(
            main_path, mock_get_default_response.return_value, remote_fs
        )

    def test_save_api_pipeline_response_to_fs(self, mocker):
        pipelines_path = "/pipelines"
        pipelineIds = ["01f456", "01f457"]
        expected_selected_pipeline_response = {"test": "json"}

        mock_get_selected_pipeline_response = mocker.patch(
            "kedro_viz.api.rest.responses.save_responses.get_pipeline_response",
            return_value=expected_selected_pipeline_response,
        )
        mock_write_api_response_to_fs = mocker.patch(
            "kedro_viz.api.rest.responses.save_responses.write_api_response_to_fs"
        )

        mocker.patch(
            "kedro_viz.api.rest.responses.save_responses.data_access_manager."
            "registered_pipelines.get_pipeline_ids",
            return_value=pipelineIds,
        )

        remote_fs = Mock()

        save_api_pipeline_response_to_fs(pipelines_path, remote_fs)

        assert mock_write_api_response_to_fs.call_count == len(pipelineIds)
        assert mock_get_selected_pipeline_response.call_count == len(pipelineIds)

        expected_calls = [
            call(
                f"{pipelines_path}/{pipelineId}",
                mock_get_selected_pipeline_response.return_value,
                remote_fs,
            )
            for pipelineId in pipelineIds
        ]
        mock_write_api_response_to_fs.assert_has_calls(expected_calls, any_order=True)

    def test_save_api_node_response_to_fs(self, mocker):
        nodes_path = "/nodes"
        nodeIds = ["01f456", "01f457"]
        expected_metadata_response = {"test": "json"}

        mock_get_node_metadata_response = mocker.patch(
            "kedro_viz.api.rest.responses.save_responses.get_node_metadata_response",
            return_value=expected_metadata_response,
        )
        mock_write_api_response_to_fs = mocker.patch(
            "kedro_viz.api.rest.responses.save_responses.write_api_response_to_fs"
        )
        mocker.patch(
            "kedro_viz.api.rest.responses.save_responses.data_access_manager.nodes.get_node_ids",
            return_value=nodeIds,
        )
        remote_fs = mock.Mock()

        save_api_node_response_to_fs(nodes_path, remote_fs, False)

        assert mock_write_api_response_to_fs.call_count == len(nodeIds)
        assert mock_get_node_metadata_response.call_count == len(nodeIds)

        expected_calls = [
            mock.call(
                f"{nodes_path}/{nodeId}",
                mock_get_node_metadata_response.return_value,
                remote_fs,
            )
            for nodeId in nodeIds
        ]
        mock_write_api_response_to_fs.assert_has_calls(expected_calls, any_order=True)

    @pytest.mark.parametrize(
        "file_path, response, encoded_response",
        [
            (
                "test_output.json",
                {"key1": "value1", "key2": "value2"},
                b'{"key1": "value1", "key2": "value2"}',
            ),
        ],
    )
    def test_write_api_response_to_fs(
        self, file_path, response, encoded_response, mocker
    ):
        mock_encode_to_human_readable = mocker.patch(
            "kedro_viz.api.rest.responses.utils.EnhancedORJSONResponse.encode_to_human_readable",
            return_value=encoded_response,
        )
        with patch("fsspec.filesystem") as mock_filesystem:
            mockremote_fs = mock_filesystem.return_value
            mockremote_fs.open.return_value.__enter__.return_value = Mock()
            write_api_response_to_fs(file_path, response, mockremote_fs)
            mockremote_fs.open.assert_called_once_with(file_path, "wb")
            mock_encode_to_human_readable.assert_called_once()
