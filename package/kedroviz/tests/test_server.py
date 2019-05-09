"""
Tests for Kedroviz server
"""

import json
import os.path
from unittest import mock

import pytest

import kedroviz.server


PIPELINE_LOG = "logs/pipeline.log"


def setup_function(function):
    kedroviz.server.logdir = os.path.join(os.path.dirname(__file__), "logs")
    mock.patch("kedroviz.server.webbrowser").start()
    mock.patch("kedroviz.server.app.run").start()


def teardown_function(function):
    mock.patch.stopall()


@pytest.fixture
def client():
    """Create Flask test client as a test fixture"""
    client = kedroviz.server.app.test_client()
    return client


@mock.patch("sys.argv", ("", "--port=3131"))
def test_set_port():
    """Check that port argument is correctly handled"""
    kedroviz.server.main()
    assert kedroviz.server.port == 3131
    kedroviz.server.app.run.assert_called_with(host="127.0.0.1", port=3131)
    assert kedroviz.server.webbrowser.open_new.called


@mock.patch("sys.argv", ("", "--host=0.0.0.0", "--port=8000"))
def test_set_ip():
    """Check that host argument is correctly handled"""
    kedroviz.server.main()
    assert kedroviz.server.host == "0.0.0.0"
    kedroviz.server.app.run.assert_called_with(host="0.0.0.0", port=8000)
    assert kedroviz.server.webbrowser.open_new.called


@mock.patch("sys.argv", ("", "--logdir=/tmp"))
@mock.patch("kedroviz.server.exists")
def test_set_logdir(mock_path_exists):
    """Check that logdir argument is correctly handled"""
    kedroviz.server.main()
    assert kedroviz.server.logdir == "/tmp"


@mock.patch("sys.argv", ("", "--logdir=/tmp", "--no-browser"))
@mock.patch("kedroviz.server.exists")
def test_no_browser(mock_path_exists):
    """
    Check that call to open browser is not performed when `--no-browser`
    argument is specified
    """
    kedroviz.server.main()
    assert not kedroviz.server.webbrowser.open_new.called


# Test endpoints

def test_root_endpoint(client):
    """Test `/` endoint is functional"""
    response = client.get('/')
    assert response.status_code == 200
    assert "Kedro Viz" in response.data.decode()


def test_nodes_endpoint(client):
    """Test `/log/nodes.json` endoint is functional and returns a valid JSON"""
    response = client.get('/logs/nodes.json')
    assert response.status_code == 200
    data = json.loads(response.data.decode())
    assert len(data) == 4
