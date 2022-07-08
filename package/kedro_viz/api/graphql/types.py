from __future__ import annotations

import json

from strawberry import ID
from typing import Optional, TYPE_CHECKING, NewType

import strawberry


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



# TODO: better docstrings

@strawberry.type
class Run:
    """Run object format"""

    author: Optional[str]
    bookmark: Optional[bool]
    gitBranch: Optional[str]
    gitSha: Optional[str]
    id: ID
    notes: Optional[str]
    runCommand: Optional[str]
    title: str


@strawberry.type
class TrackingDataset:
    """TrackingDataset object to structure tracking data for a Run."""

    data: Optional[JSONObject]
    datasetName: Optional[str]
    datasetType: Optional[str]


@strawberry.input
class RunInput:
    """Run input to update bookmark, title and notes"""

    bookmark: Optional[bool] = None
    notes: Optional[str] = None
    title: Optional[str] = None


@strawberry.type
class UpdateRunDetailsSuccess:
    """Response type for successful update of runs"""

    run: Run


@strawberry.type
class UpdateRunDetailsFailure:
    """Response type for failed update of runs"""

    id: ID
    error_message: str


UpdateRunDetailsResponse = strawberry.union(
    "UpdateRunDetailsResponse", (UpdateRunDetailsSuccess, UpdateRunDetailsFailure)
)


@strawberry.type
class Version:
    """The installed and latest Kedro Viz versions."""

    installed: str
    isOutdated: bool
    latest: str