# Copyright 2021 QuantumBlack Visual Analytics Limited
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
# EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
# OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND
# NONINFRINGEMENT. IN NO EVENT WILL THE LICENSOR OR OTHER CONTRIBUTORS
# BE LIABLE FOR ANY CLAIM, DAMAGES, OR OTHER LIABILITY, WHETHER IN AN
# ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF, OR IN
# CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
#
# The QuantumBlack Visual Analytics Limited ("QuantumBlack") name and logo
# (either separately or in combination, "QuantumBlack Trademarks") are
# trademarks of QuantumBlack. The License does not grant you any right or
# license to the QuantumBlack Trademarks. You may not use the QuantumBlack
# Trademarks or any confusingly similar mark as a trademark for your product,
# or use the QuantumBlack Trademarks in any other manner that might cause
# confusion in the marketplace, including but not limited to in advertising,
# on websites, or on software.
#
# See the License for the specific language governing permissions and
# limitations under the License.
"""`kedro_viz.api.graphql` defines graphql API endpoint."""
# pylint: disable=no-self-use, too-few-public-methods, unnecessary-lambda

from __future__ import annotations

import json
import logging
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


def format_run_tracking_data(tracking_data: Dict) -> JSONObject:
    """Convert tracking data in the front-end format.
    [{
        datasetName: 'Data Analysis',
        datasetType: "kedro.extras.datasets.tracking.metrics_dataset.MetricsDataSet"
        data: {
            bootstrap: [
            { runId: 'My Favorite Sprint', value: 0.8 },
            { runId: 'Another favorite sprint', value: 0.5 },
            { runId: 'Slick test this one', value: 1 },
            ],
            classWeight: [
            { runId: 'My Favorite Sprint', value: 23 },
            { runId: 'Another favorite sprint', value: 21 },
            { runId: 'Slick test this one', value: 21 },
            ]
    }]

    Args:
        tracking_data: JSON blob of tracking data for selected runs
    Returns:
        Dictionary with formatted tracking data for selected runs
    """
    tracking_keys = set()
    for key in tracking_data.keys():
        for nested_keys in tracking_data[key].keys():
            tracking_keys.add(nested_keys)
    runs_tracking_data = {
        key: [
            {"runId": run_id, "value": tracking_data[run_id][key]}
            for run_id in tracking_data
            if key in tracking_data[run_id]
        ]
        for key in sorted(tracking_keys)
    }
    return json.loads(json.dumps(runs_tracking_data))


def get_run_tracking_data(run_ids: List[ID]) -> List[TrackingDataSet]:
    # pylint: disable=protected-access,import-outside-toplevel
    """Get all details for a specific run. Run details contains the data from the
    tracking MetricsDataSet and JSONDataSet instances that have been logged
    during that specific `kedro run`.
    Args:
        run_ids:  List of IDs of runs to fetch the details for.

    Returns:
        List of TrackingDataSets

    """
    from kedro.extras.datasets.tracking import JSONDataSet, MetricsDataSet  # noqa: F811

    all_datasets = []
    catalog = data_access_manager.catalog.get_catalog()
    experiment_datasets = [
        (ds_name, ds_value)
        for ds_name, ds_value in catalog._data_sets.items()
        if (isinstance(ds_value, (MetricsDataSet, JSONDataSet)))
    ]

    if not experiment_datasets:
        logger.warning("No tracking datasets found in catalog")

    for name, dataset in experiment_datasets:
        all_runs = {}
        for run_id in run_ids:
            runid = ID(run_id)
            file_path = dataset._get_versioned_path(str(runid))
            if Path(file_path).is_file():
                with dataset._fs.open(
                    file_path, **dataset._fs_open_args_load
                ) as fs_file:
                    json_data = json.load(fs_file)
                    all_runs[runid] = json_data
            else:
                logger.warning("`%s`could not be found", file_path)

        tracking_dataset = TrackingDataSet(
            datasetName=name,
            datasetType=f"{dataset.__class__.__module__}.{dataset.__class__.__qualname__}",
            data=format_run_tracking_data(all_runs),
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
    def run_tracking_data(self, run_ids: List[ID]) -> List[TrackingDataSet]:
        """Query to get data for specific runs from the session store"""
        runs = get_run_tracking_data(run_ids)
        return runs

    runs_list: List[Run] = strawberry.field(resolver=get_all_runs)

    @strawberry.field
    def run_metadata(self, run_ids: List[ID]) -> List[Run]:
        """Query to get data for specific runs from the session store"""
        return get_runs(run_ids)


schema = strawberry.Schema(query=Query)

router = APIRouter()

router.add_route("/graphql", GraphQL(schema))
