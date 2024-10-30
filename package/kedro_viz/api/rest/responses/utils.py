"""`kedro_viz.api.rest.responses.utils` contains utility
response classes and functions for the REST endpoints"""

import logging
from typing import Any

import orjson
from fastapi.encoders import jsonable_encoder
from fastapi.responses import ORJSONResponse

logger = logging.getLogger(__name__)


class EnhancedORJSONResponse(ORJSONResponse):
    """
    EnhancedORJSONResponse is a subclass of ORJSONResponse that provides
    additional functionality for encoding content to a human-readable JSON format.
    """

    @staticmethod
    def encode_to_human_readable(content: Any) -> bytes:
        """A method to encode the given content to JSON, with the
        proper formatting to write a human-readable file.

        Returns:
            A bytes object containing the JSON to write.

        """
        return orjson.dumps(
            content,
            option=orjson.OPT_INDENT_2
            | orjson.OPT_NON_STR_KEYS
            | orjson.OPT_SERIALIZE_NUMPY,
        )


def get_encoded_response(response: Any) -> bytes:
    """Encodes and enhances the default response using human-readable format."""
    jsonable_response = jsonable_encoder(response)
    encoded_response = EnhancedORJSONResponse.encode_to_human_readable(
        jsonable_response
    )

    return encoded_response
