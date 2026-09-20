from kedro_viz import __version__
from kedro_viz.api.rest.responses.version import get_static_version_response


class TestStaticVersionResponse:
    def test_get_static_version_response(self):
        response = get_static_version_response()

        assert response.installed == str(__version__)
        assert response.is_outdated is False
        assert response.latest == str(__version__)
