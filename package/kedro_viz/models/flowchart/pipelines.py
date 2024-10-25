"""`kedro_viz.models.flowchart.pipelines` represent Kedro pipelines in a viz graph."""

from typing import Optional, Set

from pydantic import BaseModel, Field

from .model_utils import GraphNodeType, ModularPipelineChild, NamedEntity


class RegisteredPipeline(NamedEntity):
    """Represent a registered pipeline in a Kedro project."""


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
