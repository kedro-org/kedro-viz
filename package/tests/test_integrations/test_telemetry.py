from pathlib import Path
from unittest import mock

from kedro_viz.integrations.kedro import telemetry as kedro_telemetry


def test_get_heap_app_id_no_telemetry_file():
    assert kedro_telemetry.get_heap_app_id(Path.cwd()) is None


def test_get_heap_app_id_invalid_telemetry_file(tmpdir):
    telemetry_file = tmpdir / ".telemetry"
    telemetry_file.write_text("foo", encoding="utf-8")
    assert kedro_telemetry.get_heap_app_id(tmpdir) is None


def test_get_heap_app_id_no_consent(tmpdir):
    telemetry_file = tmpdir / ".telemetry"
    telemetry_file.write_text("consent: false", encoding="utf-8")
    assert kedro_telemetry.get_heap_app_id(tmpdir) is None


@mock.patch("kedro_viz.integrations.kedro.telemetry._get_heap_app_id")
def test_get_heap_app_id_with_consent(original_get_heap_app_id, tmpdir):
    original_get_heap_app_id.return_value = "my_heap_id"
    telemetry_file = tmpdir / ".telemetry"
    telemetry_file.write_text("consent: true", encoding="utf-8")
    assert kedro_telemetry.get_heap_app_id(tmpdir) == "my_heap_id"
