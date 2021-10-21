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

from strawberry import ID

from kedro_viz.api.graphql import Run, RunMetadata, RunTrackingData, get_run, get_runs


def test_graphql_get_run(example_db_dataset):
    with mock.patch(
        "kedro_viz.data_access.DataAccessManager.db_session", new_callable=PropertyMock
    ) as mock_session:
        mock_session.return_value = example_db_dataset

        tracking_data = RunTrackingData(id="1534326", trackingData="")
        metadata = RunMetadata(
            id="1534326",
            author="",
            gitBranch="",
            gitSha=None,
            bookmark=False,
            title="",
            notes="",
            timestamp="2021-10-21T15.02.12.672Z",
            runCommand="kedro run",
        )
        run = Run(id="1534326", metadata=metadata, trackingData=tracking_data)
        assert get_run(ID("1534326")) == run


def test_graphql_get_runs(example_db_dataset):
    with mock.patch(
        "kedro_viz.data_access.DataAccessManager.db_session", new_callable=PropertyMock
    ) as mock_session:
        mock_session.return_value = example_db_dataset

        tracking_data_1 = RunTrackingData(id="1534326", trackingData="")
        metadata_1 = RunMetadata(
            id="1534326",
            author="",
            gitBranch="",
            gitSha=None,
            bookmark=False,
            title="",
            notes="",
            timestamp="2021-10-21T15.02.12.672Z",
            runCommand="kedro run",
        )
        run_1 = Run(id="1534326", metadata=metadata_1, trackingData=tracking_data_1)

        tracking_data_2 = RunTrackingData(id="41312339", trackingData="")
        metadata_2 = RunMetadata(
            id="41312339",
            author="",
            gitBranch="",
            gitSha=None,
            bookmark=False,
            title="",
            notes="",
            timestamp="2020-11-17T15.02.12.672Z",
            runCommand="kedro run",
        )
        run_2 = Run(id="41312339", metadata=metadata_2, trackingData=tracking_data_2)

        assert get_runs() == [run_1, run_2]


class TestGraphQLEndpoints:
    def test_graphql_run_list_endpoint(self, client, example_db_dataset):
        with mock.patch(
            "kedro_viz.data_access.DataAccessManager.db_session",
            new_callable=PropertyMock,
        ) as mock_session:
            mock_session.return_value = example_db_dataset
            response = client.post(
                "/graphql", json={"query": "{runsList {id metadata {bookmark}}}"}
            )
        assert response.json() == {
            "data": {
                "runsList": [
                    {"id": "1534326", "metadata": {"bookmark": False}},
                    {"id": "41312339", "metadata": {"bookmark": False}},
                ]
            }
        }

    def test_graphql_runs_with_data_endpoint(self, client, example_db_dataset):
        with mock.patch(
            "kedro_viz.data_access.DataAccessManager.db_session",
            new_callable=PropertyMock,
        ) as mock_session:
            mock_session.return_value = example_db_dataset
            response = client.post(
                "/graphql",
                json={
                    "query": "{runsWithData(runIds: [1534326]) {id metadata {bookmark}}}"
                },
            )
        assert response.json() == {
            "data": {
                "runsWithData": [
                    {"id": "1534326", "metadata": {"bookmark": False}},
                ]
            }
        }
