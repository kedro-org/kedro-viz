"""The live ``/api/main`` and ``/api/pipelines/{id}`` route tests were retired with the live graph
engine — those routes are now served by the inspection adapter (see
``tests/test_inspection_adapter/``: ``test_router_flag_on`` for the routes and
``test_graph_shape`` for the deep graph-shape coverage ported from here).

What remains here is the ``--load-file`` path, which serves a pre-saved JSON bundle directly and is
independent of the graph engine.
"""

from pathlib import Path

from fastapi.testclient import TestClient

from kedro_viz.api import apps
from tests.test_api.test_rest.test_responses.assert_helpers import (
    assert_example_data_from_file,
)


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
