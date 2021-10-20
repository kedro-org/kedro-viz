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
# pylint: disable=no-self-use, too-few-public-methods
from __future__ import annotations

import json
from typing import List

import strawberry
from fastapi import APIRouter
from kedro.extras.datasets.tracking import JSONDataSet, MetricsDataSet
from strawberry import ID
from strawberry.asgi import GraphQL

from kedro_viz.data_access import data_access_manager


def get_run(run_id: ID) -> Run:
    """Placeholder for the proper method.
    Get a run by id from the session store.

    Args:
        run_id: ID of the run to fetch

    Returns:
        Run object
    """
    metadata = RunMetadata(
        id=ID(run_id),
        author="",
        gitBranch="",
        gitSha="commit_sha",
        bookmark=False,
        title="",
        notes="",
        timestamp="session_id",
        runCommand="command_path",
    )
    details = RunDetails(id=ID(run_id), details="")

    return Run(
        id=ID(run_id),
        metadata=metadata,
        details=details,
    )


def get_runs() -> List[Run]:
    """Placeholder for the proper method.
    Get all runs from the session store.

    Returns:
        list of Run objects
    """
    return [get_run(ID("123"))]


def get_run_details(run_id: ID) -> RunDetails:
    # pylint: disable=protected-access
    """Get all details for a specific run. Run details contains the data from the
    tracking MetricsDataSet and JSONDataSet instances that have been logged
    during that specific `kedro run`.

    Args:
        run_id:  ID of the run to fetch the details for.

    Returns:
        RunDetails object

    """
    details = {}
    catalog = data_access_manager.catalog.get_catalog()
    experiment_datasets = [
        (ds_name, ds_value)
        for ds_name, ds_value in catalog._data_sets.items()
        if (isinstance(ds_value, (MetricsDataSet, JSONDataSet)))
    ]
    for name, dataset in experiment_datasets:
        file_path = dataset._get_versioned_path(str(run_id))
        with dataset._fs.open(file_path, **dataset._fs_open_args_load) as fs_file:
            json_data = json.load(fs_file)
            details[name] = json_data
    return RunDetails(id=run_id, details=json.dumps(details))


@strawberry.type
class Run:
    """Run object format to return to the frontend"""

    id: ID
    metadata: RunMetadata
    details: RunDetails


@strawberry.type
class RunMetadata:
    """RunMetadata object format"""

    id: ID
    author: str
    gitBranch: str
    gitSha: str
    bookmark: bool
    title: str
    notes: str
    timestamp: str
    runCommand: str


@strawberry.type
class RunDetails:
    """RunDetails object format"""

    id: ID
    details: str


@strawberry.type
class Query:
    """Query endpoint to get data from the session store"""

    @strawberry.field
    def run(self, run_id: ID) -> Run:
        """Query to get data for a specific run from the session store"""
        return get_run(run_id)

    runs: List[Run] = strawberry.field(resolver=get_runs)

    @strawberry.field
    def run_details(self, run_id: ID) -> RunDetails:
        """Query to get run details for a specific run from the session store"""
        return get_run_details(run_id)  # pragma: no cover


schema = strawberry.Schema(query=Query)

router = APIRouter()

router.add_route("/graphql", GraphQL(schema))
