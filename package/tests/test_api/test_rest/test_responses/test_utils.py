import datetime
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


def test_convert_status_to_enum_cases():
    assert (
        convert_status_to_enum("successful", NodeStatus.FAILED) is NodeStatus.SUCCESSFUL
    )
    assert convert_status_to_enum("FAILED", NodeStatus.SUCCESSFUL) is NodeStatus.FAILED
    # Unknown / None → default
    assert (
        convert_status_to_enum("does-not-exist", NodeStatus.SUCCESSFUL)
        is NodeStatus.SUCCESSFUL
    )
    assert convert_status_to_enum(None, NodeStatus.SUCCESSFUL) is NodeStatus.SUCCESSFUL


@pytest.mark.parametrize("delta", [5, 17])
def test_calculate_pipeline_duration_from_timestamps(delta):
    now = datetime.datetime.now()
    later = now + datetime.timedelta(seconds=delta)
    assert calculate_pipeline_duration(
        now.isoformat(), later.isoformat(), {"x": 1}
    ) == pytest.approx(delta, abs=1e-6)


def test_calculate_pipeline_duration_fallback():
    durations = {"a": 2.5, "b": 7.5}
    assert calculate_pipeline_duration("bad", "still-bad", durations) == sum(
        durations.values()
    )
