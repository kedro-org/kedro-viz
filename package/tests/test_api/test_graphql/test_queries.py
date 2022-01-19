import pytest


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
                    {"id": run_id, "bookmark": False} for run_id in example_run_ids
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
            "data": {"runMetadata": [{"id": example_run_ids[0], "bookmark": False}]}
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
                            "col1": [{"runId": example_run_id, "value": 1.0}],
                            "col2": [{"runId": example_run_id, "value": 2.0}],
                            "col3": [{"runId": example_run_id, "value": 3.0}],
                        },
                    },
                    {
                        "datasetName": "more_metrics",
                        "datasetType": "kedro.extras.datasets.tracking."
                        "metrics_dataset.MetricsDataSet",
                        "data": {
                            "col4": [{"runId": example_run_id, "value": 4.0}],
                            "col5": [{"runId": example_run_id, "value": 5.0}],
                            "col6": [{"runId": example_run_id, "value": 6.0}],
                        },
                    },
                    {
                        "datasetName": "json_tracking",
                        "datasetType": "kedro.extras.datasets.tracking.json_dataset.JSONDataSet",
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
                ]
            }
        }
        assert response.json() == expected_response
