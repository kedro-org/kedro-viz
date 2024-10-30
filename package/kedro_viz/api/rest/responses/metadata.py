"""`kedro_viz.api.rest.responses.metadata` contains response classes
and utility functions for the `/metadata` REST endpoint"""

from typing import List

from pydantic import ConfigDict

from kedro_viz.api.rest.responses.base import BaseAPIResponse
from kedro_viz.api.rest.utils import get_package_compatibilities
from kedro_viz.models.metadata import Metadata, PackageCompatibility


class MetadataAPIResponse(BaseAPIResponse):
    """
    MetadataAPIResponse is a subclass of BaseAPIResponse that represents the response structure for metadata API.

    Attributes:
        has_missing_dependencies (bool): Indicates if there are any missing dependencies. Defaults to False.
        package_compatibilities (List[PackageCompatibility]): A list of package compatibility information. Defaults to an empty list.
    """

    has_missing_dependencies: bool = False
    package_compatibilities: List[PackageCompatibility] = []
    model_config = ConfigDict(
        json_schema_extra={
            "has_missing_dependencies": False,
            "package_compatibilities": [
                {
                    "package_name": "fsspec",
                    "package_version": "2024.6.1",
                    "is_compatible": True,
                },
                {
                    "package_name": "kedro-datasets",
                    "package_version": "4.0.0",
                    "is_compatible": True,
                },
            ],
        }
    )


def get_metadata_response():
    """API response for `/api/metadata`."""
    package_compatibilities = get_package_compatibilities()
    Metadata.set_package_compatibilities(package_compatibilities)
    return Metadata()
