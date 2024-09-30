from pathlib import Path
from unittest import mock

from kedro_viz.integrations.kedro import telemetry as kedro_telemetry


def test_get_heap_app_id_no_telemetry_file():
    assert kedro_telemetry.get_heap_app_id(Path.cwd()) is not None


def test_get_heap_app_id_invalid_telemetry_file(tmpdir):
    telemetry_file = tmpdir / ".telemetry"
    telemetry_file.write_text("foo", encoding="utf-8")
    assert kedro_telemetry.get_heap_app_id(tmpdir) is not None


def test_get_heap_app_id_no_consent(tmpdir):
    telemetry_file = tmpdir / ".telemetry"
    telemetry_file.write_text("consent: false", encoding="utf-8")
    assert kedro_telemetry.get_heap_app_id(tmpdir) is None


@mock.patch("kedro_viz.integrations.kedro.telemetry._get_heap_app_id")
@mock.patch("kedro_viz.integrations.kedro.telemetry._check_for_telemetry_consent")
def test_get_heap_app_id_with_consent(
    mock_check_for_telemetry_consent, mock_get_heap_app_id, tmpdir
):
    mock_check_for_telemetry_consent.return_value = True
    mock_get_heap_app_id.return_value = "my_heap_id"
    telemetry_file = tmpdir / ".telemetry"
    telemetry_file.write_text("consent: true", encoding="utf-8")
    assert kedro_telemetry.get_heap_app_id(tmpdir) == "my_heap_id"


@mock.patch("kedro_viz.integrations.kedro.telemetry._check_for_telemetry_consent")
def test_get_heap_app_id_with_env_var(mock_check_for_telemetry_consent, tmpdir):
    mock_check_for_telemetry_consent.return_value = False
    with mock.patch.dict("os.environ", {"DO_NOT_TRACK": "1"}):
        assert kedro_telemetry.get_heap_app_id(tmpdir) is None

    with mock.patch.dict("os.environ", {"KEDRO_DISABLE_TELEMETRY": "1"}):
        assert kedro_telemetry.get_heap_app_id(tmpdir) is None
