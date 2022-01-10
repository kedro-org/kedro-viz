import shutil
from pathlib import Path
from unittest import mock
from unittest.mock import PropertyMock, call, patch

import pytest
from kedro.extras.datasets.pandas import CSVDataSet
from kedro.extras.datasets.tracking import JSONDataSet, MetricsDataSet
from kedro.io import DataCatalog, Version
from strawberry import ID
from strawberry.printer import print_schema

from kedro_viz.api.graphql import (
    JSONObject,
    Run,
    TrackingDataset,
    get_run_tracking_data,
    schema,
)
from kedro_viz.data_access.managers import DataAccessManager


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

    shutil.rmtree("test.json", ignore_errors=True)
    shutil.rmtree("metrics.json", ignore_errors=True)
    shutil.rmtree("tracking.json", ignore_errors=True)


@pytest.fixture
def example_multiple_run_tracking_catalog(save_version, save_new_version):
    # Note - filepath is assigned without using tmp_path as it fails on windows build.
    # This is a temp soln and will be cleaned up in the future.
    new_metrics_dataset = MetricsDataSet(
        filepath="test.json",
        version=Version(None, save_version),
    )
    new_metrics_dataset.save({"col1": 1, "col3": 3})
    new_metrics_dataset = MetricsDataSet(
        filepath="test.json",
        version=Version(None, save_new_version),
    )
    new_data = {"col1": 3, "col2": 3.23}
    new_metrics_dataset.save(new_data)
    catalog = DataCatalog(
        data_sets={
            "new_metrics": new_metrics_dataset,
        }
    )

    yield catalog

    shutil.rmtree("test.json", ignore_errors=True)


@pytest.fixture
def example_multiple_run_tracking_catalog_atleast_one_empty_run(
    save_version, save_new_version
):
    # Note - filepath is assigned without using tmp_path as it fails on windows build.
    # This is a temp soln and will be cleaned up in the future.
    new_metrics_dataset = MetricsDataSet(
        filepath="test.json",
        version=Version(None, save_version),
    )
    new_metrics_dataset.save({"col1": 1, "col3": 3})
    new_metrics_dataset = MetricsDataSet(
        filepath="test.json",
        version=Version(None, save_new_version),
    )
    catalog = DataCatalog(
        data_sets={
            "new_metrics": new_metrics_dataset,
        }
    )

    yield catalog

    shutil.rmtree("test.json", ignore_errors=True)


@pytest.fixture
def example_multiple_run_tracking_catalog_all_empty_runs(
    save_version, save_new_version
):
    # Note - filepath is assigned without using tmp_path as it fails on windows build.
    # This is a temp soln and will be cleaned up in the future.
    new_metrics_dataset = MetricsDataSet(
        filepath="test.json",
        version=Version(None, save_version),
    )
    new_metrics_dataset = MetricsDataSet(
        filepath="test.json",
        version=Version(None, save_new_version),
    )
    catalog = DataCatalog(
        data_sets={
            "new_metrics": new_metrics_dataset,
        }
    )

    yield catalog

    shutil.rmtree("test.json", ignore_errors=True)


@pytest.fixture
def example_tracking_output(save_version):
    yield [
        TrackingDataset(
            datasetName="metrics",
            datasetType="kedro.extras.datasets.tracking.metrics_dataset.MetricsDataSet",
            data={
                "col1": [{"runId": save_version, "value": 1.0}],
                "col2": [{"runId": save_version, "value": 2.0}],
                "col3": [{"runId": save_version, "value": 3.0}],
            },
        ),
        TrackingDataset(
            datasetName="more_metrics",
            datasetType="kedro.extras.datasets.tracking.metrics_dataset.MetricsDataSet",
            data={
                "col4": [{"runId": save_version, "value": 4.0}],
                "col5": [{"runId": save_version, "value": 5.0}],
                "col6": [{"runId": save_version, "value": 6.0}],
            },
        ),
        TrackingDataset(
            datasetName="json_tracking",
            datasetType="kedro.extras.datasets.tracking.json_dataset.JSONDataSet",
            data={
                "col2": [{"runId": save_version, "value": True}],
                "col3": [{"runId": save_version, "value": 3}],
                "col7": [{"runId": save_version, "value": "column_seven"}],
            },
        ),
    ]


@pytest.fixture
def example_runs(save_version):
    yield [
        Run(
            id=save_version,
            bookmark=False,
            notes="Hello World",
            title="Hello Kedro",
            timestamp=save_version,
            author="",
            gitBranch="",
            gitSha="",
            runCommand="",
        )
    ]


class TestTrackingData:
    @pytest.mark.parametrize(
        "show_diff,run_tracking_output",
        [
            (
                True,
                [
                    TrackingDataset(
                        datasetName="new_metrics",
                        datasetType="kedro.extras.datasets.tracking.metrics_dataset.MetricsDataSet",
                        data=JSONObject(
                            {
                                "col1": [
                                    {"runId": "2021-11-02T18.24.24.379Z", "value": 1.0},
                                    {"runId": "2021-11-03T18.24.24.379Z", "value": 3.0},
                                ],
                                "col2": [
                                    {
                                        "runId": "2021-11-03T18.24.24.379Z",
                                        "value": 3.23,
                                    },
                                ],
                                "col3": [
                                    {"runId": "2021-11-02T18.24.24.379Z", "value": 3.0},
                                ],
                            }
                        ),
                    )
                ],
            ),
            (
                False,
                [
                    TrackingDataset(
                        datasetName="new_metrics",
                        datasetType="kedro.extras.datasets.tracking.metrics_dataset.MetricsDataSet",
                        data=JSONObject(
                            {
                                "col1": [
                                    {"runId": "2021-11-02T18.24.24.379Z", "value": 1.0},
                                    {"runId": "2021-11-03T18.24.24.379Z", "value": 3.0},
                                ]
                            }
                        ),
                    )
                ],
            ),
        ],
    )
    def test_graphql_run_tracking_data(
        self,
        save_version,
        save_new_version,
        example_multiple_run_tracking_catalog,
        show_diff,
        run_tracking_output,
        data_access_manager: DataAccessManager,
    ):
        with mock.patch(
            "kedro_viz.api.graphql.data_access_manager", new=data_access_manager
        ):

            data_access_manager.add_catalog(example_multiple_run_tracking_catalog)

            assert (
                get_run_tracking_data(
                    [ID(save_version), ID(save_new_version)], show_diff
                )
                == run_tracking_output
            )

    @pytest.mark.parametrize(
        "show_diff,run_tracking_output",
        [
            (
                True,
                [
                    TrackingDataset(
                        datasetName="new_metrics",
                        datasetType="kedro.extras.datasets.tracking.metrics_dataset.MetricsDataSet",
                        data=JSONObject(
                            {
                                "col1": [
                                    {"runId": "2021-11-02T18.24.24.379Z", "value": 1.0},
                                ],
                                "col3": [
                                    {"runId": "2021-11-02T18.24.24.379Z", "value": 3.0},
                                ],
                            }
                        ),
                    )
                ],
            ),
            (
                False,
                [
                    TrackingDataset(
                        datasetName="new_metrics",
                        datasetType="kedro.extras.datasets.tracking.metrics_dataset.MetricsDataSet",
                        data=JSONObject({}),
                    )
                ],
            ),
        ],
    )
    def test_graphql_run_tracking_data_atleast_one_empty_run(
        self,
        save_version,
        save_new_version,
        show_diff,
        example_multiple_run_tracking_catalog_atleast_one_empty_run,
        run_tracking_output,
        data_access_manager: DataAccessManager,
    ):
        with mock.patch(
            "kedro_viz.api.graphql.data_access_manager", new=data_access_manager
        ):

            data_access_manager.add_catalog(
                example_multiple_run_tracking_catalog_atleast_one_empty_run
            )

            assert (
                get_run_tracking_data(
                    [ID(save_version), ID(save_new_version)], show_diff
                )
                == run_tracking_output
            )

    @pytest.mark.parametrize(
        "show_diff,run_tracking_output",
        [
            (
                True,
                [
                    TrackingDataset(
                        datasetName="new_metrics",
                        datasetType="kedro.extras.datasets.tracking.metrics_dataset.MetricsDataSet",
                        data=JSONObject({}),
                    )
                ],
            ),
            (
                False,
                [
                    TrackingDataset(
                        datasetName="new_metrics",
                        datasetType="kedro.extras.datasets.tracking.metrics_dataset.MetricsDataSet",
                        data=JSONObject({}),
                    )
                ],
            ),
        ],
    )
    def test_graphql_run_tracking_data_all_empty_runs(
        self,
        save_version,
        save_new_version,
        example_multiple_run_tracking_catalog_all_empty_runs,
        show_diff,
        run_tracking_output,
        data_access_manager: DataAccessManager,
    ):
        with mock.patch(
            "kedro_viz.api.graphql.data_access_manager", new=data_access_manager
        ):

            data_access_manager.add_catalog(
                example_multiple_run_tracking_catalog_all_empty_runs
            )

            assert (
                get_run_tracking_data(
                    [ID(save_version), ID(save_new_version)], show_diff
                )
                == run_tracking_output
            )

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

            assert get_run_tracking_data([ID(save_version)], False) == [
                TrackingDataset(
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
    def test_graphql_run_list_endpoint(
        self, client, example_db_dataset, save_version, save_new_version
    ):
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
                    {"id": save_version, "bookmark": False},
                    {"id": save_new_version, "bookmark": False},
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

    def test_graphql_runs_metadata_endpoint(
        self, save_version, client, example_db_dataset
    ):
        with mock.patch(
            "kedro_viz.data_access.DataAccessManager.db_session",
            new_callable=PropertyMock,
        ) as mock_session:
            mock_session.return_value = example_db_dataset
            response = client.post(
                "/graphql",
                json={
                    "query": f"""{{runMetadata(runIds: ["{ save_version }"]) {{id bookmark}}}}"""
                },
            )
        assert response.json() == {
            "data": {"runMetadata": [{"id": save_version, "bookmark": False}]}
        }

    def test_graphql_runs_metadata_endpoint_no_dbsession(self, client, save_version):
        with mock.patch(
            "kedro_viz.data_access.DataAccessManager.db_session",
            new_callable=PropertyMock,
        ) as mock_session:
            mock_session.return_value = None
            response = client.post(
                "/graphql",
                json={
                    "query": f"""{{runMetadata(runIds: ["{ save_version }"]) {{id bookmark}}}}"""
                },
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
                    "query": f"""{{runTrackingData
                    (runIds:["{save_version}"])
                    {{datasetName, datasetType, data}}}}"""
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


class TestGraphQLMutation:
    @pytest.mark.parametrize(
        "bookmark,notes,title",
        [
            (
                False,
                "new notes",
                "new title",
            ),
            (True, "new notes", "new title"),
            (True, "", ""),
        ],
    )
    def test_update_user_details_success(
        self,
        bookmark,
        notes,
        title,
        client,
        save_version,
        example_runs,
        example_db_dataset,
        mocker,
    ):
        query = f"""
            mutation updateRun {{
              updateRunDetails(runId: "{save_version}", runInput: {{bookmark: {str(bookmark).lower()}, notes: "{notes}", title: "{title}"}}) {{
                __typename
                ... on UpdateRunDetailsSuccess {{
                 run {{
                    id
                    title
                    bookmark
                    notes
                    }}
                }}
                ... on UpdateRunDetailsFailure {{
                  id
                  errorMessage
                }}
              }}
            }}
        """

        with mock.patch(
            "kedro_viz.data_access.DataAccessManager.db_session",
            new_callable=PropertyMock,
        ) as mock_session:
            mock_session.return_value = example_db_dataset
            mocker.patch("kedro_viz.api.graphql.get_runs").return_value = example_runs
            response = client.post("/graphql", json={"query": query})
            assert response.json() == {
                "data": {
                    "updateRunDetails": {
                        "__typename": "UpdateRunDetailsSuccess",
                        "run": {
                            "id": save_version,
                            "bookmark": bookmark,
                            "title": title if title != "" else save_version,
                            "notes": notes,
                        },
                    }
                }
            }

    def test_update_user_details_only_bookmark(
        self, client, save_version, example_runs, example_db_dataset, mocker
    ):
        query = f"""
            mutation updateRun {{
              updateRunDetails(runId: "{save_version}", runInput: {{bookmark: true}}) {{
                __typename
                ... on UpdateRunDetailsSuccess {{
                  run {{
                    id
                    title
                    bookmark
                    notes
                    }}
                }}
                ... on UpdateRunDetailsFailure {{
                  id
                  errorMessage
                }}
              }}
            }}
        """

        with mock.patch(
            "kedro_viz.data_access.DataAccessManager.db_session",
            new_callable=PropertyMock,
        ) as mock_session:
            mock_session.return_value = example_db_dataset
            mocker.patch("kedro_viz.api.graphql.get_runs").return_value = example_runs
            response = client.post("/graphql", json={"query": query})
            assert response.json() == {
                "data": {
                    "updateRunDetails": {
                        "__typename": "UpdateRunDetailsSuccess",
                        "run": {
                            "id": save_version,
                            "bookmark": True,
                            "title": example_runs[0].title,
                            "notes": example_runs[0].notes,
                        },
                    }
                }
            }

    def test_update_user_details_should_add_when_it_does_not_exist(
        self, save_version, client, example_runs, mocker
    ):
        query = f"""
            mutation updateRun {{
              updateRunDetails(runId: "{save_version}", runInput: {{bookmark: true}}) {{
                __typename
                ... on UpdateRunDetailsSuccess {{
                run {{
                    id
                    title
                    bookmark
                    notes
                    }}
                }}
                ... on UpdateRunDetailsFailure {{
                  id
                  errorMessage
                }}
              }}
            }}
        """

        with mock.patch(
            "kedro_viz.data_access.DataAccessManager.db_session",
            new_callable=PropertyMock,
        ) as mock_session:
            mock_session.return_value.query.return_value.filter.return_value.first.return_value = (
                None
            )
            mocker.patch("kedro_viz.api.graphql.get_runs").return_value = example_runs
            response = client.post("/graphql", json={"query": query})
            assert response.json() == {
                "data": {
                    "updateRunDetails": {
                        "__typename": "UpdateRunDetailsSuccess",
                        "run": {
                            "id": save_version,
                            "bookmark": True,
                            "title": example_runs[0].title,
                            "notes": example_runs[0].notes,
                        },
                    }
                }
            }

    def test_update_user_details_fail(self, client, example_db_dataset, mocker):
        with mock.patch(
            "kedro_viz.data_access.DataAccessManager.db_session",
            new_callable=PropertyMock,
        ) as mock_session:
            mock_session.return_value = example_db_dataset
            mocker.patch("kedro_viz.api.graphql.get_runs").return_value = None
            response = client.post(
                "/graphql",
                json={
                    "query": """mutation {updateRunDetails(
                        runId: "2021-11-02T12.24.24.329Z",
                        runInput: {
                        bookmark: false,
                        title: "Hello Kedro", notes:
                        "There are notes"})
                        {
                            __typename
                            ... on UpdateRunDetailsSuccess {
                            run {
                                id
                                title
                                notes
                                bookmark
                                }
                            }
                            ... on UpdateRunDetailsFailure {
                            id
                            errorMessage
                            } }
                            }"""
                },
            )
            assert response.json() == {
                "data": {
                    "updateRunDetails": {
                        "__typename": "UpdateRunDetailsFailure",
                        "id": "2021-11-02T12.24.24.329Z",
                        "errorMessage": "Given run_id: 2021-11-02T12.24.24.329Z doesn't exist",
                    }
                }
            }


class TestGraphQLSchema:
    def test_apollo_schema(self):
        schema_file = Path(__file__).parents[3] / "src" / "apollo" / "schema.graphql"
        with schema_file.open() as data:
            apollo_schema = data.read()
        assert apollo_schema.strip() == print_schema(schema)
