from enum import Enum


class GraphNodeType(str, Enum):
    """Represent all possible node types in the graph representation of a Kedro pipeline."""

    TASK = "task"
    DATA = "data"
    PARAMETERS = "parameters"
    MODULAR_PIPELINE = "modularPipeline"  # CamelCase for frontend compatibility
