import pytest


# Mock the Deployer class
class MockDeployer:
    def __init__(self, platform, endpoint, bucket_name):
        pass

    def deploy(self):
        pass


@pytest.mark.parametrize(
    "platform, endpoint, bucket_name",
    [
        ("aws", "http://mocked-url.com", "s3://shareableviz"),
        ("azure", "http://mocked-url.com", "abfs://shareableviz"),
    ],
)
def test_deploy_kedro_viz(client, platform, endpoint, bucket_name, mocker):
    mocker.patch(
        "kedro_viz.api.rest.router.DeployerFactory.create_deployer",
        return_value=MockDeployer(platform, endpoint, bucket_name),
    )
    response = client.post(
        "/api/deploy",
        json={"platform": platform, "endpoint": endpoint, "bucket_name": bucket_name},
    )

    assert response.status_code == 200
    assert response.json() == {
        "message": f"Website deployed on {platform.upper()}",
        "url": endpoint,
    }


@pytest.mark.parametrize(
    "exception_type, expected_status_code, expected_response",
    [
        (
            None,
            200,
            [
                {
                    "package_name": "fsspec",
                    "package_version": "2023.9.1",
                    "is_compatible": True,
                },
                {
                    "package_name": "kedro-datasets",
                    "package_version": "1.8.0",
                    "is_compatible": False,
                },
            ],
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
