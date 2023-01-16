# pylint:disable=line-too-long

import json

import pytest
from semver import VersionInfo

from kedro_viz import __version__


class TestQueryNoSessionStore:
    def test_graphql_run_list_endpoint(self, client):
        response = client.post("/graphql", json={"query": "{runsList {id bookmark}}"})
        assert response.json() == {"data": {"runsList": []}}

    def test_graphql_runs_metadata_endpoint(self, client):
        response = client.post(
            "/graphql",
            json={"query": '{runMetadata(runIds: ["id"]) {id bookmark}}'},
        )
        assert response.json() == {"data": {"runMetadata": []}}


@pytest.mark.usefixtures("data_access_manager_with_no_run")
class TestQueryNoRun:
    def test_graphql_run_list_endpoint(self, client):
        response = client.post("/graphql", json={"query": "{runsList {id bookmark}}"})
        assert response.json() == {"data": {"runsList": []}}

    def test_graphql_runs_metadata_endpoint(self, client):
        response = client.post(
            "/graphql",
            json={"query": '{runMetadata(runIds: ["invalid run id"]) {id bookmark}}'},
        )
        assert response.json() == {"data": {"runMetadata": []}}


@pytest.mark.usefixtures("data_access_manager_with_runs")
class TestQueryWithRuns:
    def test_run_list_query(
        self,
        client,
        example_run_ids,
    ):
        response = client.post("/graphql", json={"query": "{runsList {id bookmark}}"})
        assert response.json() == {
            "data": {
                "runsList": [
                    {"id": run_id, "bookmark": True} for run_id in example_run_ids
                ]
            }
        }

    def test_graphql_runs_metadata_endpoint(self, example_run_ids, client):
        response = client.post(
            "/graphql",
            json={
                "query": f"""{{runMetadata(runIds: ["{ example_run_ids[0] }"]) {{id bookmark}}}}"""
            },
        )
        assert response.json() == {
            "data": {"runMetadata": [{"id": example_run_ids[0], "bookmark": True}]}
        }

    def test_run_tracking_data_query(
        self,
        example_run_ids,
        client,
        example_tracking_catalog,
        data_access_manager_with_runs,
    ):
        data_access_manager_with_runs.add_catalog(example_tracking_catalog)
        example_run_id = example_run_ids[0]

        response = client.post(
            "/graphql",
            json={
                "query": f"""
                {{
                    metrics: runTrackingData(runIds:["{example_run_id}"],group:METRIC)
                {{datasetName, datasetType, data}}
                     json: runTrackingData(runIds:["{example_run_id}"],group:JSON)
                {{datasetName, datasetType, data}}
                    plots: runTrackingData(runIds:["{example_run_id}"],group:PLOT)
                {{datasetName, datasetType, data}}
                }}
                """
            },
        )

        expected_response = {
            "data": {
                "metrics": [
                    {
                        "datasetName": "metrics",
                        "datasetType": "tracking.metrics_dataset.MetricsDataSet",
                        "data": {
                            "col1": [{"runId": example_run_id, "value": 1.0}],
                            "col2": [{"runId": example_run_id, "value": 2.0}],
                            "col3": [{"runId": example_run_id, "value": 3.0}],
                        },
                    },
                    {
                        "datasetName": "more_metrics",
                        "datasetType": "tracking.metrics_dataset.MetricsDataSet",
                        "data": {
                            "col4": [{"runId": example_run_id, "value": 4.0}],
                            "col5": [{"runId": example_run_id, "value": 5.0}],
                            "col6": [{"runId": example_run_id, "value": 6.0}],
                        },
                    },
                ],
                "json": [
                    {
                        "datasetName": "json_tracking",
                        "datasetType": "tracking.json_dataset.JSONDataSet",
                        "data": {
                            "col2": [{"runId": example_run_id, "value": True}],
                            "col3": [{"runId": example_run_id, "value": 3}],
                            "col7": [
                                {
                                    "runId": example_run_id,
                                    "value": "column_seven",
                                }
                            ],
                        },
                    },
                ],
                "plots": [
                    {
                        "datasetName": "plotly_dataset",
                        "datasetType": "plotly.json_dataset.JSONDataSet",
                        "data": {
                            "plotly.json": [
                                {
                                    "runId": "2021-11-03T18.24.24.379Z",
                                    "value": {
                                        "data": [
                                            {
                                                "x": [
                                                    "giraffes",
                                                    "orangutans",
                                                    "monkeys",
                                                ],
                                                "y": [20, 14, 23],
                                                "type": "bar",
                                            }
                                        ]
                                    },
                                }
                            ]
                        },
                    },
                    {
                        "datasetName": "matplotlib_dataset",
                        "datasetType": "matplotlib.matplotlib_writer.MatplotlibWriter",
                        "data": {
                            "matplotlib.png": [
                                {
                                    "runId": "2021-11-03T18.24.24.379Z",
                                    "value": "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVQYV2NgYAAAAAMAAWgmWQ0AAAAASUVORK5CYII=",
                                }
                            ]
                        },
                    },
                ],
            }
        }

        assert response.json() == expected_response

    @pytest.mark.parametrize(
        "show_diff,expected_response",
        [
            (
                True,
                {
                    "data": {
                        "runTrackingData": [
                            {
                                "datasetName": "new_metrics",
                                "datasetType": "tracking.metrics_dataset.MetricsDataSet",
                                "data": {
                                    "col1": [
                                        {
                                            "runId": "2021-11-03T18.24.24.379Z",
                                            "value": 3.0,
                                        },
                                        {
                                            "runId": "2021-11-02T18.24.24.379Z",
                                            "value": 1.0,
                                        },
                                    ],
                                    "col2": [
                                        {
                                            "runId": "2021-11-03T18.24.24.379Z",
                                            "value": 3.23,
                                        },
                                    ],
                                    "col3": [
                                        {
                                            "runId": "2021-11-02T18.24.24.379Z",
                                            "value": 3.0,
                                        },
                                    ],
                                },
                            }
                        ]
                    }
                },
            ),
            (
                False,
                {
                    "data": {
                        "runTrackingData": [
                            {
                                "datasetName": "new_metrics",
                                "datasetType": "tracking.metrics_dataset.MetricsDataSet",
                                "data": {
                                    "col1": [
                                        {
                                            "runId": "2021-11-03T18.24.24.379Z",
                                            "value": 3.0,
                                        },
                                        {
                                            "runId": "2021-11-02T18.24.24.379Z",
                                            "value": 1.0,
                                        },
                                    ],
                                },
                            },
                        ]
                    }
                },
            ),
        ],
    )
    def test_graphql_run_tracking_data(
        self,
        example_run_ids,
        client,
        example_multiple_run_tracking_catalog,
        data_access_manager_with_runs,
        show_diff,
        expected_response,
    ):

        data_access_manager_with_runs.add_catalog(example_multiple_run_tracking_catalog)

        response = client.post(
            "/graphql",
            json={
                "query": f"""{{runTrackingData
                (group: METRIC runIds:{json.dumps(example_run_ids)}, showDiff: {json.dumps(show_diff)})
                {{datasetName, datasetType, data}}}}"""
            },
        )
        assert response.json() == expected_response

    @pytest.mark.parametrize(
        "show_diff,expected_response",
        [
            (
                True,
                {
                    "data": {
                        "runTrackingData": [
                            {
                                "datasetName": "new_metrics",
                                "datasetType": "tracking.metrics_dataset.MetricsDataSet",
                                "data": {
                                    "col1": [
                                        {
                                            "runId": "2021-11-02T18.24.24.379Z",
                                            "value": 1.0,
                                        },
                                    ],
                                    "col3": [
                                        {
                                            "runId": "2021-11-02T18.24.24.379Z",
                                            "value": 3.0,
                                        },
                                    ],
                                },
                            }
                        ]
                    }
                },
            ),
            (
                False,
                {"data": {"runTrackingData": []}},
            ),
        ],
    )
    def test_graphql_run_tracking_data_at_least_one_empty_run(
        self,
        example_run_ids,
        client,
        example_multiple_run_tracking_catalog_at_least_one_empty_run,
        data_access_manager_with_runs,
        show_diff,
        expected_response,
    ):
        data_access_manager_with_runs.add_catalog(
            example_multiple_run_tracking_catalog_at_least_one_empty_run
        )

        response = client.post(
            "/graphql",
            json={
                "query": f"""{{runTrackingData
                (group: METRIC runIds:{json.dumps(example_run_ids)}, showDiff: {json.dumps(show_diff)})
                {{datasetName, datasetType, data}}}}"""
            },
        )
        assert response.json() == expected_response

    @pytest.mark.parametrize(
        "show_diff,expected_response",
        [
            (
                True,
                {"data": {"runTrackingData": []}},
            ),
            (
                False,
                {"data": {"runTrackingData": []}},
            ),
        ],
    )
    def test_graphql_run_tracking_data_all_empty_runs(
        self,
        example_run_ids,
        client,
        example_multiple_run_tracking_catalog_all_empty_runs,
        data_access_manager_with_runs,
        show_diff,
        expected_response,
    ):
        data_access_manager_with_runs.add_catalog(
            example_multiple_run_tracking_catalog_all_empty_runs
        )

        response = client.post(
            "/graphql",
            json={
                "query": f"""{{runTrackingData
                      (group: METRIC runIds:{json.dumps(example_run_ids)}, showDiff: {json.dumps(show_diff)})
                      {{datasetName, datasetType, data}}}}"""
            },
        )
        assert response.json() == expected_response


class TestQueryVersion:
    def test_graphql_version_endpoint(self, client, mocker):
        mocker.patch(
            "kedro_viz.api.graphql.schema.get_latest_version",
            return_value=VersionInfo.parse("1.0.0"),
        )
        response = client.post(
            "/graphql",
            json={"query": "{version {installed isOutdated latest}}"},
        )
        assert response.json() == {
            "data": {
                "version": {
                    "installed": __version__,
                    "isOutdated": False,
                    "latest": "1.0.0",
                }
            }
        }
