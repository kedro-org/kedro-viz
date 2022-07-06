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
                "query": f"""{{runTrackingData
                (runIds:["{example_run_id}"])
                {{groupedDatasetType, datasets{{ datasetName, datasetType, data}}}}}}"""
            },
        )

        expected_response = {
            "data": {
                "runTrackingData": [
                    {
                        "groupedDatasetType": "Metrics",
                        "datasets": [
                            {
                                "datasetName": "metrics",
                                "datasetType": "Metrics",
                                "data": {
                                    "col1": [{"runId": example_run_id, "value": 1.0}],
                                    "col2": [{"runId": example_run_id, "value": 2.0}],
                                    "col3": [{"runId": example_run_id, "value": 3.0}],
                                },
                            },
                            {
                                "datasetName": "more_metrics",
                                "datasetType": "Metrics",
                                "data": {
                                    "col4": [{"runId": example_run_id, "value": 4.0}],
                                    "col5": [{"runId": example_run_id, "value": 5.0}],
                                    "col6": [{"runId": example_run_id, "value": 6.0}],
                                },
                            },
                        ],
                    },
                    {
                        "groupedDatasetType": "JSON Data",
                        "datasets": [
                            {
                                "datasetName": "json_tracking",
                                "datasetType": "JSON Data",
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
                            }
                        ],
                    },
                    {
                        "groupedDatasetType": "Plots",
                        "datasets": [
                            {
                                "datasetName": "plotly_dataset",
                                "datasetType": "Plotly",
                                "data": {
                                    "plotly.json": [
                                        {
                                            "runId": example_run_id,
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
                                "datasetType": "Matplotlib",
                                "data": {
                                    "matplotlib.png": [
                                        {
                                            "runId": example_run_id,
                                            "value": "iVBORw0KGgoAAAANSUhEUg"
                                            "AAAAEAAAABCAQAAAC1HAwCAA"
                                            "AAC0lEQVQYV2NgYAAAAAM"
                                            "AAWgmWQ0AAAAASUVORK5CYII=",
                                        }
                                    ]
                                },
                            },
                        ],
                    },
                ]
            }
        }
        assert response.json() == expected_response


class TestQueryVersion:
    def test_graphql_version_endpoint(self, client, mocker):
        mocker.patch(
            "kedro_viz.api.graphql.get_latest_version",
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
