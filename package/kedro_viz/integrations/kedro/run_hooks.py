"""`kedro_viz.integrations.kedro.run_hooks` defines hooks to add additional functionalities for a kedro run."""

import logging
from datetime import datetime
from pathlib import Path
from time import perf_counter
from typing import Any, Dict, Optional, Set, Union

from kedro.framework.hooks import hook_impl
from kedro.pipeline.node import Node as KedroNode

from kedro_viz.constants import VIZ_METADATA_ARGS
from kedro_viz.integrations.kedro.hooks_utils import compute_size, hash_node, make_dataset_event, write_events
from kedro_viz.launchers.utils import _find_kedro_project

logger = logging.getLogger(__name__)


class PipelineRunHooks:
    """Collect and write pipeline and dataset events during Kedro runs."""

    # Constants to avoid magic strings
    EVENTS_DIR = VIZ_METADATA_ARGS["path"]
    EVENTS_FILE = "kedro_pipeline_events.json"

    def __init__(self):
        # Track times, events, and context for errors
        self._node_start: Dict[str, float] = {}
        self._events: list = []
        self.datasets: Dict[str, Any] = {}
        self._current_node: Optional[Any] = None
        self._current_dataset: Optional[str] = None
        self._current_op: Optional[str] = None
        self._all_nodes: list = []        
        self._started_nodes: Set[str] = set()

    def _write_events(self) -> None:
        """Persist events list to the project's .viz JSON file."""
        write_events(self._events, self.EVENTS_DIR, self.EVENTS_FILE)

    def _add_event(self, event: Dict[str, Any], flush: bool = False) -> None:
        """Append one event; flush to disk when requested."""
        self._events.append(event)
        if flush:
            self._write_events()

    def _hash_node(self, node: Any) -> str:
        """Stable ID for KedroNode or I/O reference."""
        return hash_node(node)

    def _make_dataset_event(
        self,
        when: str,
        name: str,
        data: Any = None,
        status: str = "Available",
        node: Optional[KedroNode] = None,
    ) -> Dict[str, Any]:
        """Generic builder for dataset load/save events."""
        return make_dataset_event(when, name, data, status, node, self.datasets)

    def _compute_size(self, name: str, data: Any) -> Optional[int]:
        """Determine file size for DataFrame or dataset with filepath attribute."""
        return compute_size(name, data, self.datasets)

    def _set_context(self, ds: str, op: str, node: KedroNode) -> None:
        """Save dataset I/O and node context for error handling."""
        self._current_dataset = ds
        self._current_op = op
        self._current_node = node

    def _clear_context(self) -> None:
        """Clear dataset I/O context after success."""
        self._current_dataset = None
        self._current_op = None

    @hook_impl
    def after_catalog_created(self, catalog: Union[Any, Any]):  # type: ignore
        """Grab catalog datasets for size lookups."""
        try:
            # prefer new KedroDataCatalog
            from kedro.io import KedroDataCatalog
            if isinstance(catalog, KedroDataCatalog):
                self.datasets = catalog.datasets
                return
        except ImportError:
            pass
        # fallback older versions
        self.datasets = getattr(catalog, "_datasets", getattr(catalog, "_data_sets", {}))

    @hook_impl
    def before_pipeline_run(self, run_params: dict, pipeline, catalog) -> None:
        """Emit start event unless this is named pipeline."""
        if run_params.get("pipeline_name"):
            return
        self._all_nodes = list(pipeline.nodes)
        self._started_nodes.clear()
        self._add_event({"event": "before_pipeline_run", "timestamp": datetime.utcnow().isoformat()}, True)

    @hook_impl
    def before_dataset_loaded(self, dataset_name: str, node: KedroNode) -> None:
        self._set_context(dataset_name, "loading", node)

    @hook_impl
    def after_dataset_loaded(self, dataset_name: str, data: Any, node: KedroNode = None) -> None:
        self._add_event(self._make_dataset_event("after_dataset_loaded", dataset_name, data))
        self._clear_context()

    @hook_impl
    def before_dataset_saved(self, dataset_name: str, node: KedroNode) -> None:
        self._set_context(dataset_name, "saving", node)

    @hook_impl
    def after_dataset_saved(self, dataset_name: str, data: Any, node: KedroNode = None) -> None:
        self._add_event(self._make_dataset_event("after_dataset_saved", dataset_name, data))
        self._clear_context()

    @hook_impl
    def before_node_run(self, node: KedroNode, inputs) -> None:
        self._node_start[node.name] = perf_counter()
        self._current_node = node
        self._started_nodes.add(node.name)

    @hook_impl
    def after_node_run(self, node: KedroNode, inputs, outputs) -> None:
        start = self._node_start.get(node.name, perf_counter())
        duration = perf_counter() - start
        self._add_event({
            "event": "after_node_run",
            "node": node.name,
            "node_id": self._hash_node(node),
            "duration_sec": duration,
            "status": "success"
        })
        if self._current_node == node:
            self._current_node = None  # clear node context

    @hook_impl
    def after_pipeline_run(self, run_params) -> None:
        if run_params.get("pipeline_name"):
            return
        self._add_event({"event": "after_pipeline_run", "timestamp": datetime.utcnow().isoformat()}, True)

    @hook_impl
    def on_node_error(self, error: Exception, node: Any) -> None:
        self._add_event({
            "event": "on_node_error",
            "node": getattr(node, "name", str(node)),
            "node_id": self._hash_node(node),
            "error": str(error),
            "timestamp": datetime.utcnow().isoformat()
        }, True)

    @hook_impl
    def on_pipeline_error(self, error: Exception) -> None:
        """Emit pipeline errors with last I/O or node context if available."""
        ev = {"event": "on_pipeline_error", "error": str(error), "timestamp": datetime.utcnow().isoformat()}
        if self._current_dataset:
            ev.update({"dataset": self._current_dataset, "operation": self._current_op})
        if self._current_node:
            ev.update({"node": self._current_node.name, "node_id": self._hash_node(self._current_node)})
        else:
            # find first unstarted node for hint
            for n in self._all_nodes:
                if n.name not in self._started_nodes:
                    ev.update({"node": n.name, "node_id": self._hash_node(n), "status": "not_started"})
                    break
        self._add_event(ev, True)


# singleton hook instance
pipeline_run_hook = PipelineRunHooks()