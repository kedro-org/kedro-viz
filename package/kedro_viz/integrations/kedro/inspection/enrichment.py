"""Add live-only fields to graph responses without changing their structure."""

from __future__ import annotations

from collections.abc import Iterable, Mapping

from pydantic import BaseModel, Field, field_validator

from kedro_viz.api.rest.responses.pipelines import (
    DataNodeAPIResponse,
    GraphAPIResponse,
    NodeExtrasAPIResponse,
)
from kedro_viz.models.flowchart.nodes import DataNode, GraphNode
from kedro_viz.models.metadata import NodeExtras


class EnrichmentSources(BaseModel, frozen=True):
    """Fields copied from the transitional live load, keyed by existing node IDs.

    The IDs come from the already-built live nodes rather than being recalculated here. This
    keeps enrichment independent of graph construction while the live backend remains available.
    """

    node_extras_by_node_id: Mapping[str, NodeExtras] = Field(default_factory=dict)
    dataset_type_by_node_id: Mapping[str, str | None] = Field(default_factory=dict)
    layer_by_dataset: Mapping[str, str] | None = None

    @field_validator(
        "node_extras_by_node_id",
        "dataset_type_by_node_id",
        "layer_by_dataset",
        mode="before",
    )
    @classmethod
    def _copy_mapping(cls, value: Mapping | None) -> dict | None:
        """Copy caller-owned mappings before storing them on the prepared model."""
        return None if value is None else dict(value)

    @classmethod
    def from_live_nodes(
        cls,
        nodes: Iterable[GraphNode],
        *,
        layer_by_dataset: Mapping[str, str] | None = None,
    ) -> EnrichmentSources:
        """Copy the fields needed by the inspection graph from already-built live nodes."""
        node_extras_by_node_id: dict[str, NodeExtras] = {}
        dataset_type_by_node_id: dict[str, str | None] = {}
        for node in nodes:
            if node.node_extras is not None:
                node_extras_by_node_id[node.id] = node.node_extras
            if isinstance(node, DataNode):
                dataset_type_by_node_id[node.id] = node.dataset_type
        return cls(
            node_extras_by_node_id=node_extras_by_node_id,
            dataset_type_by_node_id=dataset_type_by_node_id,
            layer_by_dataset=layer_by_dataset,
        )


def enrich_graph_response(
    response: GraphAPIResponse, sources: EnrichmentSources
) -> None:
    """Mutate live-only response fields without adding, removing or renaming nodes."""
    for node in response.nodes:
        node_extras = sources.node_extras_by_node_id.get(node.id)
        if node_extras is not None:
            node.node_extras = NodeExtrasAPIResponse(
                stats=node_extras.stats,
                styles=node_extras.styles,
            )
        if (
            isinstance(node, DataNodeAPIResponse)
            and node.id in sources.dataset_type_by_node_id
        ):
            node.dataset_type = sources.dataset_type_by_node_id[node.id]
