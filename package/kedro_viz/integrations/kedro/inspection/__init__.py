"""Kedro inspection snapshot adapter for Kedro-Viz.

Converts a Kedro project inspection snapshot (``kedro>=1.4.0``) into a graph response.
"""

from kedro_viz.integrations.kedro.inspection.snapshot_source import load_snapshot

__all__ = ["load_snapshot"]
