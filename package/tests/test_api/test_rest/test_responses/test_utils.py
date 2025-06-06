from unittest.mock import patch

import pytest

from kedro_viz.api.rest.responses.run_events import DatasetStatus, NodeStatus
from kedro_viz.api.rest.responses.utils import (
    EnhancedORJSONResponse,
    calculate_pipeline_duration,
    convert_status_to_enum,
    get_encoded_response,
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


def test_get_encoded_response(mocker):
    mock_jsonable_encoder = mocker.patch(
        "kedro_viz.api.rest.responses.utils.jsonable_encoder"
    )
    mock_encode_to_human_readable = mocker.patch(
        "kedro_viz.api.rest.responses.utils.EnhancedORJSONResponse.encode_to_human_readable"
    )

    mock_response = {"key": "value"}
    mock_jsonable_encoder.return_value = mock_response
    mock_encoded_response = b"encoded-response"
    mock_encode_to_human_readable.return_value = mock_encoded_response

    result = get_encoded_response(mock_response)

    # Assertions
    mock_jsonable_encoder.assert_called_once_with(mock_response)
    mock_encode_to_human_readable.assert_called_once_with(mock_response)
    assert result == mock_encoded_response


def test_convert_status_to_enum_valid():
    """Test convert_status_to_enum with valid status."""
    result = convert_status_to_enum("success", NodeStatus.FAIL)
    assert result == NodeStatus.SUCCESS

    result = convert_status_to_enum("SUCCESS", NodeStatus.FAIL)
    assert result == NodeStatus.SUCCESS


def test_convert_status_to_enum_invalid():
    """Test convert_status_to_enum with invalid status returns default."""
    result = convert_status_to_enum("unknown", NodeStatus.SUCCESS)
    assert result == NodeStatus.SUCCESS

    result = convert_status_to_enum(None, DatasetStatus.AVAILABLE)
    assert result == DatasetStatus.AVAILABLE


def test_calculate_pipeline_duration_from_timestamps():
    """Test calculating duration from valid timestamps."""
    start_time = "2023-01-01T10:00:00"
    end_time = "2023-01-01T10:15:30"
    nodes_durations = {"node1": 10.0}

    result = calculate_pipeline_duration(start_time, end_time, nodes_durations)
    assert result == 930.0  # 15 minutes 30 seconds


def test_calculate_pipeline_duration_fallback():
    """Test fallback to node durations when timestamps are invalid."""
    nodes_durations = {"node1": 10.0, "node2": 20.0}

    # Invalid timestamps
    result = calculate_pipeline_duration("invalid", "timestamps", nodes_durations)
    assert result == 30.0  # Sum of node durations

    # No timestamps
    result = calculate_pipeline_duration(None, None, nodes_durations)
    assert result == 30.0


def test_convert_status_debug_logging():
    """Test debug logging for unknown status."""
    with patch("kedro_viz.api.rest.responses.utils.logging.getLogger") as mock_logger:
        mock_logger_instance = mock_logger.return_value
        result = convert_status_to_enum("unknown_status", NodeStatus.SUCCESS)
        assert result == NodeStatus.SUCCESS
        mock_logger_instance.debug.assert_called_once()


def test_calculate_duration_info_logging():
    """Test info logging for successful timestamp calculation."""
    with patch("kedro_viz.api.rest.responses.utils.logging.getLogger") as mock_logger:
        mock_logger_instance = mock_logger.return_value
        start_time = "2023-01-01T10:00:00"
        end_time = "2023-01-01T10:01:00"
        result = calculate_pipeline_duration(start_time, end_time, {})
        assert result == 60.0
        mock_logger_instance.info.assert_called_once()


def test_calculate_duration_warning_logging():
    """Test warning logging for invalid timestamps."""
    with patch("kedro_viz.api.rest.responses.utils.logging.getLogger") as mock_logger:
        mock_logger_instance = mock_logger.return_value
        result = calculate_pipeline_duration(
            "invalid", "2023-01-01T10:00:00", {"node1": 10.0}
        )
        assert result == 10.0
        mock_logger_instance.warning.assert_called_once()
