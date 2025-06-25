import datetime
from unittest.mock import patch

import pytest

from kedro_viz.api.rest.responses.run_events import RunEventStatus
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


@pytest.mark.parametrize(
    "input_value, default, expected",
    [
        ("SUCCESS", RunEventStatus.FAILED, RunEventStatus.SUCCESS),
        ("FAILED", RunEventStatus.SUCCESS, RunEventStatus.FAILED),
        ("does-not-exist", RunEventStatus.SUCCESS, RunEventStatus.SUCCESS),
        (None, RunEventStatus.SUCCESS, RunEventStatus.SUCCESS),
    ],
)
def test_convert_status_to_enum_cases(input_value, default, expected):
    assert convert_status_to_enum(input_value, default) is expected


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
