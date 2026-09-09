"""Serve run status from a project-owned event file."""

from __future__ import annotations

from pathlib import Path

from kedro_viz.api.rest.responses.run_events import (
    RunStatusAPIResponse,
    read_run_status_response,
)
from kedro_viz.constants import PIPELINE_EVENT_FULL_PATH


class RunStatusService:
    """Read run status for one resolved Kedro project root."""

    def __init__(self, project_path: str | Path) -> None:
        project_root = Path(project_path).expanduser().resolve()
        self._event_file_path = project_root / PIPELINE_EVENT_FULL_PATH

    def get_run_status_response(self) -> RunStatusAPIResponse:
        """Return transformed events from this service's project file."""
        return read_run_status_response(self._event_file_path)
