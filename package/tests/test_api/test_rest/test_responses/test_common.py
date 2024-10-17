from unittest.mock import Mock, patch

import pytest

from kedro_viz.api.rest.responses.common import (
    EnhancedORJSONResponse,
    write_api_response_to_fs,
)


class TestEnhancedORJSONResponse:
    @pytest.mark.parametrize(
        "content, expected",
        [
            (
                {"key1": "value1", "key2": "value2"},
                b'{\n  "key1": "value1",\n  "key2": "value2"\n}',
            ),
            (["item1", "item2"], b'[\n  "item1",\n  "item2"\n]'),
        ],
    )
    def test_encode_to_human_readable(self, content, expected):
        result = EnhancedORJSONResponse.encode_to_human_readable(content)
        assert result == expected

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
            "kedro_viz.api.rest.responses.common.EnhancedORJSONResponse.encode_to_human_readable",
            return_value=encoded_response,
        )
        with patch("fsspec.filesystem") as mock_filesystem:
            mockremote_fs = mock_filesystem.return_value
            mockremote_fs.open.return_value.__enter__.return_value = Mock()
            write_api_response_to_fs(file_path, response, mockremote_fs)
            mockremote_fs.open.assert_called_once_with(file_path, "wb")
            mock_encode_to_human_readable.assert_called_once()
