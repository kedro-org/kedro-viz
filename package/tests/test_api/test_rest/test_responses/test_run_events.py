"""Tests for the legacy run-status export wrapper."""

from pathlib import Path

from kedro_viz.api.rest.responses import run_events
from kedro_viz.integrations.kedro.inspection import run_status_service


class TestGetRunStatusResponse:
    def test_no_kedro_project(self, monkeypatch):
        """When `_find_kedro_project` returns None, the function exits early."""
        monkeypatch.setattr(run_events, "_find_kedro_project", lambda *_: None)
        result = run_events.get_run_status_response()
        assert result == run_events.RunStatusAPIResponse()

    def test_legacy_wrapper_reads_the_existing_relative_path(self, mocker):
        mocker.patch.object(
            run_events,
            "_find_kedro_project",
            return_value=Path("/project"),
        )
        read = mocker.patch.object(
            run_status_service,
            "read_run_status_response",
            return_value=run_events.RunStatusAPIResponse(),
        )

        result = run_events.get_run_status_response()

        assert result == run_events.RunStatusAPIResponse()
        read.assert_called_once_with(run_events.PIPELINE_EVENT_FULL_PATH)

    def test_legacy_wrapper_handles_project_lookup_errors(self, mocker, caplog):
        mocker.patch.object(
            run_events,
            "_find_kedro_project",
            side_effect=RuntimeError("lookup failed"),
        )

        result = run_events.get_run_status_response()

        assert result == run_events.RunStatusAPIResponse()
        assert "Unexpected error loading run events: lookup failed" in caplog.text
