"""`kedro_viz.api.graphql.types` defines strawberry types."""

# pylint: disable=too-few-public-methods,missing-class-docstring
from __future__ import annotations

from typing import List, Optional

import strawberry
from strawberry import ID
from strawberry.scalars import JSON

from kedro_viz.models.experiment_tracking import (
    TrackingDatasetGroup as TrackingDatasetGroupModel,
)


@strawberry.type(description="Run metadata")
class Run:
    author: Optional[str]
    bookmark: Optional[bool]
    git_branch: Optional[str]
    git_sha: Optional[str]
    id: ID
    notes: Optional[str]
    run_command: Optional[str]
    title: str


@strawberry.type(description="Tracking data for a Run")
class TrackingDataset:
    data: JSON
    dataset_name: str
    dataset_type: str
    run_ids: List[ID]


@strawberry.type(description="Metric data")
class MetricPlotDataset:
    data: JSON


TrackingDatasetGroup = strawberry.enum(
    TrackingDatasetGroupModel, description="Group to show kind of tracking data"
)


@strawberry.input(description="Input to update run metadata")
class RunInput:
    bookmark: Optional[bool] = None
    notes: Optional[str] = None
    title: Optional[str] = None


@strawberry.type(description="Response for successful update of run metadata")
class UpdateRunDetailsSuccess:
    run: Run


@strawberry.type(description="Response for unsuccessful update of run metadata")
class UpdateRunDetailsFailure:
    id: ID
    error_message: str


UpdateRunDetailsResponse = strawberry.union(
    "UpdateRunDetailsResponse",
    (UpdateRunDetailsSuccess, UpdateRunDetailsFailure),
    description="Response for update of run metadata",
)


@strawberry.type(description="Installed and latest Kedro-Viz versions")
class Version:
    installed: str
    is_outdated: bool
    latest: str
