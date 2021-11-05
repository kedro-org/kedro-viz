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


import shutil
from unittest import mock
from unittest.mock import PropertyMock, call, patch

import pytest
from kedro.extras.datasets.pandas import CSVDataSet
from kedro.extras.datasets.tracking import JSONDataSet, MetricsDataSet
from kedro.io import DataCatalog, Version
from strawberry import ID

from kedro_viz.api.graphql import JSONObject, TrackingDataSet, get_run_tracking_data
from kedro_viz.data_access.managers import DataAccessManager


@pytest.fixture
def save_version():
    yield "2021-11-02T18.24.24.379Z"


@pytest.fixture
def example_tracking_catalog(save_version):
    # Note - filepath is assigned without using tmp_path as it fails on windows build.
    # This is a temp soln and will be cleaned up in the future.
    metrics_dataset = MetricsDataSet(
        filepath="test.json",
        version=Version(None, save_version),
    )
    metrics_dataset.save({"col1": 1, "col2": 2, "col3": 3})

    dataset = CSVDataSet(filepath="dataset.csv")

    more_metrics = MetricsDataSet(
        filepath="metrics.json",
        version=Version(None, save_version),
    )
    more_metrics.save({"col4": 4, "col5": 5, "col6": 6})

    json_dataset = JSONDataSet(
        filepath="tracking.json",
        version=Version(None, save_version),
    )
    json_dataset.save({"col7": "column_seven", "col2": True, "col3": 3})

    catalog = DataCatalog(
        data_sets={
            "metrics": metrics_dataset,
            "csv": dataset,
            "more_metrics": more_metrics,
            "json_tracking": json_dataset,
        }
    )

    yield catalog


@pytest.fixture
def example_tracking_output(save_version):
    yield [
        TrackingDataSet(
            datasetName="metrics",
            datasetType="kedro.extras.datasets.tracking.metrics_dataset.MetricsDataSet",
            data={
                "col1": [{"runId": save_version, "value": 1.0}],
                "col2": [{"runId": save_version, "value": 2.0}],
                "col3": [{"runId": save_version, "value": 3.0}],
            },
        ),
        TrackingDataSet(
            datasetName="more_metrics",
            datasetType="kedro.extras.datasets.tracking.metrics_dataset.MetricsDataSet",
            data={
                "col4": [{"runId": save_version, "value": 4.0}],
                "col5": [{"runId": save_version, "value": 5.0}],
                "col6": [{"runId": save_version, "value": 6.0}],
            },
        ),
        TrackingDataSet(
            datasetName="json_tracking",
            datasetType="kedro.extras.datasets.tracking.json_dataset.JSONDataSet",
            data={
                "col2": [{"runId": save_version, "value": True}],
                "col3": [{"runId": save_version, "value": 3}],
                "col7": [{"runId": save_version, "value": "column_seven"}],
            },
        ),
    ]


@pytest.fixture(scope="class", autouse=True)
def cleanup(request):
    """Cleanup a testing directory once we are finished."""

    def remove_test_dir():
        shutil.rmtree("test.json")
        shutil.rmtree("metrics.json")
        shutil.rmtree("tracking.json")

    request.addfinalizer(remove_test_dir)


class TestTrackingData:
    def test_graphql_run_tracking_data_query(
        self,
        data_access_manager: DataAccessManager,
        save_version,
        example_tracking_catalog,
        example_tracking_output,
    ):
        with mock.patch(
            "kedro_viz.api.graphql.data_access_manager", new=data_access_manager
        ):
            data_access_manager.add_catalog(example_tracking_catalog)
            assert get_run_tracking_data([ID(save_version)]) == example_tracking_output

    @patch("logging.Logger.warning")
    def test_graphql_run_tracking_no_filepath_query(
        self,
        patched_warning,
        save_version,
        data_access_manager: DataAccessManager,
    ):
        with mock.patch(
            "kedro_viz.api.graphql.data_access_manager", new=data_access_manager
        ):
            json_dataset = JSONDataSet(
                filepath="tracking_more.json",
                version=Version(None, save_version),
            )

            catalog = DataCatalog(
                data_sets={
                    "json_tracking": json_dataset,
                }
            )
            data_access_manager.add_catalog(catalog)

            assert get_run_tracking_data([ID(save_version)]) == [
                TrackingDataSet(
                    datasetName="json_tracking",
                    datasetType="kedro.extras.datasets.tracking.json_dataset.JSONDataSet",
                    data=JSONObject({}),
                )
            ]

            patched_warning.assert_has_calls(
                [
                    call(
                        "`%s` could not be found",
                        json_dataset._get_versioned_path(str(save_version)),
                    )
                ]
            )


class TestGraphQLEndpoints:
    def test_graphql_run_list_endpoint(self, client, example_db_dataset):
        with mock.patch(
            "kedro_viz.data_access.DataAccessManager.db_session",
            new_callable=PropertyMock,
        ) as mock_session:
            mock_session.return_value = example_db_dataset
            response = client.post(
                "/graphql", json={"query": "{runsList {id bookmark}}"}
            )
        assert response.json() == {
            "data": {
                "runsList": [
                    {"id": "1534326", "bookmark": False},
                    {"id": "41312339", "bookmark": False},
                ]
            }
        }

    def test_graphql_run_list_endpoint_no_dbsession(self, client):
        with mock.patch(
            "kedro_viz.data_access.DataAccessManager.db_session",
            new_callable=PropertyMock,
        ) as mock_session:
            mock_session.return_value = None
            response = client.post(
                "/graphql", json={"query": "{runsList {id bookmark}}"}
            )
        assert response.json() == {"data": {"runsList": []}}

    def test_graphql_runs_metadata_endpoint(self, client, example_db_dataset):
        with mock.patch(
            "kedro_viz.data_access.DataAccessManager.db_session",
            new_callable=PropertyMock,
        ) as mock_session:
            mock_session.return_value = example_db_dataset
            response = client.post(
                "/graphql",
                json={"query": "{runMetadata(runIds: [1534326]) {id bookmark}}"},
            )
        assert response.json() == {
            "data": {
                "runMetadata": [
                    {"id": "1534326", "bookmark": False},
                ]
            }
        }

    def test_graphql_runs_metadata_endpoint_no_dbsession(self, client):
        with mock.patch(
            "kedro_viz.data_access.DataAccessManager.db_session",
            new_callable=PropertyMock,
        ) as mock_session:
            mock_session.return_value = None
            response = client.post(
                "/graphql",
                json={"query": "{runMetadata(runIds: [1534326]) {id bookmark}}"},
            )
        assert response.json() == {"data": {"runMetadata": []}}

    def test_graphql_runs_tracking_data_endpoint(
        self,
        save_version,
        client,
        example_tracking_catalog,
        data_access_manager: DataAccessManager,
    ):
        with mock.patch(
            "kedro_viz.api.graphql.data_access_manager", new=data_access_manager
        ):
            data_access_manager.add_catalog(example_tracking_catalog)

            response = client.post(
                "/graphql",
                json={
                    "query": """{runTrackingData
                    (runIds:["%s"])
                    {datasetName, datasetType, data}}"""
                    % save_version
                },
            )

        expected_response = {
            "data": {
                "runTrackingData": [
                    {
                        "datasetName": "metrics",
                        "datasetType": "kedro.extras.datasets.tracking."
                        "metrics_dataset.MetricsDataSet",
                        "data": {
                            "col1": [{"runId": save_version, "value": 1.0}],
                            "col2": [{"runId": save_version, "value": 2.0}],
                            "col3": [{"runId": save_version, "value": 3.0}],
                        },
                    },
                    {
                        "datasetName": "more_metrics",
                        "datasetType": "kedro.extras.datasets.tracking."
                        "metrics_dataset.MetricsDataSet",
                        "data": {
                            "col4": [{"runId": save_version, "value": 4.0}],
                            "col5": [{"runId": save_version, "value": 5.0}],
                            "col6": [{"runId": save_version, "value": 6.0}],
                        },
                    },
                    {
                        "datasetName": "json_tracking",
                        "datasetType": "kedro.extras.datasets.tracking.json_dataset.JSONDataSet",
                        "data": {
                            "col2": [{"runId": save_version, "value": True}],
                            "col3": [{"runId": save_version, "value": 3}],
                            "col7": [
                                {
                                    "runId": save_version,
                                    "value": "column_seven",
                                }
                            ],
                        },
                    },
                ]
            }
        }
        assert response.json() == expected_response
