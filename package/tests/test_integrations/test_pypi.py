from semver import VersionInfo

from kedro_viz.integrations.pypi import get_latest_version


def test_get_latest_version(mocker, mock_http_response):
    mock_version = "1.0.0"
    requests_get = mocker.patch("requests.get")
    requests_get.return_value = mock_http_response(
        data={"info": {"version": mock_version}}
    )
    assert get_latest_version() == VersionInfo.parse(mock_version)
