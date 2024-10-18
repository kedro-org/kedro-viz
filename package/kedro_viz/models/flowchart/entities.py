from pydantic import BaseModel, Field, ValidationInfo, field_validator
from typing import Optional


class NamedEntity(BaseModel):
    """Represent a named entity (Tag/Registered Pipeline) in a Kedro project."""

    id: str
    name: Optional[str] = Field(
        default=None,
        validate_default=True,
        description="The name of the entity",
    )

    @field_validator("name")
    @classmethod
    def set_name(cls, _, info: ValidationInfo):
        assert "id" in info.data
        return info.data["id"]


class RegisteredPipeline(NamedEntity):
    """Represent a registered pipeline in a Kedro project."""


class Tag(NamedEntity):
    """Represent a tag in a Kedro project."""

    def __hash__(self) -> int:
        return hash(self.id)
