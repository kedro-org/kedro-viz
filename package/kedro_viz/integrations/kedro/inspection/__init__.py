"""Kedro inspection snapshot adapter for Kedro-Viz.

Converts a Kedro project inspection snapshot (``kedro>=1.4.0``) into the existing Kedro-Viz graph
response, preserving the API contract.
"""

from kedro_viz.integrations.kedro.inspection.graph_builder import GraphBuilder
from kedro_viz.integrations.kedro.inspection.snapshot_source import (
    is_inspection_available,
    load_snapshot,
)
from kedro_viz.integrations.kedro.node_ids import dataset_node_id, task_node_id

__all__ = [
    "GraphBuilder",
    "dataset_node_id",
    "is_inspection_available",
    "load_snapshot",
    "task_node_id",
]
