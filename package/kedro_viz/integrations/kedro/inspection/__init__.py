"""Kedro inspection snapshot adapter for Kedro-Viz.

Converts a Kedro project inspection snapshot (``kedro>=1.4.0``) into a graph response.
"""

from kedro_viz.integrations.kedro.inspection.snapshot_source import (
    is_inspection_available,
    load_snapshot,
)
from kedro_viz.integrations.kedro.node_ids import dataset_node_id, task_node_id

__all__ = [
    "dataset_node_id",
    "is_inspection_available",
    "load_snapshot",
    "task_node_id",
]
