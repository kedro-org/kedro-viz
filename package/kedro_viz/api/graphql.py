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
from kedro_viz.models.run_model import RunModel

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
        description="Generic scalar type respresenting a JSON object",
    )


def format_run(run_id: str, run_blob: Dict) -> Run:
    """Convert blob data in the correct Run format.
    Args:
        run_id: ID of the run to fetch
        run_blob: JSON blob of run metadata and tracking data
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


def format_run_tracking_data(tracking_data: Dict, show_diff: bool = False) -> JSONObject:
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


def get_run_tracking_data(run_ids: List[ID], show_diff: bool = False) -> List[TrackingDataSet]:
    # pylint: disable=protected-access,import-outside-toplevel
    """Get all tracking data for a list of runs. Tracking data contains the data from the
    tracking MetricsDataSet and JSONDataSet instances that have been logged
    during that specific `kedro run`.
    Args:
        run_ids:  List of IDs of runs to fetch the tracking data for.
        show_diff: If false, show runs with only common tracking
            data; else show all available tracking data

    Returns:
        List of TrackingDataSets

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
                logger.warning("`%s` could not be found", file_path)

        tracking_dataset = TrackingDataSet(
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
class TrackingDataSet:
    """TrackingDataSet object to structure tracking data for a Run."""

    datasetName: str
    datasetType: str
    data: JSONObject


@strawberry.type
class Query:
    """Query endpoint to get data from the session store"""

    @strawberry.field
    def run_tracking_data(
        self, run_ids: List[ID], show_diff: bool = False
    ) -> List[TrackingDataSet]:
        """Query to get data for specific runs from the session store"""
        return get_run_tracking_data(run_ids, show_diff)

    runs_list: List[Run] = strawberry.field(resolver=get_all_runs)

    @strawberry.field
    def run_metadata(self, run_ids: List[ID]) -> List[Run]:
        """Query to get data for specific runs from the session store"""
        return get_runs(run_ids)


schema = strawberry.Schema(query=Query)

router = APIRouter()

router.add_route("/graphql", GraphQL(schema))
