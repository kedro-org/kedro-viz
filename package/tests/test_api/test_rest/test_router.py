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
