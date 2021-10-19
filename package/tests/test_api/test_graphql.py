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
from unittest import mock
from unittest.mock import PropertyMock

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from strawberry import ID

from kedro_viz.api.graphql import Run, RunDetails, RunMetadata, get_run, get_runs
from kedro_viz.models.run_model import Base, RunModel


@pytest.fixture(scope="function")
def setup_database():
    engine = create_engine("sqlite://")
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    yield session
    session.close()


@pytest.fixture(scope="function")
def add_data(setup_database):

    session = setup_database

    # Creates runs
    run_data_1 = RunModel(
        id="123",
        blob="{'package_name': 'iristest','project_path': PosixPath("
        "'/Users/Projects/Testing/iristest'),'session_id': "
        "'2021-10-13T10.16.31.780Z','git': {'commit_sha': '986a68','dirty': True},"
        "'cli': {'args': [],'params': {'from_inputs': [],'to_outputs': [],'from_nodes': [],"
        "'to_nodes': [],'node_names': (),'runner': None,'parallel': False,'is_async': False,"
        "'env': None,'tag': (),'load_version': {},'pipeline': None,'config': None,'params': "
        "{}},'command_name': 'run','command_path': 'kedro run'}} ",
    )
    session.add(run_data_1)

    run_data_2 = RunModel(
        id="456",
        blob="{'package_name': 'my_proj','project_path': PosixPath("
        "'/Users/Projects/Testing/my_proj'),'session_id': "
        "'2020-11-11T10.16.31.780Z','git': {'commit_sha': '765m18','dirty': True},"
        "'cli': {'args': [],'params': {'from_inputs': [],'to_outputs': [],'from_nodes': [],"
        "'to_nodes': [],'node_names': (),'runner': None,'parallel': False,'is_async': False,"
        "'env': None,'tag': (),'load_version': {},'pipeline': None,'config': None,'params': "
        "{}},'command_name': 'run','command_path': 'kedro run'}} ",
    )
    session.add(run_data_2)
    session.commit()

    yield session


def test_graphql_run_query(add_data):
    db_session = add_data
    with mock.patch(
        "kedro_viz.data_access.DataAccessManager.db_session", new_callable=PropertyMock
    ) as mock_session:
        mock_session.return_value = db_session

        details = RunDetails(id="123", details="")
        metadata = RunMetadata(
            id="123",
            author="",
            gitBranch="",
            gitSha="986a68",
            bookmark=False,
            title="",
            notes="",
            timestamp="2021-10-13T10.16.31.780Z",
            runCommand="kedro run",
        )
        run = Run(id="123", metadata=metadata, details=details)
        assert get_run(ID("123")) == run


def test_graphql_runs_query(add_data):
    db_session = add_data
    with mock.patch(
        "kedro_viz.data_access.DataAccessManager.db_session", new_callable=PropertyMock
    ) as mock_session:
        mock_session.return_value = db_session

        details_1 = RunDetails(id="123", details="")
        metadata_1 = RunMetadata(
            id="123",
            author="",
            gitBranch="",
            gitSha="986a68",
            bookmark=False,
            title="",
            notes="",
            timestamp="2021-10-13T10.16.31.780Z",
            runCommand="kedro run",
        )
        run_1 = Run(id="123", metadata=metadata_1, details=details_1)

        details_2 = RunDetails(id="456", details="")
        metadata_2 = RunMetadata(
            id="456",
            author="",
            gitBranch="",
            gitSha="765m18",
            bookmark=False,
            title="",
            notes="",
            timestamp="2020-11-11T10.16.31.780Z",
            runCommand="kedro run",
        )
        run_2 = Run(id="456", metadata=metadata_2, details=details_2)

        assert get_runs() == [run_1, run_2]
