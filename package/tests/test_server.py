"""
Tests for Kedro-Viz server
"""

import json
from unittest import mock

import pytest
from kedro.pipeline import Pipeline, node

from kedro_viz import server

EXPECTED_PIPELINE_DATA_DEPRECATED = [
    {
        "name": "func([bob_in,parameters]) -> [bob_out]",
        "inputs": ["bob_in", "parameters"],
        "outputs": ["bob_out"],
        "tags": [],
    },
    {
        "name": "my_node",
        "inputs": ["fred_in", "parameters"],
        "outputs": ["fred_out"],
        "tags": ["bob"],
    },
]


EXPECTED_PIPELINE_DATA = {
    "snapshots": [
        {
            "edges": [
                {
                    "target": "task/func([bob_in,parameters]) -> [bob_out]",
                    "source": "data/bob_in",
                },
                {
                    "target": "task/func([bob_in,parameters]) -> [bob_out]",
                    "source": "data/parameters",
                },
                {
                    "target": "data/bob_out",
                    "source": "task/func([bob_in,parameters]) -> [bob_out]",
                },
                {"target": "task/my_node", "source": "data/fred_in"},
                {"target": "task/my_node", "source": "data/parameters"},
                {"target": "data/fred_out", "source": "task/my_node"},
            ],
            "nodes": [
                {
                    "name": "Func",
                    "type": "task",
                    "id": "task/func([bob_in,parameters]) -> [bob_out]",
                    "full_name": "func([bob_in,parameters]) -> [bob_out]",
                    "tags": [],
                },
                {
                    "name": "my_node",
                    "type": "task",
                    "id": "task/my_node",
                    "full_name": "my_node: func([fred_in@pandas,parameters]) -> [fred_out@pandas]",
                    "tags": ["bob"],
                },
                {
                    "is_parameters": False,
                    "name": "Bob In",
                    "tags": [],
                    "id": "data/bob_in",
                    "full_name": "bob_in",
                    "type": "data",
                },
                {
                    "is_parameters": False,
                    "name": "Bob Out",
                    "tags": [],
                    "id": "data/bob_out",
                    "full_name": "bob_out",
                    "type": "data",
                },
                {
                    "is_parameters": False,
                    "name": "Fred In",
                    "tags": ["bob"],
                    "id": "data/fred_in",
                    "full_name": "fred_in",
                    "type": "data",
                },
                {
                    "is_parameters": False,
                    "name": "Fred Out",
                    "tags": ["bob"],
                    "id": "data/fred_out",
                    "full_name": "fred_out",
                    "type": "data",
                },
                {
                    "is_parameters": True,
                    "name": "Parameters",
                    "tags": ["bob"],
                    "id": "data/parameters",
                    "full_name": "parameters",
                    "type": "data",
                },
            ],
            "tags": [{"name": "Bob", "id": "bob"}],
        }
    ]
}


def create_pipeline():
    def func(a, b):  # pylint: disable=unused-argument
        return a

    return Pipeline(
        [
            # unnamed node with no tags and basic io
            node(func, ["bob_in", "parameters"], ["bob_out"]),
            # named node with tags and transcoding
            node(
                func,
                ["fred_in@pandas", "parameters"],
                ["fred_out@pandas"],
                name="my_node",
                tags=["bob"],
            ),
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


def test_deprecated_nodes_endpoint(client):
    """Test `/log/nodes.json` endoint is functional and returns a valid JSON"""
    response = client.get("/logs/nodes.json")
    assert response.status_code == 200
    data = json.loads(response.data.decode())
    assert data == EXPECTED_PIPELINE_DATA_DEPRECATED


def test_nodes_endpoint(client):
    """Test `/api/nodes.json` endoint is functional and returns a valid JSON"""
    response = client.get("/api/nodes.json")
    assert response.status_code == 200
    data = json.loads(response.data.decode())
    assert data == EXPECTED_PIPELINE_DATA
