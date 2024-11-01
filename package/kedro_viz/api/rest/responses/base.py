"""`kedro_viz.api.rest.responses.base` contains base
response classes and utility functions for the REST endpoints"""

import abc
import logging

from pydantic import BaseModel, ConfigDict

logger = logging.getLogger(__name__)


class APINotFoundResponse(BaseModel):
    """
    APINotFoundResponse is a Pydantic model representing a response for an API not found error.

    Attributes:
        message (str): A message describing the error.
    """

    message: str


class BaseAPIResponse(BaseModel, abc.ABC):
    """
    BaseAPIResponse is an abstract base class for API responses.
    """

    model_config = ConfigDict(from_attributes=True)
