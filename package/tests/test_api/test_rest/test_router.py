from unittest.mock import patch

import pytest


# Mock the S3Deployer class
class MockS3Deployer:
    def __init__(self, region, bucket_name):
        pass

    def get_deployed_url(self):
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
                "package_versions": {
                    "aiobotocore": "2.4.2",
                }
            },
        ),  # Positive case with no exception
        (ValueError, 422, {"message": "Failed to get project metadata"}),
        (Exception, 500, {"message": "Failed to get project metadata"}),
    ],
)
def test_get_project_metadata(
    client, exception_type, expected_status_code, expected_response, mocker
):
    def mock_get_project_metadata_response():
        if exception_type:
            raise exception_type("Test exception")

        return expected_response

    mocker.patch(
        "kedro_viz.api.rest.router.get_project_metadata_response",
        side_effect=mock_get_project_metadata_response,
    )

    response = client.get("/api/project-metadata")

    assert response.status_code == expected_status_code
    assert response.json() == expected_response
