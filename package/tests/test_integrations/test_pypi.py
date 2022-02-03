import pytest
from semver import VersionInfo

from kedro_viz.integrations.pypi import get_latest_version, is_running_outdated_version


def test_get_latest_version(mocker, mock_http_response):
    mock_version = "1.0.0"
    requests_get = mocker.patch("requests.get")
    requests_get.return_value = mock_http_response(
        data={"info": {"version": mock_version}}
    )
    assert get_latest_version() == VersionInfo.parse(mock_version)


@pytest.mark.parametrize(
    "installed_version, latest_version, is_outdated",
    [("1.0.0", "1.2.3", True), ("1.2.3", "1.0.0", False), ("1.0.0", None, False)],
)
def test_is_running_outdated_version(installed_version, latest_version, is_outdated):
    installed_version = VersionInfo.parse(installed_version)
    if latest_version is not None:
        latest_version = VersionInfo.parse(latest_version)
    assert is_running_outdated_version(installed_version, latest_version) == is_outdated
