"""`kedro_viz.api.rest.responses.common` contains common
response classes for the REST endpoints"""

# pylint: disable=missing-class-docstring

import abc
import logging
from typing import Any

import orjson
from fastapi.encoders import jsonable_encoder
from fastapi.responses import ORJSONResponse
from pydantic import BaseModel, ConfigDict

logger = logging.getLogger(__name__)


class APINotFoundResponse(BaseModel):
    message: str


class BaseAPIResponse(BaseModel, abc.ABC):
    model_config = ConfigDict(from_attributes=True)


class EnhancedORJSONResponse(ORJSONResponse):
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


def write_api_response_to_fs(file_path: str, response: Any, remote_fs: Any):
    """Get encoded responses and writes it to a file"""
    encoded_response = get_encoded_response(response)

    with remote_fs.open(file_path, "wb") as file:
        file.write(encoded_response)
