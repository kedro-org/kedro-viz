"""Kedro inspection snapshot adapter for Kedro-Viz.

Converts a Kedro project inspection snapshot (``kedro>=1.4.0``) into the existing Kedro-Viz graph
response, preserving the API contract.
"""

from kedro_viz.integrations.kedro.inspection.graph_builder import GraphBuilder

__all__ = [
    "GraphBuilder",
]
