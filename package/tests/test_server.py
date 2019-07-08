"""
Tests for Kedro-Viz server
"""

import json
from unittest import mock

import pytest
from kedro.pipeline import Pipeline, node

from kedro_viz import server

EXPECTED_PIPELINE_DATA_OLD = [
    {
        "name": "split",
        "inputs": ["parameters", "example_iris_data"],
        "outputs": [
            "example_train_y",
            "example_train_x",
            "example_test_y",
            "example_test_x",
        ],
        "tags": [],
    },
    {
        "name": "train",
        "inputs": ["example_train_y", "example_train_x", "parameters"],
        "outputs": ["example_model"],
        "tags": ["bob"],
    },
    {
        "name": "predict",
        "inputs": ["example_test_x", "example_model"],
        "outputs": ["example_predictions"],
        "tags": ["fred"],
    },
    {
        "name": "report_accuracy([example_predictions,example_test_y]) -> None",
        "inputs": ["example_predictions", "example_test_y"],
        "outputs": [],
        "tags": [],
    },
]


EXPECTED_PIPELINE_DATA = {
    "snapshots": [
        {
            "edges": [
                {"source": "data/parameters", "target": "task/split"},
                {"source": "data/example_iris_data", "target": "task/split"},
                {"source": "task/split", "target": "data/example_train_y"},
                {"source": "task/split", "target": "data/example_train_x"},
                {"source": "task/split", "target": "data/example_test_y"},
                {"source": "task/split", "target": "data/example_test_x"},
                {"source": "data/example_train_y", "target": "task/train"},
                {"source": "data/example_train_x", "target": "task/train"},
                {"source": "data/parameters", "target": "task/train"},
                {"source": "task/train", "target": "data/example_model"},
                {"source": "data/example_test_x", "target": "task/predict"},
                {"source": "data/example_model", "target": "task/predict"},
                {"source": "task/predict", "target": "data/example_predictions"},
                {
                    "source": "data/example_predictions",
                    "target": "task/report_accuracy([example_predictions,example_test_y]) -> None",
                },
                {
                    "source": "data/example_test_y",
                    "target": "task/report_accuracy([example_predictions,example_test_y]) -> None",
                },
            ],
            "nodes": [
                {
                    "full_name": (
                        "split: "
                        "split_data([example_iris_data,parameters]) -> "
                        "[example_test_x,example_test_y,example_train_x,example_train_y@spark]"
                    ),
                    "id": "task/split",
                    "name": "split",
                    "tags": [],
                    "type": "task",
                },
                {
                    "full_name": (
                        "train: "
                        "train_model([example_train_x,example_train_y@pandas,parameters]) -> "
                        "[example_model]"
                    ),
                    "id": "task/train",
                    "name": "train",
                    "tags": ["bob"],
                    "type": "task",
                },
                {
                    "full_name": (
                        "predict: "
                        "predict([example_model,example_test_x]) -> "
                        "[example_predictions]"
                    ),
                    "id": "task/predict",
                    "name": "predict",
                    "tags": ["fred"],
                    "type": "task",
                },
                {
                    "full_name": (
                        "report_accuracy([example_predictions,example_test_y]) -> "
                        "None"
                    ),
                    "id": (
                        "task/report_accuracy([example_predictions,example_test_y]) -> "
                        "None"
                    ),
                    "name": "Report Accuracy",
                    "tags": [],
                    "type": "task",
                },
                {
                    "full_name": "example_iris_data",
                    "id": "data/example_iris_data",
                    "name": "Example Iris Data",
                    "tags": [],
                    "type": "data",
                },
                {
                    "full_name": "example_model",
                    "id": "data/example_model",
                    "name": "Example Model",
                    "tags": ["bob", "fred"],
                    "type": "data",
                },
                {
                    "full_name": "example_predictions",
                    "id": "data/example_predictions",
                    "name": "Example Predictions",
                    "tags": ["fred"],
                    "type": "data",
                },
                {
                    "full_name": "example_test_x",
                    "id": "data/example_test_x",
                    "name": "Example Test X",
                    "tags": ["fred"],
                    "type": "data",
                },
                {
                    "full_name": "example_test_y",
                    "id": "data/example_test_y",
                    "name": "Example Test Y",
                    "tags": [],
                    "type": "data",
                },
                {
                    "full_name": "example_train_x",
                    "id": "data/example_train_x",
                    "name": "Example Train X",
                    "tags": ["bob"],
                    "type": "data",
                },
                {
                    "full_name": "example_train_y",
                    "id": "data/example_train_y",
                    "name": "Example Train Y",
                    "tags": ["bob"],
                    "type": "data",
                },
                {
                    "full_name": "parameters",
                    "id": "data/parameters",
                    "name": "Parameters",
                    "tags": ["bob"],
                    "type": "parameters",
                },
            ],
            "tags": [{"id": "bob", "name": "Bob"}, {"id": "fred", "name": "Fred"}],
        }
    ]
}


def create_pipeline():
    def split_data(a, b):  # pylint: disable=unused-argument
        return 1, 2, 3, 4

    def train_model(a, b, c):  # pylint: disable=unused-argument
        return 1

    def predict(a, b):  # pylint: disable=unused-argument
        return 1

    def report_accuracy(a, b):  # pylint: disable=unused-argument
        return None

    return Pipeline(
        [
            node(
                split_data,
                ["parameters", "example_iris_data"],
                [
                    "example_train_y@spark",
                    "example_train_x",
                    "example_test_y",
                    "example_test_x",
                ],
                name="split",
            ),
            node(
                train_model,
                ["example_train_y@pandas", "example_train_x", "parameters"],
                ["example_model"],
                name="train",
                tags=["bob"],
            ),
            node(
                predict,
                ["example_test_x", "example_model"],
                ["example_predictions"],
                name="predict",
                tags=["fred"],
            ),
            node(report_accuracy, ["example_predictions", "example_test_y"], []),
        ]
    )


def get_project_context(key):
    assert key == "create_pipeline"
    return create_pipeline


def setup_function():
    mock.patch("kedro_viz.server.webbrowser").start()
    mock.patch("kedro_viz.server.app.run").start()
    mock.patch("kedro_viz.server.get_project_context", new=get_project_context).start()


def teardown_function():
    mock.patch.stopall()


@pytest.fixture
def client():
    """Create Flask test client as a test fixture"""
    client = server.app.test_client()
    return client


def test_set_port(cli_runner):
    """Check that port argument is correctly handled"""
    result = cli_runner.invoke(server.commands, ["viz", "--port", "8000"])
    assert result.exit_code == 0, result.output
    server.app.run.assert_called_with(host="127.0.0.1", port=8000)
    assert server.webbrowser.open_new.called_with("http://127.0.0.1:8000/")


def test_set_ip(cli_runner):
    """Check that host argument is correctly handled"""
    result = cli_runner.invoke(server.commands, ["viz", "--host", "0.0.0.0"])
    assert result.exit_code == 0, result.output
    server.app.run.assert_called_with(host="0.0.0.0", port=4141)
    assert server.webbrowser.open_new.called_with("http://127.0.0.1:4141/")


def test_no_browser(cli_runner):
    """
    Check that call to open browser is not performed when `--no-browser`
    argument is specified
    """
    result = cli_runner.invoke(server.commands, ["viz", "--no-browser"])
    assert result.exit_code == 0, result.output
    assert not server.webbrowser.open_new.called
    result = cli_runner.invoke(server.commands, ["viz"])
    assert result.exit_code == 0, result.output
    assert server.webbrowser.open_new.called


# Test endpoints


def test_root_endpoint(client):
    """Test `/` endoint is functional"""
    response = client.get("/")
    assert response.status_code == 200
    assert "Kedro Viz" in response.data.decode()


def test_old_nodes_endpoint(client):
    """Test `/log/nodes.json` endoint is functional and returns a valid JSON"""
    response = client.get("/logs/nodes.json")
    assert response.status_code == 200
    data = json.loads(response.data.decode())
    assert data == EXPECTED_PIPELINE_DATA_OLD


def test_nodes_endpoint(client):
    """Test `/api/nodes.json` endoint is functional and returns a valid JSON"""
    response = client.get("/api/nodes.json")
    assert response.status_code == 200
    data = json.loads(response.data.decode())
    assert data == EXPECTED_PIPELINE_DATA
