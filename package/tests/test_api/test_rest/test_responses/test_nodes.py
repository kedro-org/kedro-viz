from pathlib import Path
from unittest import mock

from fastapi.testclient import TestClient

from kedro_viz.models.flowchart.nodes import TaskNode
from tests.test_api.test_rest.test_responses.assert_helpers import (
    assert_example_transcoded_data,
)


class TestTranscodedDataset:
    """Test a viz API created from a Kedro project."""

    def test_endpoint_main(self, example_transcoded_api):
        client = TestClient(example_transcoded_api)
        response = client.get("/api/main")
        assert response.status_code == 200
        assert_example_transcoded_data(response.json())

    def test_transcoded_data_node_metadata(self, example_transcoded_api):
        client = TestClient(example_transcoded_api)
        response = client.get("/api/nodes/0ecea0de")
        assert response.json() == {
            "filepath": "model_inputs.csv",
            "original_type": "pandas.csv_dataset.CSVDataset",
            "transcoded_types": [
                "pandas.parquet_dataset.ParquetDataset",
            ],
            "run_command": "kedro run --to-outputs=model_inputs@pandas2",
        }


class TestNodeMetadataEndpoint:
    def test_node_not_exist(self, client):
        response = client.get("/api/nodes/foo")
        assert response.status_code == 404

    def test_task_node_metadata(self, client):
        response = client.get("/api/nodes/782e4a43")
        metadata = response.json()
        assert (
            metadata["code"].replace(" ", "")
            == "defprocess_data(raw_data,train_test_split):\npass\n"
        )
        assert metadata["parameters"] == {"uk.data_processing.train_test_split": 0.1}
        assert metadata["inputs"] == [
            "uk.data_processing.raw_data",
            "params:uk.data_processing.train_test_split",
        ]
        assert metadata["outputs"] == ["model_inputs"]
        assert (
            metadata["run_command"]
            == "kedro run --to-nodes='uk.data_processing.process_data'"
        )
        assert str(Path("package/tests/conftest.py")) in metadata["filepath"]

    def test_data_node_metadata(self, client):
        response = client.get("/api/nodes/0ecea0de")
        assert response.json() == {
            "filepath": "model_inputs.csv",
            "type": "pandas.csv_dataset.CSVDataset",
            "preview_type": "TablePreview",
            "run_command": "kedro run --to-outputs=model_inputs",
            "stats": {"columns": 12, "rows": 29768},
        }

    def test_data_node_metadata_for_free_input(self, client):
        response = client.get("/api/nodes/13399a82")
        assert response.json() == {
            "filepath": "raw_data.csv",
            "preview_type": "TablePreview",
            "type": "pandas.csv_dataset.CSVDataset",
        }

    def test_parameters_node_metadata(self, client):
        response = client.get("/api/nodes/f1f1425b")
        assert response.json() == {
            "parameters": {"train_test_split": 0.1, "num_epochs": 1000}
        }

    def test_single_parameter_node_metadata(self, client):
        response = client.get("/api/nodes/f0ebef01")
        assert response.json() == {
            "parameters": {"uk.data_processing.train_test_split": 0.1}
        }

    def test_no_metadata(self, client):
        with mock.patch.object(TaskNode, "has_metadata", return_value=False):
            response = client.get("/api/nodes/782e4a43")
        assert response.json() == {}
