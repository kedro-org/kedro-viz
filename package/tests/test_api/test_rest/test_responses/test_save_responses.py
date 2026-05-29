from unittest import mock
from unittest.mock import Mock, call, patch

import pytest

from kedro_viz.api.rest.responses.save_responses import (
    save_api_main_response_to_fs,
    save_api_node_response_to_fs,
    save_api_pipeline_response_to_fs,
    save_api_responses_to_fs,
    save_api_run_status_response_to_fs,
    write_api_response_to_fs,
)


def _stub_provider(
    *,
    pipeline_response="pipeline-response",
    node_metadata_response="node-metadata-response",
    run_status_response="run-status-response",
    pipeline_ids=("01f456", "01f457"),
    node_ids=("01f456", "01f457"),
):
    """Tiny stand-in for ``RuntimeDataProvider`` — only the methods ``save_responses`` calls."""
    provider = Mock()
    provider.get_pipeline_response.return_value = pipeline_response
    provider.get_node_metadata_response.return_value = node_metadata_response
    provider.get_run_status_response.return_value = run_status_response
    provider.get_pipeline_ids.return_value = list(pipeline_ids)
    provider.get_node_ids.return_value = list(node_ids)
    return provider


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
        mock_api_run_status_response_to_fs = mocker.patch(
            "kedro_viz.api.rest.responses.save_responses.save_api_run_status_response_to_fs"
        )

        mock_filesystem = mocker.patch("fsspec.filesystem")
        mock_filesystem.return_value.protocol = protocol
        provider = _stub_provider()

        save_api_responses_to_fs(
            file_path,
            mock_filesystem.return_value,
            is_all_previews_enabled,
            provider=provider,
        )

        mock_api_main_response_to_fs.assert_called_once_with(
            f"{file_path}/api/main", mock_filesystem.return_value, provider
        )
        mock_api_node_response_to_fs.assert_called_once_with(
            f"{file_path}/api/nodes",
            mock_filesystem.return_value,
            is_all_previews_enabled,
            provider,
        )
        mock_api_pipeline_response_to_fs.assert_called_once_with(
            f"{file_path}/api/pipelines", mock_filesystem.return_value, provider
        )
        mock_api_run_status_response_to_fs.assert_called_once_with(
            f"{file_path}/api/run-status", mock_filesystem.return_value, provider
        )

    def test_save_api_responses_to_fs_falls_back_to_active_provider(self, mocker):
        """When no provider is passed, the runtime factory chooses one."""
        mocker.patch(
            "kedro_viz.api.rest.responses.save_responses.save_api_main_response_to_fs"
        )
        mocker.patch(
            "kedro_viz.api.rest.responses.save_responses.save_api_node_response_to_fs"
        )
        mocker.patch(
            "kedro_viz.api.rest.responses.save_responses.save_api_pipeline_response_to_fs"
        )
        mocker.patch(
            "kedro_viz.api.rest.responses.save_responses.save_api_run_status_response_to_fs"
        )
        mock_get_provider = mocker.patch(
            "kedro_viz.api.data_provider.get_runtime_data_provider",
            return_value=_stub_provider(),
        )
        mock_filesystem = mocker.patch("fsspec.filesystem")
        mock_filesystem.return_value.protocol = "file"

        save_api_responses_to_fs("out", mock_filesystem.return_value, True)

        mock_get_provider.assert_called_once_with()

    def test_save_api_main_response_to_fs(self, mocker):
        expected_default_response = {"test": "json"}
        main_path = "/main"
        provider = _stub_provider(pipeline_response=expected_default_response)
        mock_write_api_response_to_fs = mocker.patch(
            "kedro_viz.api.rest.responses.save_responses.write_api_response_to_fs"
        )

        remote_fs = Mock()

        save_api_main_response_to_fs(main_path, remote_fs, provider)

        provider.get_pipeline_response.assert_called_once_with()
        mock_write_api_response_to_fs.assert_called_once_with(
            main_path, expected_default_response, remote_fs
        )

    def test_save_api_pipeline_response_to_fs(self, mocker):
        pipelines_path = "/pipelines"
        pipeline_ids = ["01f456", "01f457"]
        expected_response = {"test": "json"}
        provider = _stub_provider(
            pipeline_response=expected_response, pipeline_ids=pipeline_ids
        )
        mock_write_api_response_to_fs = mocker.patch(
            "kedro_viz.api.rest.responses.save_responses.write_api_response_to_fs"
        )

        remote_fs = Mock()

        save_api_pipeline_response_to_fs(pipelines_path, remote_fs, provider)

        assert mock_write_api_response_to_fs.call_count == len(pipeline_ids)
        # ``get_pipeline_response`` is called once per pipeline id.
        assert provider.get_pipeline_response.call_count == len(pipeline_ids)

        expected_calls = [
            call(
                f"{pipelines_path}/{pipeline_id}",
                expected_response,
                remote_fs,
            )
            for pipeline_id in pipeline_ids
        ]
        mock_write_api_response_to_fs.assert_has_calls(expected_calls, any_order=True)

    def test_save_api_node_response_to_fs(self, mocker):
        nodes_path = "/nodes"
        node_ids = ["01f456", "01f457"]
        expected_response = {"test": "json"}
        provider = _stub_provider(
            node_metadata_response=expected_response, node_ids=node_ids
        )
        mock_write_api_response_to_fs = mocker.patch(
            "kedro_viz.api.rest.responses.save_responses.write_api_response_to_fs"
        )
        remote_fs = mock.Mock()

        save_api_node_response_to_fs(nodes_path, remote_fs, False, provider)

        assert mock_write_api_response_to_fs.call_count == len(node_ids)
        assert provider.get_node_metadata_response.call_count == len(node_ids)

        expected_calls = [
            mock.call(
                f"{nodes_path}/{node_id}",
                expected_response,
                remote_fs,
            )
            for node_id in node_ids
        ]
        mock_write_api_response_to_fs.assert_has_calls(expected_calls, any_order=True)

    def test_save_api_run_status_response_to_fs(self, mocker):
        expected_run_status_response = {"nodes": {}, "datasets": {}, "pipeline": {}}
        run_status_path = "/run-status"
        provider = _stub_provider(run_status_response=expected_run_status_response)
        mock_write_api_response_to_fs = mocker.patch(
            "kedro_viz.api.rest.responses.save_responses.write_api_response_to_fs"
        )

        remote_fs = Mock()

        save_api_run_status_response_to_fs(run_status_path, remote_fs, provider)

        provider.get_run_status_response.assert_called_once_with()
        mock_write_api_response_to_fs.assert_called_once_with(
            run_status_path, expected_run_status_response, remote_fs
        )

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
