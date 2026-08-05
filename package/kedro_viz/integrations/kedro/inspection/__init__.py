"""Kedro inspection snapshot adapter for Kedro-Viz.

Converts a Kedro project inspection snapshot into a graph response.
"""

from kedro_viz.integrations.kedro.inspection.graph_builder import GraphBuilder

__all__ = ["GraphBuilder"]
