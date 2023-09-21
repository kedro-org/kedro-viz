from unittest.mock import patch

import pytest


# Mock the S3Deployer class
class MockS3Deployer:
    def __init__(self, region, bucket_name):
        pass

    def deploy_and_get_url(self):
        return "http://mocked-url.com"


@pytest.fixture
def mock_s3_deployer():
    with patch("kedro_viz.api.rest.router.S3Deployer", MockS3Deployer):
        yield


@pytest.mark.parametrize(
    "region, bucket_name",
    [("us-east-2", "s3://shareableviz"), ("us-east-1", "shareableviz")],
)
def test_deploy_kedro_viz(client, region, bucket_name, mock_s3_deployer):
    response = client.post(
        "/api/deploy", json={"region": region, "bucket_name": bucket_name}
    )

    assert response.status_code == 200
    assert response.json() == {
        "message": "Website deployed on S3",
        "url": "http://mocked-url.com",
    }


@pytest.mark.parametrize(
    "exception_type, expected_status_code, expected_response",
    [
        (
            None,
            200,
            {
                "package_name": "fsspec",
                "package_version": "2023.9.1",
                "is_compatible": True,
            },
        ),
        (
            Exception,
            500,
            {"message": "Failed to get package compatibility info"},
        ),
    ],
)
def test_get_package_compatibilities(
    client, exception_type, expected_status_code, expected_response, mocker
):
    # Mock the function that may raise an exception
    if exception_type is None:
        mocker.patch(
            "kedro_viz.api.rest.router.get_package_compatibilities_response",
            return_value=expected_response,
        )
    else:
        mocker.patch(
            "kedro_viz.api.rest.router.get_package_compatibilities_response",
            side_effect=exception_type("Test Exception"),
        )

    response = client.get("/api/package-compatibilities")

    assert response.status_code == expected_status_code
    assert response.json() == expected_response
