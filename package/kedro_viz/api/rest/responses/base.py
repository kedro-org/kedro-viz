"""`kedro_viz.api.rest.responses.base` contains base
response classes and utility functions for the REST endpoints"""

# pylint: disable=missing-class-docstring

import abc
import logging

from pydantic import BaseModel, ConfigDict

logger = logging.getLogger(__name__)


class APINotFoundResponse(BaseModel):
    message: str


class BaseAPIResponse(BaseModel, abc.ABC):
    model_config = ConfigDict(from_attributes=True)
