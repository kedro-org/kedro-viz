"""`kedro_viz.api.graphql` defines graphql API endpoint."""
# pylint: disable=no-self-use, too-few-public-methods, unnecessary-lambda

from __future__ import annotations

import asyncio
import json
import logging
from typing import AsyncGenerator, List, Optional

import strawberry
from kedro.io.core import Version as DataSetVersion
from kedro.io.core import get_filepath_str
from semver import VersionInfo
from strawberry import ID
from strawberry.tools import merge_types

from kedro_viz import __version__
from kedro_viz.data_access import data_access_manager
from kedro_viz.integrations.pypi import get_latest_version, is_running_outdated_version

from .serializers import format_run, format_run_tracking_data, format_runs
from .types import (
    Run,
    RunInput,
    TrackingDataset,
    UpdateRunDetailsFailure,
    UpdateRunDetailsResponse,
    UpdateRunDetailsSuccess,
    Version,
)

logger = logging.getLogger(__name__)


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


# TODO: better names
@strawberry.type
class RunsQuery:
    @strawberry.field
    def run_metadata(self, run_ids: List[ID]) -> List[Run]:
        """Gets metadata (blob, title, bookmark, etc.)  for specified run_ids from
         the session store."""
        return format_runs(
            data_access_manager.runs.get_runs_by_ids(run_ids),
            data_access_manager.runs.get_user_run_details_by_run_ids(run_ids),
        )

    @strawberry.field
    def runs_list(self) -> List[Run]:
        """Gets metadata for all runs from the session store."""
        all_runs = data_access_manager.runs.get_all_runs()
        if not all_runs:
            return []
        all_run_ids = [run.id for run in all_runs]
        return format_runs(
            all_runs,
            data_access_manager.runs.get_user_run_details_by_run_ids(all_run_ids),
        )

    @strawberry.field
    def run_tracking_data(
        self, run_ids: List[ID], show_diff: Optional[bool] = False
    ) -> List[TrackingDataset]:
        """Gets tracking dataset for specified run_ids."""
        return get_run_tracking_data(run_ids, show_diff)


@strawberry.type
class Mutation:
    """Mutation to update run details with run inputs"""

    @strawberry.mutation
    def update_run_details(
        self, run_id: ID, run_input: RunInput
    ) -> UpdateRunDetailsResponse:
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
class VersionQuery:
    @strawberry.field
    def version(self) -> Version:
        installed_version = VersionInfo.parse(__version__)
        latest_version = get_latest_version()
        return Version(
            installed=installed_version,
            isOutdated=is_running_outdated_version(installed_version, latest_version),
            latest=latest_version or "",
        )


schema = strawberry.Schema(
    query=(merge_types("Query", (RunsQuery, VersionQuery))),
    mutation=Mutation,
    subscription=Subscription,
)


# TODO:
# move tests? Pytest etc. # pytest and graphql

# rename data -> artifacts??
# Make enum for datasetGroups?
# our data structures don't need to match query schema - keep structures flat and do nesting with query

# fine to leave gets here, which should use data access manager


# `format_run` is serialisation logic. It shouldn't have data loading logic. Make it easier to unit test.
# Completely abstract database logic inside repositories within the data access layer and hide it from the API layer.
# runs list -> experiment tracking
# When does get_all_runs get called? Just wondering why this is the right place to update the last_run_id
# > t's the first call when user visits experimentation tracking tab.
# get_new_runs vs. get_all_runs: I prefer to keep these interfaces separate in case we need to add more logic to each use case. It's an old habit, e.g. if we end up caching all runs somewhere we won't need to go to the DB to fetch them. We will almost always have to do it for new runs.
# graph -> flowchart or something
