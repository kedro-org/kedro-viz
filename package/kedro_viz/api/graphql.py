"""`kedro_viz.api.graphql` defines graphql API endpoint."""
# pylint: disable=no-self-use, too-few-public-methods, unnecessary-lambda

from __future__ import annotations

import json
import logging
from collections import defaultdict
from pathlib import Path
from typing import TYPE_CHECKING, Dict, List, NewType, Optional

import strawberry
from fastapi import APIRouter
from strawberry import ID
from strawberry.asgi import GraphQL

from kedro_viz.data_access import data_access_manager
from kedro_viz.models.experiments_tracking import RunModel, UserRunDetailsModel

logger = logging.getLogger(__name__)

if TYPE_CHECKING:  # pragma: no cover

    class JSONObject(dict):
        """Stub for JSONObject during type checking since mypy
         doesn't support dynamic base.
        https://github.com/python/mypy/issues/2477
        """


else:
    JSONObject = strawberry.scalar(
        NewType("JSONObject", dict),
        serialize=lambda v: v,
        parse_value=lambda v: json.loads(v),
        description="Generic scalar type representing a JSON object",
    )


def format_run(run_id: str, run_blob: Dict) -> Run:
    """Convert blob data in the correct Run format.
    Args:
        run_id: ID of the run to fetch
        run_blob: JSON blob of run metadata and tracking data
    Returns:
        Run object
    """
    session = data_access_manager.db_session
    git_data = run_blob.get("git")
    user_details = (
        session.query(UserRunDetailsModel)
        .filter(UserRunDetailsModel.run_id == run_id)
        .scalar()
    )
    run = Run(
        id=ID(run_id),
        author="",
        gitBranch=git_data.get("branch") if git_data else None,
        gitSha=git_data.get("commit_sha") if git_data else None,
        bookmark=user_details.bookmark if user_details else False,
        title=user_details.title if user_details else run_blob["session_id"],
        notes=user_details.notes if user_details else "",
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


def format_run_tracking_data(
    tracking_data: Dict, show_diff: Optional[bool] = False
) -> JSONObject:
    """Convert tracking data in the front-end format.

    Args:
        tracking_data: JSON blob of tracking data for selected runs
        show_diff: If false, show runs with only common tracking
            data; else show all available tracking data
    Returns:
        Dictionary with formatted tracking data for selected runs

    Example:
        >>> from kedro.extras.datasets.tracking import MetricsDataSet
        >>> tracking_data = {
        >>>     'My Favorite Sprint': {
        >>>         'bootstrap':0.8
        >>>         'classWeight":23
        >>>     },
        >>>     'Another Favorite Sprint': {
        >>>         'bootstrap':0.5
        >>>         'classWeight":21
        >>>     },
        >>>     'Slick test this one': {
        >>>         'bootstrap':1
        >>>         'classWeight":21
        >>>     },
        >>> }
        >>> format_run_tracking_data(tracking_data, False)
        {
            bootstrap: [
                { runId: 'My Favorite Run', value: 0.8 },
                { runId: 'Another favorite run', value: 0.5 },
                { runId: 'Slick test this one', value: 1 },
            ],
            classWeight: [
                { runId: 'My Favorite Run', value: 23 },
                { runId: 'Another favorite run', value: 21 },
                { runId: 'Slick test this one', value: 21 },
            ]
        }

    """
    formatted_tracking_data = defaultdict(list)

    for run_id, run_tracking_data in tracking_data.items():
        for tracking_name, data in run_tracking_data.items():
            formatted_tracking_data[tracking_name].append(
                {"runId": run_id, "value": data}
            )
    if not show_diff:
        for tracking_key, run_tracking_data in list(formatted_tracking_data.items()):
            if len(run_tracking_data) != len(tracking_data):
                del formatted_tracking_data[tracking_key]

    return JSONObject(formatted_tracking_data)


def get_run_tracking_data(
    run_ids: List[ID], show_diff: Optional[bool] = False
) -> List[TrackingDataset]:
    # pylint: disable=protected-access,import-outside-toplevel
    """Get all tracking data for a list of runs. Tracking data contains the data from the
    tracking MetricsDataSet and JSONDataSet instances that have been logged
    during that specific `kedro run`.
    Args:
        run_ids:  List of IDs of runs to fetch the tracking data for.
        show_diff: If false, show runs with only common tracking
            data; else show all available tracking data

    Returns:
        List of TrackingDatasets

    """
    from kedro.extras.datasets.tracking import JSONDataSet, MetricsDataSet  # noqa: F811

    all_datasets = []
    catalog = data_access_manager.catalog.get_catalog()
    tracking_datasets = [
        (ds_name, ds_value)
        for ds_name, ds_value in catalog._data_sets.items()
        if (isinstance(ds_value, (MetricsDataSet, JSONDataSet)))
    ]

    for name, dataset in tracking_datasets:
        all_runs = {}
        for run_id in run_ids:
            run_id = ID(run_id)
            file_path = dataset._get_versioned_path(str(run_id))
            if Path(file_path).is_file():
                with dataset._fs.open(
                    file_path, **dataset._fs_open_args_load
                ) as fs_file:
                    json_data = json.load(fs_file)
                    all_runs[run_id] = json_data
            else:
                all_runs[run_id] = {}
                logger.warning("`%s` could not be found", file_path)

        tracking_dataset = TrackingDataset(
            datasetName=name,
            datasetType=f"{dataset.__class__.__module__}.{dataset.__class__.__qualname__}",
            data=format_run_tracking_data(all_runs, show_diff),
        )
        all_datasets.append(tracking_dataset)
    return all_datasets


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
class TrackingDataset:
    """TrackingDataset object to structure tracking data for a Run."""

    datasetName: Optional[str]
    datasetType: Optional[str]
    data: Optional[JSONObject]


@strawberry.type
class Subscription:
    """Subscription object to track runs added in real time"""

    @strawberry.subscription
    def run_added(self, run_id: ID) -> Run:
        """Subscription to add runs in real-time"""


@strawberry.type
class Query:
    """Query endpoint to get data from the session store"""

    @strawberry.field
    def run_metadata(self, run_ids: List[ID]) -> List[Run]:
        """Query to get data for specific runs from the session store"""
        return get_runs(run_ids)

    @strawberry.field
    def run_tracking_data(
        self, run_ids: List[ID], show_diff: Optional[bool] = False
    ) -> List[TrackingDataset]:
        """Query to get data for specific runs from the session store"""
        return get_run_tracking_data(run_ids, show_diff)

    runs_list: List[Run] = strawberry.field(resolver=get_all_runs)


schema = strawberry.Schema(query=Query, subscription=Subscription)


@strawberry.input
class RunInput:
    """Run input to update bookmark, title and notes"""

    bookmark: Optional[bool] = None
    title: Optional[str] = None
    notes: Optional[str] = None


@strawberry.type
class UpdateRunDetailsSuccess:
    """Response type for sucessful update of runs"""

    run: Run


@strawberry.type
class UpdateRunDetailsFailure:
    """Response type for failed update of runs"""

    id: ID
    error_message: str


Response = strawberry.union(
    "UpdateRunDetailsResponse", (UpdateRunDetailsSuccess, UpdateRunDetailsFailure)
)


@strawberry.type
class Mutation:
    """Mutation to update run details with run inputs"""

    @strawberry.mutation
    def update_run_details(self, run_id: ID, run_input: RunInput) -> Response:
        """Updates run details based on run inputs provided by user"""
        runs = get_runs([run_id])
        if not runs:
            return UpdateRunDetailsFailure(
                id=run_id, error_message=f"Given run_id: {run_id} doesn't exist"
            )
        existing_run = runs[0]
        new_run = existing_run
        # if user doesn't provide a new title, use the old title.
        if run_input.title is None:
            new_run.title = existing_run.title
        # if user provides an empty title, we assume they want to revert to the old timestamp title
        elif run_input.title.strip() == "":
            new_run.title = existing_run.timestamp
        else:
            new_run.title = run_input.title

        new_run.bookmark = (
            run_input.bookmark
            if run_input.bookmark is not None
            else existing_run.bookmark
        )

        new_run.notes = (
            run_input.notes if run_input.notes is not None else existing_run.notes
        )

        updated_user_run_details = {
            "run_id": run_id,
            "title": new_run.title,
            "bookmark": new_run.bookmark,
            "notes": new_run.notes,
        }

        session = data_access_manager.db_session
        user_run_details = (
            session.query(UserRunDetailsModel)
            .filter(UserRunDetailsModel.run_id == run_id)
            .first()
        )
        if not user_run_details:
            session.add(UserRunDetailsModel(**updated_user_run_details))  # type: ignore
        else:
            for key, value in updated_user_run_details.items():
                setattr(user_run_details, key, value)
        session.commit()
        return UpdateRunDetailsSuccess(new_run)


schema = strawberry.Schema(query=Query, mutation=Mutation)

router = APIRouter()

router.add_route("/graphql", GraphQL(schema))
