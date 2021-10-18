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

from pathlib import Path, PosixPath
from typing import List

import strawberry
from fastapi import APIRouter
from strawberry import ID
from strawberry.asgi import GraphQL

from kedro_viz.data_access import data_access_manager
from kedro_viz.models.run_model import RunModel


def format_run(id, run_dict) -> Run:
    """
     {
        "id": "2021-10-13T10.16.31.780Z",
        "blob": "
        {
            'package_name': 'iristest',
            'project_path': PosixPath('/Users/merel_theisen/Projects/Testing/iristest'),
            'session_id': '2021-10-13T10.16.31.780Z',
            'git': {
                'commit_sha': '9483bd8',
                'dirty': True
            },
            'cli': {
                'args': [],
                'params': {
                    'from_inputs': [],
                    'to_outputs': [],
                    'from_nodes': [],
                    'to_nodes': [],
                    'node_names': (),
                    'runner': None,
                    'parallel': False,
                    'is_async': False,
                    'env': None,
                    'tag': (),
                    'load_version': {},
                    'pipeline': None,
                    'config': None,
                    'params': {}
                },
                'command_name': 'run',
                'command_path': 'kedro run'}}"
      },
    Args:
        id:
        run_dict:

    Returns:

    """
    metadata = RunMetadata(
        id=ID(id),
        author="",
        gitBranch="",
        gitSha=run_dict["git"]["commit_sha"],
        bookmark=False,
        title="",
        notes="",
        timestamp=run_dict["session_id"],
        runCommand=run_dict["cli"]["command_path"],
    )
    details = RunDetails(id=ID(id), details="")

    return Run(
        id=ID(id),
        metadata=metadata,
        details=details,
    )


def get_run(run_id: ID) -> Run:  # pylint: disable=unused-argument
    """Get a run by id from the session store.

    Args:
        run_id: ID of the run to fetch

    Returns:
        Run object
    """
    session = data_access_manager.db_session
    run_data = session.query(RunModel).filter(RunModel.id == run_id).first()
    evaluated_blob = eval(run_data.blob)
    return format_run(run_data.id, evaluated_blob)


def get_runs() -> List[Run]:
    """Get all runs from the session store.

    Returns:
        list of Run objects
    """
    runs = []
    session = data_access_manager.db_session
    for run_data in session.query(RunModel).all():
        evaluated_blob = eval(run_data.blob)
        run = format_run(run_data.id, evaluated_blob)
        runs.append(run)
    return runs


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


router = APIRouter()

schema = strawberry.Schema(query=Query)
router.add_route("/graphql", GraphQL(schema))
