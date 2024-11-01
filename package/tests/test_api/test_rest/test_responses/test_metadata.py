from kedro_viz.api.rest.responses.metadata import get_metadata_response
from kedro_viz.models.metadata import Metadata


class TestAppMetadata:
    def test_get_metadata_response(self, mocker):
        mock_get_compat = mocker.patch(
            "kedro_viz.api.rest.responses.metadata.get_package_compatibilities",
            return_value="mocked_compatibilities",
        )
        mock_set_compat = mocker.patch(
            "kedro_viz.api.rest.responses.metadata.Metadata.set_package_compatibilities"
        )

        response = get_metadata_response()

        # Assert get_package_compatibilities was called
        mock_get_compat.assert_called_once()

        # Assert set_package_compatibilities was called with the mocked compatibilities
        mock_set_compat.assert_called_once_with("mocked_compatibilities")

        # Assert the function returns the Metadata instance
        assert isinstance(response, Metadata)
