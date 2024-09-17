import logging

import pytest

from kedro_viz.api.rest.utils import get_package_compatibilities
from kedro_viz.models.metadata import PackageCompatibility

logger = logging.getLogger(__name__)


@pytest.mark.parametrize(
    "package_name, package_version, package_requirements, expected_compatibility_response",
    [
        (
            "fsspec",
            "2023.9.1",
            {"fsspec": {"min_compatible_version": "2023.0.0"}},
            True,
        ),
        (
            "fsspec",
            "2023.9.1",
            {"fsspec": {"min_compatible_version": "2024.0.0"}},
            False,
        ),
        (
            "kedro-datasets",
            "2.1.0",
            {"kedro-datasets": {"min_compatible_version": "2.1.0"}},
            True,
        ),
        (
            "kedro-datasets",
            "1.8.0",
            {"kedro-datasets": {"min_compatible_version": "2.1.0"}},
            False,
        ),
    ],
)
def test_get_package_compatibilities(
    package_name,
    package_version,
    package_requirements,
    expected_compatibility_response,
    mocker,
):
    mocker.patch(
        "kedro_viz.api.rest.utils.get_package_version",
        return_value=package_version,
    )
    mocker.patch(
        "kedro_viz.api.rest.utils.PACKAGE_REQUIREMENTS",
        package_requirements,
    )

    response = get_package_compatibilities()

    for package_response in response:
        assert package_response.package_name == package_name
        assert package_response.package_version == package_version
        assert package_response.is_compatible is expected_compatibility_response


def test_get_package_compatibilities_exception_response(caplog, mocker):
    mock_package_requirement = {
        "random-package": {
            "min_compatible_version": "1.0.0",
            "warning_message": "random-package is not available",
        }
    }
    mocker.patch(
        "kedro_viz.api.rest.utils.PACKAGE_REQUIREMENTS",
        mock_package_requirement,
    )

    with caplog.at_level(logging.WARNING):
        response = get_package_compatibilities()

        assert len(caplog.records) == 1

        record = caplog.records[0]

        assert record.levelname == "WARNING"
        assert (
            mock_package_requirement["random-package"]["warning_message"]
            in record.message
        )

    expected_response = PackageCompatibility(
        package_name="random-package", package_version="0.0.0", is_compatible=False
    )
    assert response == [expected_response]
