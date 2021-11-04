"""`kedro_viz.api.graphql` defines graphql API endpoint."""
# pylint: disable=no-self-use, too-few-public-methods, unnecessary-lambda

from __future__ import annotations

import json
import logging
from typing import TYPE_CHECKING, Any, Dict, List, NewType, Optional

import strawberry
from fastapi import APIRouter
from strawberry import ID
from strawberry.asgi import GraphQL

from kedro_viz.data_access import data_access_manager
from kedro_viz.models.run_model import RunModel

logger = logging.getLogger(__name__)

if TYPE_CHECKING:  # pragma: no cover

    class JSONObject:
        """Stub for JSONObject during type checking since mypy
         doesn't support dynamic base.
        https://github.com/python/mypy/issues/2477
        """

        ...


else:
    JSONObject = strawberry.scalar(
        NewType("JSONObject", Any),
        serialize=lambda v: v,
        parse_value=lambda v: json.loads(v),
        description="""The GenericScalar scalar type represents a generic GraphQL
        scalar value that could be: List or Object.""",
    )


def format_run(run_id: str, run_blob: Dict) -> Run:
    """Convert blob data in the correct Run format.

    Args:
        run_id: ID of the run to fetch
        run_blob: JSON blob of run metadata and details

    Returns:
        Run object
    """
    git_data = run_blob.get("git")
    run = Run(
        id=ID(run_id),
        author="",
        gitBranch="",
        gitSha=git_data.get("commit_sha") if git_data else None,
        bookmark=False,
        title=run_blob["session_id"],
        notes="",
        timestamp=run_blob["session_id"],
        runCommand=run_blob["cli"]["command_path"],
    )
    return run


def get_runs(run_ids: List[ID]) -> List[Run]:
    """Get a run by id from the session store.

    Args:
        run_ids: ID of the run to fetch

    Returns:
        list of Run objects
    """
    runs: List[Run] = []
    session = data_access_manager.db_session
    if not session:
        return runs
    all_run_data = session.query(RunModel).filter(RunModel.id.in_(run_ids)).all()
    for run_data in all_run_data:
        run = format_run(run_data.id, json.loads(run_data.blob))
        runs.append(run)
    return runs


def get_all_runs() -> List[Run]:
    """Get all runs from the session store.

    Returns:
        list of Run objects
    """
    runs: List[Run] = []
    session = data_access_manager.db_session
    if not session:
        return runs
    for run_data in session.query(RunModel).all():
        run = format_run(run_data.id, json.loads(run_data.blob))
        runs.append(run)
    return runs


@strawberry.type
class Run:
    """Run object format"""

    id: ID
    title: str
    timestamp: str
    author: Optional[str]
    gitBranch: Optional[str]
    gitSha: Optional[str]
    bookmark: Optional[bool]
    notes: Optional[str]
    runCommand: Optional[str]


@strawberry.type
class TrackingDataSet:
    """TrackingDataSet object to structure tracking data for a Run."""

    datasetName: str
    datasetType: str
    data: JSONObject


@strawberry.type
class Query:
    """Query endpoint to get data from the session store"""

    runs_list: List[Run] = strawberry.field(resolver=get_all_runs)

    @strawberry.field
    def run_metadata(self, run_ids: List[ID]) -> List[Run]:
        """Query to get data for specific runs from the session store"""
        return get_runs(run_ids)


schema = strawberry.Schema(query=Query)

router = APIRouter()

router.add_route("/graphql", GraphQL(schema))
