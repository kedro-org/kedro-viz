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
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from kedro_viz.api.graphql import schema
from kedro_viz.models.run_model import RunModel, Base


def create_test_db_engine():
    SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"

    engine = create_engine(
        SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
    )
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    return engine, TestingSessionLocal


def override_get_db():
    engine, session_class = create_test_db_engine()
    Base.metadata.create_all(bind=engine)
    db = session_class()
    try:
        yield db
    finally:
        db.close()


def test_graphql_run_query(mocker):
    mocker.patch(
        "kedro_viz.database.create_db_engine",
        return_value=create_test_db_engine(),
    )
    mocker.patch(
        "kedro_viz.data_access.data_access_manager.db_session"
    )
    db = next(override_get_db())
    run_data = RunModel(
        id="123",
        blob="{'package_name': 'iristest','project_path': PosixPath("
        "'/Users/merel_theisen/Projects/Testing/iristest'),'session_id': "
        "'2021-10-13T10.16.31.780Z','git': {'commit_sha': '986a68','dirty': True},"
        "'cli': {'args': [],'params': {'from_inputs': [],'to_outputs': [],'from_nodes': [],"
        "'to_nodes': [],'node_names': (),'runner': None,'parallel': False,'is_async': False,"
        "'env': None,'tag': (),'load_version': {},'pipeline': None,'config': None,'params': "
        "{}},'command_name': 'run','command_path': 'kedro run'}} ",
    )

    db.add(run_data)
    db.commit()

    query = """
            query TestQuery($runId: ID!) {
                run(runId: $runId) {
                    id
                    metadata {
                        gitSha
                        bookmark
                        timestamp
                        title
                        notes
                    }
                    details {
                        details
                    }
                }
            }
        """

    result = schema.execute_sync(
        query,
        variable_values={"runId": "123"},
    )

    assert result.errors is None
    assert result.data["run"] == {
        "id": "123",
        "metadata": {
            "gitSha": "986a68",
            "notes": "",
            "bookmark": True,
            "timestamp": "2021-09-08T10:55:36.810Z",
            "title": "Sprint 5",
        },
        "details": {"details": "{json:details}"},
    }


def test_graphql_runs_query():
    query = """
                query TestQuery{
                    runs {
                        id
                        metadata {
                            bookmark
                            timestamp
                            title
                        }
                    }
                }
            """

    result = schema.execute_sync(
        query,
    )

    assert result.errors is None
    assert result.data["runs"] == [
        {
            "id": "123",
            "metadata": {
                "bookmark": True,
                "timestamp": "2021-09-08T10:55:36.810Z",
                "title": "Sprint 5",
            },
        }
    ]
