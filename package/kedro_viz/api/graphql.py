"""`kedro_viz.api.graphql` defines graphql API endpoint."""
# pylint: disable=no-self-use, too-few-public-methods, unnecessary-lambda

from __future__ import annotations

import asyncio
import json
import logging
from collections import defaultdict
from typing import (
    TYPE_CHECKING,
    AsyncGenerator,
    Dict,
    Iterable,
    List,
    NewType,
    Optional,
    cast,
)

import strawberry
from fastapi import APIRouter
from kedro.io.core import Version as DataSetVersion
from kedro.io.core import get_filepath_str
from semver import VersionInfo
from strawberry import ID
from strawberry.asgi import GraphQL

from kedro_viz import __version__
from kedro_viz.data_access import data_access_manager
from kedro_viz.integrations.pypi import get_latest_version, is_running_outdated_version
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


def format_run(
    run_id: str, run_blob: Dict, user_run_details: Optional[UserRunDetailsModel] = None
) -> Run:
    """Convert blob data in the correct Run format.
    Args:
        run_id: ID of the run to fetch
        run_blob: JSON blob of run metadata and tracking data
        user_run_details: The user run details associated with this run
    Returns:
        Run object
    """
    git_data = run_blob.get("git")
    bookmark = user_run_details.bookmark if user_run_details else False
    title = (
        user_run_details.title
        if user_run_details and user_run_details.title
        else run_id
    )
    notes = (
        user_run_details.notes if user_run_details and user_run_details.notes else ""
    )
    run = Run(
        author="",
        bookmark=bookmark,
        gitBranch=git_data.get("branch") if git_data else None,
        gitSha=git_data.get("commit_sha") if git_data else None,
        id=ID(run_id),
        notes=notes,
        runCommand=run_blob.get("cli", {}).get("command_path"),
        title=title,
    )
    return run


def format_runs(
    runs: Iterable[RunModel],
    user_run_details: Optional[Dict[str, UserRunDetailsModel]] = None,
) -> List[Run]:
    """Format a list of RunModel objects into a list of GraphQL Run

    Args:
        runs: The collection of RunModels to format.
        user_run_details: the collection pf user_run_details associated with the given runs.
    Returns:
        The list of formatted Runs.
    """
    if not runs:
        return []
    return [
        format_run(
            run.id,
            json.loads(cast(str, run.blob)),
            user_run_details.get(run.id) if user_run_details else None,
        )
        for run in runs
    ]


def get_runs(run_ids: List[ID]) -> List[Run]:
    """Get a run by id from the session store.
    Args:
        run_ids: ID of the run to fetch
    Returns:
        list of Run objects
    """
    return format_runs(
        data_access_manager.runs.get_runs_by_ids(run_ids),
        data_access_manager.runs.get_user_run_details_by_run_ids(run_ids),
    )


def get_version() -> Version:
    """Get the user's installed Viz version and the latest version on PyPI.
    Returns:
        the currently installed and most-recent released version of Viz.
    """
    installed_version = VersionInfo.parse(__version__)
    latest_version = get_latest_version()
    return Version(
        installed=installed_version,
        isOutdated=is_running_outdated_version(installed_version, latest_version),
        latest=latest_version or "",
    )


def get_all_runs() -> List[Run]:
    """Get all runs from the session store.

    Returns:
        list of Run objects
    """
    all_runs = data_access_manager.runs.get_all_runs()
    if not all_runs:
        return []
    all_run_ids = [run.id for run in all_runs]
    return format_runs(
        all_runs, data_access_manager.runs.get_user_run_details_by_run_ids(all_run_ids)
    )


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
    # TODO: this logic should be moved to the data access layer.
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
            # Set the load_version to run_id
            dataset._version = DataSetVersion(run_id, None)
            load_path = get_filepath_str(dataset._get_load_path(), dataset._protocol)
            if dataset.exists():
                with dataset._fs.open(
                    load_path, **dataset._fs_open_args_load
                ) as fs_file:
                    json_data = json.load(fs_file)
                    all_runs[run_id] = json_data
            else:
                all_runs[run_id] = {}
                logger.warning("`%s` could not be found", load_path)

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


@strawberry.type
class Version:
    """The installed and latest Kedro Viz versions."""

    installed: str
    isOutdated: bool
    latest: str


@strawberry.type
class Subscription:
    """Subscription object to track runs added in real time"""

    @strawberry.subscription
    async def runs_added(self) -> AsyncGenerator[List[Run], None]:
        """Subscription to new runs in real-time"""
        while True:
            new_runs = data_access_manager.runs.get_new_runs()
            if new_runs:
                data_access_manager.runs.last_run_id = new_runs[0].id
                yield [
                    format_run(
                        run.id,
                        json.loads(run.blob),
                        data_access_manager.runs.get_user_run_details(run.id),
                    )
                    for run in new_runs
                ]
            await asyncio.sleep(3)  # pragma: no cover


@strawberry.type
class Query:
    """Query endpoint to get data from the session store"""

    @strawberry.field
    def run_metadata(self, run_ids: List[ID]) -> List[Run]:
        """Query to get data for specific run metadata from the session store"""
        return get_runs(run_ids)

    @strawberry.field
    def runs_list(self) -> List[Run]:
        """Query to get data for all the runs from the session store"""
        return get_all_runs()

    @strawberry.field
    def run_tracking_data(
        self, run_ids: List[ID], show_diff: Optional[bool] = False
    ) -> List[TrackingDataset]:
        """Query to get data for specific runs from the session store"""
        return get_run_tracking_data(run_ids, show_diff)

    @strawberry.field
    def version(self) -> Version:
        """Query to get Kedro-Viz version"""
        return get_version()


schema = strawberry.Schema(query=Query, subscription=Subscription)


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


Response = strawberry.union(
    "UpdateRunDetailsResponse", (UpdateRunDetailsSuccess, UpdateRunDetailsFailure)
)


@strawberry.type
class Mutation:
    """Mutation to update run details with run inputs"""

    @strawberry.mutation
    def update_run_details(self, run_id: ID, run_input: RunInput) -> Response:
        """Updates run details based on run inputs provided by user"""
        run = data_access_manager.runs.get_run_by_id(run_id)
        if not run:
            return UpdateRunDetailsFailure(
                id=run_id, error_message=f"Given run_id: {run_id} doesn't exist"
            )
        updated_run = format_run(
            run.id,
            json.loads(run.blob),
            data_access_manager.runs.get_user_run_details(run.id),
        )

        # only update user run title if the input is not empty
        if run_input.title is not None and bool(run_input.title.strip()):
            updated_run.title = run_input.title

        if run_input.bookmark is not None:
            updated_run.bookmark = run_input.bookmark

        if run_input.notes is not None and bool(run_input.notes.strip()):
            updated_run.notes = run_input.notes

        data_access_manager.runs.create_or_update_user_run_details(
            run_id,
            updated_run.title,
            updated_run.bookmark,
            updated_run.notes,
        )
        return UpdateRunDetailsSuccess(updated_run)


schema = strawberry.Schema(query=Query, mutation=Mutation, subscription=Subscription)

router = APIRouter()

graphql_app = GraphQL(schema)
router.add_route("/graphql", graphql_app)
router.add_websocket_route("/graphql", graphql_app)
