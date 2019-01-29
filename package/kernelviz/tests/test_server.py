"""
Tests for Kernelviz server
"""

import json
import os.path
from unittest import mock

import pytest

import kernelviz
import kernelviz.server as kv_server


PIPELINE_LOG = "logs/pipeline.log"


def setup_function(function):
    kernelviz.server.logdir = os.path.join(os.path.dirname(__file__), "logs")
    mock.patch("kernelviz.server.webbrowser").start()
    mock.patch("kernelviz.server.app.run").start()


@pytest.fixture
def client():
    client = kv_server.app.test_client()
    return client


@mock.patch("sys.argv", ("", "--port=3131"))
def test_set_port():
    kernelviz.server.main()
    assert kernelviz.server.port == 3131
    kernelviz.server.app.run.assert_called_with(port=3131)
    assert kernelviz.server.webbrowser.open_new.called


@mock.patch("sys.argv", ("", "--logdir=/tmp"))
@mock.patch("kernelviz.server.exists")
def test_set_logdir(mock_path_exists):
    kernelviz.server.main()
    mock_path_exists.return_value = True
    assert kernelviz.server.logdir == "/tmp"


@mock.patch("sys.argv", ("", "--logdir=/tmp", "--no-browser"))
@mock.patch("kernelviz.server.exists")
def test_no_browser(mock_path_exists):
    mock_path_exists.return_value = True
    kernelviz.server.main()
    assert not kernelviz.server.webbrowser.open_new.called


# Test endpoints

def test_root_endpoint(client):
    response = client.get('/')
    assert response.status_code == 200
    assert "KernelAI Pipeline Viz" in response.data.decode()


def test_nodes_endpoint(client):
    response = client.get('/logs/nodes.json')
    assert response.status_code == 200
    data = json.loads(response.data.decode())
    assert len(data) == 4
