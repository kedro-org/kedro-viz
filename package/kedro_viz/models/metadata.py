"""`kedro_viz.models.metadata` defines metadata for Kedro-Viz application."""

# pylint: disable=missing-function-docstring
from typing import ClassVar, List

from pydantic import BaseModel, field_validator


class PackageCompatibility(BaseModel):
    """Represent package compatibility in app metadata"""

    package_name: str
    package_version: str
    is_compatible: bool

    @field_validator("package_name")
    @classmethod
    def set_package_name(cls, value):
        assert isinstance(value, str)
        return value

    @field_validator("package_version")
    @classmethod
    def set_package_version(cls, value):
        assert isinstance(value, str)
        return value

    @field_validator("is_compatible")
    @classmethod
    def set_is_compatible(cls, value):
        assert isinstance(value, bool)
        return value


class Metadata(BaseModel):
    """Represent Kedro-Viz application metadata"""

    has_missing_dependencies: ClassVar[bool] = False
    package_compatibilities: ClassVar[List[PackageCompatibility]] = []

    @classmethod
    def set_package_compatibilities(cls, value: List[PackageCompatibility]):
        cls.package_compatibilities = value

    @classmethod
    def set_has_missing_dependencies(cls, value: bool):
        cls.has_missing_dependencies = value
