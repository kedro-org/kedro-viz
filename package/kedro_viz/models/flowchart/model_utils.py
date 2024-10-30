"""`kedro_viz.models.flowchart.model_utils` defines utils for Kedro entities in a viz graph."""

import logging
from enum import Enum
from types import FunctionType
from typing import Any, Dict, Optional

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


class GraphNodeType(str, Enum):
    """Represent all possible node types in the graph representation of a Kedro pipeline.
    The type needs to inherit from str as well so FastAPI can serialise it. See:
    https://fastapi.tiangolo.com/tutorial/path-params/#working-with-python-enumerations
    """

    TASK = "task"
    DATA = "data"
    PARAMETERS = "parameters"
    MODULAR_PIPELINE = "modularPipeline"  # CamelCase for frontend compatibility
