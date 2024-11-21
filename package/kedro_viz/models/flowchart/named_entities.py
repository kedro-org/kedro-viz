"""kedro_viz.models.flowchart.named_entities` defines data models for representing named entities
such as tags and registered pipelines within a Kedro visualization graph."""

from typing import Optional

from pydantic import BaseModel, Field, ValidationInfo, field_validator


class NamedEntity(BaseModel):
    """Represent a named entity (Tag/Registered Pipeline) in a Kedro project
    Args:
        id (str): Id of the registered pipeline

    Raises:
        AssertionError: If id is not supplied during instantiation
    """

    id: str
    name: Optional[str] = Field(
        default=None,
        validate_default=True,
        description="The name of the entity",
    )

    @field_validator("name")
    @classmethod
    def set_name(cls, _, info: ValidationInfo):
        """Ensures that the 'name' field is set to the value of 'id' if 'name' is not provided."""
        assert "id" in info.data
        return info.data["id"]


class RegisteredPipeline(NamedEntity):
    """Represent a registered pipeline in a Kedro project."""


class Tag(NamedEntity):
    """Represent a tag in a Kedro project."""

    def __hash__(self) -> int:
        return hash(self.id)
