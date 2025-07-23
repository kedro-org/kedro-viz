"""`kedro_viz.api.rest.responses.utils` contains utility
response classes and functions for the REST endpoints"""

import logging
from datetime import datetime
from enum import Enum
from typing import Any, Dict, Optional, TypeVar

import orjson
from fastapi.encoders import jsonable_encoder
from fastapi.responses import ORJSONResponse

logger = logging.getLogger(__name__)

EnumType = TypeVar("EnumType", bound=Enum)


class RunEventStatus(str, Enum):
    """Enum representing pipeline run events status."""

    SUCCESS = "success"
    FAILED = "failed"


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


def convert_status_to_enum(status: Optional[str], default: EnumType) -> EnumType:
    """Convert string status to enum member; case-insensitive match on values."""
    logger = logging.getLogger(__name__)
    if not status:
        return default
    enum_cls = type(default)
    for member in enum_cls:
        if member.value.lower() == status.lower():
            return member
    logger.debug("Unknown status '%s', returning default %s", status, default)
    return default


def calculate_pipeline_duration(
    start_time: Optional[str],
    end_time: Optional[str],
    nodes_durations: Dict[str, float],
) -> float:
    """Calculate pipeline duration from timestamps or node durations.

    Args:
        start_time: ISO format timestamp string for pipeline start
        end_time: ISO format timestamp string for pipeline end
        nodes_durations: Dictionary mapping node IDs to their durations in seconds

    Returns:
        Total duration in seconds
    """
    logger = logging.getLogger(__name__)
    if start_time and end_time:
        try:
            start_dt = datetime.fromisoformat(start_time)
            end_dt = datetime.fromisoformat(end_time)
            duration = (end_dt - start_dt).total_seconds()
            logger.info(f"Duration calculated from timestamps: {duration} seconds")
            return duration
        except (ValueError, TypeError) as e:
            logger.warning(f"Error calculating pipeline duration: {e}")

    # Fallback to summing up node durations
    return sum(nodes_durations.values())
