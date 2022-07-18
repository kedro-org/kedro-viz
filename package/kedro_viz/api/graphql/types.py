"""`kedro_viz.api.graphql.types` defines strawberry types."""

# pylint: disable=too-few-public-methods, unnecessary-lambda,missing-class-docstring
from __future__ import annotations

import json
from typing import TYPE_CHECKING, NewType, Optional

import strawberry
from strawberry import ID

if TYPE_CHECKING:  # pragma: no cover

    class JSONObject(dict):
        """Stub for JSONObject during type checking since mypy
         doesn't support dynamic base.
        https://github.com/python/mypy/issues/2477
        """


# TODO: is this needed compared to built in one?
else:
    JSONObject = strawberry.scalar(
        NewType("JSONObject", dict),
        serialize=lambda v: v,
        parse_value=lambda v: json.loads(v),
        description="Generic scalar type representing a JSON object",
    )

# TODO: docs using description ARGUMENT


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
    data: JSONObject
    dataset_name: str
    dataset_type: str


# TODO: something like this when we query by group.
# from kedro_viz.models.experiment_tracking import TrackingDatasetGroup
# @strawberry.enum
# class TrackingDatasetGroup(TrackingDatasetGroup):
#     ...


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
