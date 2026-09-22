"""Serve run status from a project-owned event file."""

from __future__ import annotations

import json
import logging
from pathlib import Path

from kedro_viz.api.rest.responses.run_events import (
    RunStatusAPIResponse,
)
from kedro_viz.constants import PIPELINE_EVENT_FULL_PATH
from kedro_viz.integrations.kedro.inspection.run_status_builder import (
    transform_events_to_structured_format,
)

logger = logging.getLogger(__name__)


class RunStatusService:
    """Read run status for one resolved Kedro project root."""

    def __init__(self, project_path: str | Path) -> None:
        project_root = Path(project_path).expanduser().resolve()
        self._event_file_path = project_root / PIPELINE_EVENT_FULL_PATH

    def get_run_status_response(self) -> RunStatusAPIResponse:
        """Return transformed events from this service's project file."""
        return read_run_status_response(self._event_file_path)


def read_run_status_response(
    pipeline_events_file_path: Path,
) -> RunStatusAPIResponse:
    """Read and transform run events from an explicit file path."""
    try:
        if not pipeline_events_file_path.exists():
            logger.warning(
                f"Run events file {pipeline_events_file_path} not found. It may be due to missing `kedro run`"
            )
            return RunStatusAPIResponse()

        with pipeline_events_file_path.open("r", encoding="utf8") as file:
            try:
                events = json.load(file)
            except json.JSONDecodeError as exc:
                logger.error(
                    f"Invalid JSON in run events file '{pipeline_events_file_path}': {exc}"
                )
                return RunStatusAPIResponse()

        return transform_events_to_structured_format(events)

    except (OSError, IOError) as exc:
        logger.error(f"Error reading run events file: {exc}")
        return RunStatusAPIResponse()
    except Exception as exc:
        logger.exception(f"Unexpected error loading run events: {exc}")
        return RunStatusAPIResponse()
