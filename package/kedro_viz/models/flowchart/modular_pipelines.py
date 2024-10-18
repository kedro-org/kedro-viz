from pydantic import BaseModel, Field
from typing import Set, Optional
from .nodes import GraphNodeType


class ModularPipelineChild(BaseModel):
    """Represent a child of a modular pipeline."""

    id: str
    type: GraphNodeType


class ModularPipelineNode(BaseModel):
    """Represent a modular pipeline node in the graph."""

    id: str
    name: str
    modular_pipelines: Optional[Set[str]] = None
    children: Set[ModularPipelineChild] = Field(
        set(), description="The children for the modular pipeline node"
    )
    inputs: Set[str] = Field(
        set(), description="The input datasets to the modular pipeline node"
    )
    outputs: Set[str] = Field(
        set(), description="The output datasets from the modular pipeline node"
    )
    type: str = GraphNodeType.MODULAR_PIPELINE.value
