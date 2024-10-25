from kedro_viz.api.rest.responses.base import APINotFoundResponse


def test_api_not_found_response_valid_message():
    response = APINotFoundResponse(message="Resource not found")
    assert response.message == "Resource not found"

    # Test that the model is serializable to a dictionary
    serialized_response = response.model_dump()
    assert serialized_response == {"message": "Resource not found"}
