import json
from pathlib import Path

from fastapi.testclient import TestClient

from kedro_viz.api import apps
from kedro_viz.api.rest.responses.pipelines import get_kedro_project_json_data
from tests.test_api.test_rest.test_responses.assert_helpers import (
    assert_dict_list_equal,
    assert_example_data,
    assert_example_data_from_file,
    assert_modular_pipelines_tree_equal,
    assert_nodes_equal,
)


class TestMainEndpoint:
    """Test a viz API created from a Kedro project."""

    def test_endpoint_main(self, client, mocker, data_access_manager):
        mocker.patch(
            "kedro_viz.api.rest.responses.nodes.data_access_manager",
            new=data_access_manager,
        )
        response = client.get("/api/main")
        assert_example_data(response.json())

    def test_endpoint_main_no_default_pipeline(self, example_api_no_default_pipeline):
        client = TestClient(example_api_no_default_pipeline)
        response = client.get("/api/main")
        assert len(response.json()["nodes"]) == 6
        assert len(response.json()["edges"]) == 9
        assert response.json()["pipelines"] == [
            {"id": "data_science", "name": "data_science"},
            {"id": "data_processing", "name": "data_processing"},
        ]

    def test_endpoint_main_for_pipelines_with_additional_tags(
        self,
        example_api_for_pipelines_with_additional_tags,
    ):
        expected_tags = [
            {"id": "tag1", "name": "tag1"},
            {"id": "tag2", "name": "tag2"},
            {"id": "validation", "name": "validation"},
        ]
        client = TestClient(example_api_for_pipelines_with_additional_tags)
        response = client.get("/api/main")
        actual_tags = response.json()["tags"]
        assert actual_tags == expected_tags

    def test_endpoint_main_for_edge_case_pipelines(
        self,
        example_api_for_edge_case_pipelines,
        expected_modular_pipeline_tree_for_edge_cases,
    ):
        client = TestClient(example_api_for_edge_case_pipelines)
        response = client.get("/api/main")
        actual_modular_pipelines_tree = response.json()["modular_pipelines"]
        assert_modular_pipelines_tree_equal(
            actual_modular_pipelines_tree, expected_modular_pipeline_tree_for_edge_cases
        )

    def test_get_kedro_project_json_data(self, mocker):
        expected_json_data = {"key": "value"}
        encoded_response = json.dumps(expected_json_data).encode("utf-8")

        mock_get_default_response = mocker.patch(
            "kedro_viz.api.rest.responses.pipelines.get_pipeline_response",
            return_value={"key": "value"},
        )
        mock_get_encoded_response = mocker.patch(
            "kedro_viz.api.rest.responses.pipelines.get_encoded_response",
            return_value=encoded_response,
        )

        json_data = get_kedro_project_json_data()

        mock_get_default_response.assert_called_once()
        mock_get_encoded_response.assert_called_once_with(
            mock_get_default_response.return_value
        )
        assert json_data == expected_json_data


class TestSinglePipelineEndpoint:
    def test_get_pipeline(self, client):
        response = client.get("/api/pipelines/data_science")
        assert response.status_code == 200
        response_data = response.json()
        expected_edges = [
            {"source": "f2b25286", "target": "d5a8b994"},
            {"source": "f1f1425b", "target": "uk.data_science"},
            {"source": "f1f1425b", "target": "f2b25286"},
            {"source": "uk.data_science", "target": "d5a8b994"},
            {"source": "uk", "target": "d5a8b994"},
            {"source": "0ecea0de", "target": "uk"},
            {"source": "0ecea0de", "target": "uk.data_science"},
            {"source": "f1f1425b", "target": "uk"},
            {"source": "0ecea0de", "target": "f2b25286"},
        ]
        assert_dict_list_equal(
            response_data.pop("edges"), expected_edges, sort_keys=("source", "target")
        )
        expected_nodes = [
            {
                "id": "0ecea0de",
                "name": "model_inputs",
                "tags": ["train", "split"],
                "pipelines": ["__default__", "data_science", "data_processing"],
                "modular_pipelines": ["uk.data_science", "uk.data_processing"],
                "type": "data",
                "layer": "model_inputs",
                "dataset_type": "pandas.csv_dataset.CSVDataset",
                "stats": {"columns": 12, "rows": 29768},
            },
            {
                "id": "f2b25286",
                "name": "train_model",
                "tags": ["train"],
                "pipelines": ["__default__", "data_science"],
                "modular_pipelines": ["uk.data_science"],
                "type": "task",
                "parameters": {
                    "train_test_split": 0.1,
                    "num_epochs": 1000,
                },
            },
            {
                "id": "f1f1425b",
                "name": "parameters",
                "tags": ["train"],
                "pipelines": ["__default__", "data_science"],
                "modular_pipelines": None,
                "type": "parameters",
                "layer": None,
                "dataset_type": None,
                "stats": None,
            },
            {
                "id": "d5a8b994",
                "name": "uk.data_science.model",
                "tags": ["train"],
                "pipelines": ["__default__", "data_science"],
                "modular_pipelines": ["uk", "uk.data_science"],
                "type": "data",
                "layer": None,
                "dataset_type": "io.memory_dataset.MemoryDataset",
                "stats": None,
            },
            {
                "id": "uk",
                "name": "uk",
                "tags": ["train"],
                "pipelines": ["data_science"],
                "type": "modularPipeline",
                "modular_pipelines": None,
                "layer": None,
                "dataset_type": None,
                "stats": None,
            },
            {
                "id": "uk.data_science",
                "name": "uk.data_science",
                "tags": ["train"],
                "pipelines": ["data_science"],
                "type": "modularPipeline",
                "modular_pipelines": None,
                "layer": None,
                "dataset_type": None,
                "stats": None,
            },
        ]
        assert_nodes_equal(response_data.pop("nodes"), expected_nodes)

        expected_modular_pipelines = {
            "__root__": {
                "children": [
                    {"id": "f1f1425b", "type": "parameters"},
                    {"id": "0ecea0de", "type": "data"},
                    {"id": "uk", "type": "modularPipeline"},
                    {"id": "d5a8b994", "type": "data"},
                ],
                "id": "__root__",
                "inputs": [],
                "name": "__root__",
                "outputs": [],
            },
            "uk": {
                "children": [
                    {"id": "uk.data_science", "type": "modularPipeline"},
                ],
                "id": "uk",
                "inputs": ["0ecea0de", "f1f1425b"],
                "name": "uk",
                "outputs": ["d5a8b994"],
            },
            "uk.data_science": {
                "children": [
                    {"id": "f2b25286", "type": "task"},
                ],
                "id": "uk.data_science",
                "inputs": ["0ecea0de", "f1f1425b"],
                "name": "uk.data_science",
                "outputs": ["d5a8b994"],
            },
        }

        assert_modular_pipelines_tree_equal(
            response_data.pop("modular_pipelines"),
            expected_modular_pipelines,
        )

        # Extract and sort the layers field
        response_data_layers_sorted = sorted(response_data["layers"])
        expected_layers_sorted = sorted(["model_inputs", "raw"])
        assert response_data_layers_sorted == expected_layers_sorted

        # Remove the layers field from response_data for further comparison
        response_data.pop("layers")

        # Expected response without the layers field
        expected_response_without_layers = {
            "tags": [
                {"id": "split", "name": "split"},
                {"id": "train", "name": "train"},
            ],
            "pipelines": [
                {"id": "__default__", "name": "__default__"},
                {"id": "data_science", "name": "data_science"},
                {"id": "data_processing", "name": "data_processing"},
            ],
            "selected_pipeline": "data_science",
        }
        assert response_data == expected_response_without_layers

    def test_get_non_existing_pipeline(self, client):
        response = client.get("/api/pipelines/foo")
        assert response.status_code == 404


class TestAPIAppFromFile:
    def test_api_app_from_json_file_main_api(self):
        filepath = str(Path(__file__).parent.parent.parent)
        api_app = apps.create_api_app_from_file(filepath)
        client = TestClient(api_app)
        response = client.get("/api/main")
        assert_example_data_from_file(response.json())

    def test_api_app_from_json_file_index(self):
        filepath = str(Path(__file__).parent.parent.parent)
        api_app = apps.create_api_app_from_file(filepath)
        client = TestClient(api_app)
        response = client.get("/")
        assert response.status_code == 200
