import pytest
from packaging.version import parse

from kedro_viz import __version__


class TestQueryVersion:
    def test_graphql_version_endpoint(self, client, mocker):
        mocker.patch(
            "kedro_viz.api.graphql.schema.get_latest_version",
            return_value=parse("1.0.0"),
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
