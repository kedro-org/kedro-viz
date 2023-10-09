"""`kedro_viz.api.graphql.schema` defines the GraphQL schema: queries and mutations."""
# pylint: disable=missing-function-docstring,missing-class-docstring

from __future__ import annotations

import json
import logging
from typing import List, Optional

import strawberry
from graphql.validation import NoSchemaIntrospectionCustomRule
from semver import VersionInfo
from strawberry import ID
from strawberry.extensions import AddValidationRules
from strawberry.tools import merge_types

from kedro_viz import __version__
from kedro_viz.data_access import data_access_manager
from kedro_viz.integrations.pypi import get_latest_version, is_running_outdated_version

from .serializers import (
    format_run,
    format_run_metric_data,
    format_run_tracking_data,
    format_runs,
)
from .types import (
    MetricPlotDataset,
    Run,
    RunInput,
    TrackingDataset,
    TrackingDatasetGroup,
    UpdateRunDetailsFailure,
    UpdateRunDetailsResponse,
    UpdateRunDetailsSuccess,
    Version,
)

logger = logging.getLogger(__name__)


@strawberry.type
class RunsQuery:
    @strawberry.field(
        description="Get metadata for specified run_ids from the session store"
    )
    def run_metadata(self, run_ids: List[ID]) -> List[Run]:
        # TODO: this is hacky and should be improved together with reworking the format
        #  functions.
        # Note we keep the order here the same as the queried run_ids.
        runs = {
            run.id: run
            for run in format_runs(
                data_access_manager.runs.get_runs_by_ids(run_ids),
                data_access_manager.runs.get_user_run_details_by_run_ids(run_ids),
            )
        }
        return [runs[run_id] for run_id in run_ids if run_id in runs]

    @strawberry.field(description="Get metadata for all runs from the session store")
    def runs_list(self) -> List[Run]:
        all_runs = data_access_manager.runs.get_all_runs()
        if not all_runs:
            return []
        all_run_ids = [run.id for run in all_runs]
        return format_runs(
            all_runs,
            data_access_manager.runs.get_user_run_details_by_run_ids(all_run_ids),
        )

    @strawberry.field(
        description="Get tracking datasets for specified group and run_ids"
    )
    def run_tracking_data(
        self,
        run_ids: List[ID],
        group: TrackingDatasetGroup,
        show_diff: Optional[bool] = True,
    ) -> List[TrackingDataset]:
        # pylint: disable=line-too-long
        tracking_dataset_models = data_access_manager.tracking_datasets.get_tracking_datasets_by_group_by_run_ids(
            run_ids, group
        )
        # TODO: this handling of dataset.runs is hacky and should be done by e.g. a
        #  proper query parameter instead of filtering to right run_ids here.
        # Note we keep the order here the same as the queried run_ids.

        all_tracking_datasets = []

        for dataset in tracking_dataset_models:
            runs = {run_id: dataset.runs[run_id] for run_id in run_ids}
            formatted_tracking_data = format_run_tracking_data(runs, show_diff)
            if formatted_tracking_data:
                tracking_data = TrackingDataset(
                    dataset_name=dataset.dataset_name,
                    dataset_type=dataset.dataset_type,
                    data=formatted_tracking_data,
                    run_ids=run_ids,
                )
                all_tracking_datasets.append(tracking_data)

        return all_tracking_datasets

    @strawberry.field(
        description="Get metrics data for a limited number of recent runs"
    )
    def run_metrics_data(self, limit: Optional[int] = 25) -> MetricPlotDataset:
        run_ids = [
            run.id for run in data_access_manager.runs.get_all_runs(limit_amount=limit)
        ]
        group = TrackingDatasetGroup.METRIC

        # pylint: disable=line-too-long
        metric_dataset_models = data_access_manager.tracking_datasets.get_tracking_datasets_by_group_by_run_ids(
            run_ids, group
        )

        metric_data = {}
        for dataset in metric_dataset_models:
            metric_data[dataset.dataset_name] = dataset.runs

        formatted_metric_data = format_run_metric_data(metric_data, run_ids)
        return MetricPlotDataset(data=formatted_metric_data)


@strawberry.type
class Mutation:
    @strawberry.mutation(description="Update run metadata")
    def update_run_details(
        self, run_id: ID, run_input: RunInput
    ) -> UpdateRunDetailsResponse:
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
        return UpdateRunDetailsSuccess(run=updated_run)


@strawberry.type
class VersionQuery:
    @strawberry.field(description="Get the installed and latest Kedro-Viz versions")
    def version(self) -> Version:
        installed_version = VersionInfo.parse(__version__)
        latest_version = get_latest_version()
        return Version(
            installed=str(installed_version),
            is_outdated=is_running_outdated_version(installed_version, latest_version),
            latest=str(latest_version) or "",
        )


schema = strawberry.Schema(
    query=(merge_types("Query", (RunsQuery, VersionQuery))),
    mutation=Mutation,
    extensions=[
        AddValidationRules([NoSchemaIntrospectionCustomRule]),
    ],
)
