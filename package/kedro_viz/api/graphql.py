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

import typing
from typing import List

import strawberry
from fastapi import APIRouter
from strawberry import ID
from strawberry.asgi import GraphQL

from kedro_viz.data_access import data_access_manager
from kedro_viz.models.run_model import RunModel


def get_run(run_id: ID) -> Run:  # pylint: disable=unused-argument
    """Placeholder for the proper method.
    Get a run by id from the session store.

    Args:
        run_id: ID of the run to fetch

    Returns:
        Run object
    """
    metadata = RunMetadata(
        id=ID("123"),
        author="author",
        gitBranch="my-branch",
        gitSha="892372937",
        notes="",
        runCommand="kedro run",
    )
    details = RunDetails(id=ID("123"), name="name", details="{json:details}")

    return Run(
        id=ID("123"),
        bookmark=True,
        timestamp="2021-09-08T10:55:36.810Z",
        title="Sprint 5",
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


@strawberry.type
class RunModelGraphQLType:
    """RunModel format to return to the frontend"""

    id: str
    blob: str


def get_all_runs() -> typing.List[RunModelGraphQLType]:
    """Gets all runs from the session store

    Returns:
        list of Run objects

    """
    return [
        RunModelGraphQLType(id=kedro_session.id, blob=kedro_session.blob)
        for kedro_session in data_access_manager.db_session.query(RunModel).all()
    ]


@strawberry.type
class Run:
    """Run object format to return to the frontend"""

    id: ID
    bookmark: bool
    timestamp: str
    title: str
    metadata: RunMetadata
    details: RunDetails


@strawberry.type
class RunMetadata:
    """RunMetadata object format"""

    id: ID
    author: str
    gitBranch: str
    gitSha: str
    notes: str
    runCommand: str


@strawberry.type
class RunDetails:
    """RunDetails object format"""

    id: ID
    name: str
    details: str


@strawberry.type
class Query:
    """Query endpoint to get data from the session store"""

    @strawberry.field
    def run(self, run_id: ID) -> Run:
        """Query to get data for a specific run from the session store"""
        return get_run(run_id)

    runs: List[Run] = strawberry.field(resolver=get_runs)
    all_runs: typing.List[RunModelGraphQLType] = strawberry.field(resolver=get_all_runs)


schema = strawberry.Schema(query=Query)

router = APIRouter()

router.add_route("/graphql", GraphQL(schema))
