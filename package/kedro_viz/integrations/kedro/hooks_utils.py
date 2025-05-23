"""Utility functions for Kedro hooks implementation."""

import json
import logging
from pathlib import Path
from typing import Any, Dict, Optional

import fsspec
from kedro.pipeline.node import Node as KedroNode

from kedro_viz.constants import VIZ_METADATA_ARGS
from kedro_viz.launchers.utils import _find_kedro_project
from kedro_viz.utils import _hash, _hash_input_output

logger = logging.getLogger(__name__)


def hash_node(node: Any) -> str:
    """Stable ID for KedroNode or I/O reference."""
    return _hash(str(node)) if isinstance(node, KedroNode) else _hash_input_output(node)


def make_dataset_event(
    when: str,
    name: str,
    data: Any = None,
    status: str = "Available",
    node: Optional[KedroNode] = None,
    datasets: Dict[str, Any] = None,
) -> Dict[str, Any]:
    """Generic builder for dataset load/save events.
    
    Args:
        when: Event type/name
        name: Dataset name
        data: Dataset data
        status: Dataset status
        node: Related Kedro node
        datasets: Dictionary of available datasets
        
    Returns:
        Dictionary with event data
    """
    ev = {"event": when, "dataset": name, "node_id": _hash_input_output(name), "status": status}
    if node:
        ev.update({
            "node": node.name,
            "node_id_from": hash_node(node)
        })  # include node context
    if data is not None and status == "Available" and datasets:
        size = compute_size(name, data, datasets)
        if size is not None:
            ev["size_bytes"] = size  # only attach size when available
    return ev


def compute_size(name: str, data: Any, datasets: Dict[str, Any]) -> Optional[int]:
    """Determine file size for DataFrame or dataset with filepath attribute.
    
    Args:
        name: Dataset name
        data: Dataset data
        datasets: Dictionary of available datasets
        
    Returns:
        File size in bytes, if available
    """
    ds = datasets.get(name)
    if not ds:
        return None
        
    # pandas DataFrame may store filepath metadata
    try:
        import pandas as pd
        if isinstance(data, pd.DataFrame):
            fp = getattr(ds, "filepath", None) or getattr(ds, "_filepath", None)
            if fp:
                fs, p = fsspec.core.url_to_fs(fp)
                return fs.size(p) if fs.exists(p) else None
    except ImportError:
        pass  # pandas optional
    
    # generic filepath lookup
    for attr in ("filepath", "_filepath"):
        fp = getattr(ds, attr, None)
        if fp:
            fs, p = fsspec.core.url_to_fs(fp)
            if fs.exists(p):
                return fs.size(p)
    return None


def write_events(events: list, events_dir: str = VIZ_METADATA_ARGS["path"], events_file: str = "kedro_pipeline_events.json") -> None:
    """Persist events list to the project's .viz JSON file.
    
    Args:
        events: List of events to write
        events_dir: Directory to write events to
        events_file: Filename for events
    """
    try:
        project = _find_kedro_project(Path.cwd())
        if not project:
            logger.warning("No Kedro project found; skipping write.")
            return
        path = project / events_dir / events_file
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(events, indent=2), encoding="utf8")
    except Exception as exc:
        logger.warning("Failed writing events: %s", exc)
