"""Response for run status API endpoint."""

import logging
from enum import Enum
from pathlib import Path
from typing import Optional

from pydantic import BaseModel, Field

from kedro_viz.api.rest.responses.utils import RunEventStatus
from kedro_viz.constants import PIPELINE_EVENT_FULL_PATH
from kedro_viz.launchers.utils import _find_kedro_project

logger = logging.getLogger(__name__)


class EventType(str, Enum):
    """Enum for supported event types in run logs."""

    BEFORE_PIPELINE_RUN = "before_pipeline_run"
    AFTER_PIPELINE_RUN = "after_pipeline_run"
    ON_PIPELINE_ERROR = "on_pipeline_error"
    AFTER_NODE_RUN = "after_node_run"
    ON_NODE_ERROR = "on_node_error"
    AFTER_DATASET_LOADED = "after_dataset_loaded"
    AFTER_DATASET_SAVED = "after_dataset_saved"


class BaseErrorInfo(BaseModel):
    """Base class for error information.

    Attributes:
        message: A string containing the error message.
        traceback: Optional traceback for debugging purposes.
    """

    message: str
    traceback: str = ""


class NodeErrorInfo(BaseErrorInfo):
    """Error information specific to a node execution failure."""

    pass


class DatasetErrorInfo(BaseErrorInfo):
    """Error information related to dataset loading or saving.

    Attributes:
        error_node: The name of the node that caused the dataset error.
        error_operation: The type of operation ("loading" or "saving").
    """

    error_node: Optional[str] = None
    error_operation: Optional[str] = None


class PipelineErrorInfo(BaseErrorInfo):
    """Error information specific to pipeline-level failures."""

    pass


class NodeInfo(BaseModel):
    """Metadata associated with a node execution.

    Attributes:
        duration: Time taken to execute the node in seconds.
        status: status of the node (e.g., SUCCESS, FAILED).
        error: Optional error information if execution failed.
    """

    duration: float = 0.0
    status: RunEventStatus = RunEventStatus.SUCCESS
    error: Optional[NodeErrorInfo] = None


class DatasetInfo(BaseModel):
    """Metadata associated with a dataset load/save operation.

    Attributes:
        name: Name of the dataset.
        size: Size of the dataset in bytes.
        status: status of the dataset operation.
        error: Optional error info if operation failed.
    """

    name: str
    size: int = 0
    status: RunEventStatus = RunEventStatus.SUCCESS
    error: Optional[DatasetErrorInfo] = None


class PipelineInfo(BaseModel):
    """Metadata related to the overall pipeline run.

    Attributes:
        run_id: Unique identifier for the pipeline run.
        start_time: ISO-formatted start timestamp.
        end_time: ISO-formatted end timestamp.
        duration: Total duration of the pipeline in seconds.
        status: Overall status of the pipeline.
        error: Optional error info if the pipeline failed.
    """

    run_id: str = "default-run-id"
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    duration: float = 0.0
    status: RunEventStatus = RunEventStatus.SUCCESS
    error: Optional[PipelineErrorInfo] = None


class RunStatusAPIResponse(BaseModel):
    """Structured response model for run status API endpoint.

    Attributes:
        nodes: Dictionary of node execution metadata.
        datasets: Dictionary of dataset metadata.
        pipeline: Metadata for the entire pipeline execution.
    """

    nodes: dict[str, NodeInfo] = Field(default_factory=dict)
    datasets: dict[str, DatasetInfo] = Field(default_factory=dict)
    pipeline: PipelineInfo = Field(default_factory=PipelineInfo)


def get_run_status_response() -> RunStatusAPIResponse:
    """Read run status using the legacy current-working-directory lookup."""
    # Keep cwd-based lookup until export uses the context.
    # Import lazily to avoid a cycle with these response models.
    from kedro_viz.integrations.kedro.inspection.run_status_service import (
        read_run_status_response,
    )

    try:
        if not _find_kedro_project(Path.cwd()):
            return RunStatusAPIResponse()
        return read_run_status_response(PIPELINE_EVENT_FULL_PATH)
    except Exception as exc:
        logger.exception(f"Unexpected error loading run events: {exc}")
        return RunStatusAPIResponse()
