"""`kedro_viz.models.flowchart.model_utils` defines utils for Kedro entities in a viz graph."""

import logging
from enum import Enum
from types import FunctionType
from typing import Any, Dict, Optional

from pydantic import BaseModel, Field, ValidationInfo, field_validator

logger = logging.getLogger(__name__)


def _parse_filepath(dataset_description: Dict[str, Any]) -> Optional[str]:
    """
    Extract the file path from a dataset description dictionary.
    """
    filepath = dataset_description.get("filepath") or dataset_description.get("path")
    return str(filepath) if filepath else None


def _extract_wrapped_func(func: FunctionType) -> FunctionType:
    """Extract a wrapped decorated function to inspect the source code if available.
    Adapted from https://stackoverflow.com/a/43506509/1684058
    """
    if func.__closure__ is None:
        return func
    closure = (c.cell_contents for c in func.__closure__)
    wrapped_func = next((c for c in closure if isinstance(c, FunctionType)), None)
    # return the original function if it's not a decorated function
    return func if wrapped_func is None else wrapped_func


# =============================================================================
# Shared base classes and enumerations for model components
# =============================================================================


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


class GraphNodeType(str, Enum):
    """Represent all possible node types in the graph representation of a Kedro pipeline.
    The type needs to inherit from str as well so FastAPI can serialise it. See:
    https://fastapi.tiangolo.com/tutorial/path-params/#working-with-python-enumerations
    """

    TASK = "task"
    DATA = "data"
    PARAMETERS = "parameters"
    MODULAR_PIPELINE = "modularPipeline"  # CamelCase for frontend compatibility


class ModularPipelineChild(BaseModel, frozen=True):
    """Represent a child of a modular pipeline.

    Args:
        id (str): Id of the modular pipeline child
        type (GraphNodeType): Type of modular pipeline child
    """

    id: str
    type: GraphNodeType
