from unittest import mock

import pytest
from fastapi.testclient import TestClient

from kedro_viz.api import apps


class TestIndexEndpoint:
    def test_index(self, client):
        response = client.get("/")
        assert response.status_code == 200
        assert "heap" not in response.text
        assert "checkReloadStatus" not in response.text

    @mock.patch("kedro_viz.integrations.kedro.telemetry.get_heap_app_id")
    @mock.patch("kedro_viz.integrations.kedro.telemetry.get_heap_identity")
    def test_heap_enabled(
        self, mock_get_heap_identity, mock_get_heap_app_id, client, tmpdir
    ):
        mock_get_heap_app_id.return_value = "my_heap_app"
        mock_get_heap_identity.return_value = "my_heap_identity"
        response = client.get("/")
        assert response.status_code == 200
        assert 'heap.load("my_heap_app")' in response.text
        assert 'heap.identify("my_heap_identity")' in response.text


@pytest.fixture
def example_autoreload_api():
    yield apps.create_api_app_from_project(mock.MagicMock(), autoreload=True)


class TestReloadEndpoint:
    def test_autoreload_script_added_to_index(self, example_autoreload_api):
        client = TestClient(example_autoreload_api)
        response = client.get("/")
        assert response.status_code == 200
        assert "checkReloadStatus" in response.text

    def test_reload_endpoint_return_400_when_header_not_set(
        self, example_autoreload_api
    ):
        client = TestClient(example_autoreload_api)
        response = client.get("/api/reload")
        assert response.status_code == 400

    @mock.patch("kedro_viz.api.apps._create_etag")
    def test_reload_endpoint_return_304_when_content_has_not_changed(
        self, patched_create_etag
    ):
        patched_create_etag.return_value = "old etag"
        api = apps.create_api_app_from_project(mock.MagicMock(), autoreload=True)

        client = TestClient(api)

        # if the client sends an If-None-Match header with the same value as the etag value
        # on the server, the server should return a 304
        response = client.get("/api/reload", headers={"If-None-Match": "old etag"})
        assert response.status_code == 304

        # when the etag has changed, the server will return a 200
        response = client.get("/api/reload", headers={"If-None-Match": "new etag"})
        assert response.status_code == 200


class TestFaviconEndpoint:
    def test_favicon_endpoint(self, client):
        response = client.get("/favicon.ico")
        assert response.status_code == 200
        assert response.headers["content-type"] in [
            "image/x-icon",
            "image/vnd.microsoft.icon",
        ]


class TestNodeMetadataEndpoint:
    @pytest.mark.parametrize(
        "node_id, expected_status, expected_response",
        [
            ("test", 404, {"message": "Invalid node ID"}),
            (
                "13399a82",
                200,
                {"filepath": "raw_data.csv", "type": "pandas.csv_dataset.CSVDataSet"},
            ),
        ],
    )
    def test_get_node_metadata(
        self, node_id, expected_status, expected_response, client
    ):
        response = client.get(f"/api/nodes/{node_id}")
        assert response.status_code == expected_status
        assert response.json() == expected_response


class TestRegisteredPipelineEndpoint:
    @pytest.mark.parametrize(
        "pipeline_id, expected_status",
        [
            ("test", 404),
            ("data_science", 200),
        ],
    )
    def test_get_registered_pipeline(self, pipeline_id, expected_status, client):
        response = client.get(f"/api/pipelines/{pipeline_id}")
        assert response.status_code == expected_status

        if response.status_code == 200:
            assert response.json()["selected_pipeline"] == pipeline_id
