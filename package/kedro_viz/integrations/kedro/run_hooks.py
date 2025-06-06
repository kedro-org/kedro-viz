"""`kedro_viz.integrations.kedro.run_hooks` defines hooks to add additional functionalities for a kedro run."""

import logging
import traceback
from time import perf_counter
from typing import Any, Optional, Union

from kedro.framework.hooks import hook_impl
from kedro.pipeline.node import Node as KedroNode

from kedro_viz.integrations.kedro.hooks_utils import (
    create_dataset_event,
    generate_timestamp,
    hash_node,
    write_events,
)

logger = logging.getLogger(__name__)


class PipelineRunStatusHook:
    """Collect and write pipeline and dataset events during Kedro runs."""

    def __init__(self):
        # Track times, events, and context for errors
        self._node_start: dict[str, float] = {}
        self._events: list[dict[str, Any]] = []
        self.datasets: dict[str, Any] = {}
        self._current_node: Optional[Any] = None
        self._current_dataset: Optional[str] = None
        self._current_operation: Optional[str] = None
        self._all_nodes: list[KedroNode] = []
        self._started_nodes: set[str] = set()

    def _write_events(self) -> None:
        """Persist events list to the project's .viz JSON file."""
        write_events(self._events)

    def _add_event(self, event: dict[str, Any], flush: bool = False) -> None:
        """Append one event; flush to disk when requested."""
        self._events.append(event)
        if flush:
            self._write_events()

    def _set_context(self, dataset: str, operation: str, node: KedroNode) -> None:
        """Save dataset I/O and node context for error handling."""
        self._current_dataset = dataset
        self._current_operation = operation
        self._current_node = node

    def _clear_context(self) -> None:
        """Clear dataset I/O context after success."""
        self._current_dataset = None
        self._current_operation = None

    @hook_impl
    def after_catalog_created(self, catalog: Union[Any, Any]):
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
        self.datasets = getattr(
            catalog, "_datasets", getattr(catalog, "_data_sets", {})
        )

    @hook_impl
    def before_pipeline_run(self, run_params: dict, pipeline) -> None:
        """Emit start event unless this is named pipeline."""
        if run_params.get("pipeline_name"):
            return
        self._all_nodes = list(pipeline.nodes)
        self._started_nodes.clear()
        self._add_event(
            {"event": "before_pipeline_run", "timestamp": generate_timestamp()}
        )

    @hook_impl
    def before_dataset_loaded(self, dataset_name: str, node: KedroNode) -> None:
        self._set_context(dataset_name, "loading", node)

    @hook_impl
    def after_dataset_loaded(self, dataset_name: str, data: Any) -> None:
        self._add_event(
            create_dataset_event(
                "after_dataset_loaded", dataset_name, data, self.datasets
            )
        )
        self._clear_context()

    @hook_impl
    def before_dataset_saved(self, dataset_name: str, node: KedroNode) -> None:
        self._set_context(dataset_name, "saving", node)

    @hook_impl
    def after_dataset_saved(self, dataset_name: str, data: Any) -> None:
        self._add_event(
            create_dataset_event(
                "after_dataset_saved", dataset_name, data, self.datasets
            )
        )
        self._clear_context()

    @hook_impl
    def before_node_run(self, node: KedroNode) -> None:
        self._node_start[node.name] = perf_counter()
        self._current_node = node
        self._started_nodes.add(node.name)

    @hook_impl
    def after_node_run(self, node: KedroNode) -> None:
        start = self._node_start.get(node.name, perf_counter())
        duration = perf_counter() - start
        self._add_event(
            {
                "event": "after_node_run",
                "node": node.name,
                "node_id": hash_node(node),
                "duration_sec": duration,
                "status": "success",
            }
        )
        if self._current_node == node:
            self._current_node = None  # clear node context

    @hook_impl
    def after_pipeline_run(self, run_params) -> None:
        if run_params.get("pipeline_name"):
            return
        self._add_event(
            {"event": "after_pipeline_run", "timestamp": generate_timestamp()}, True
        )

    @hook_impl
    def on_node_error(self, error: Exception, node: Any) -> None:
        self._add_event(
            {
                "event": "on_node_error",
                "node": getattr(node, "name", str(node)),
                "node_id": hash_node(node),
                "error": str(error),
                "timestamp": generate_timestamp(),
                "traceback": traceback.format_exc(),
            },
            True,
        )

    @hook_impl
    def on_pipeline_error(self, error: Exception) -> None:
        """Emit pipeline errors with last I/O or node context if available."""

        event = {
            "event": "on_pipeline_error",
            "error": str(error),
            "timestamp": generate_timestamp(),
            "traceback": traceback.format_exc(),
        }

        if self._current_dataset:
            event.update({"dataset": self._current_dataset})
            if self._current_operation:
                event["operation"] = self._current_operation
        if self._current_node:
            event.update(
                {
                    "node": self._current_node.name,
                    "node_id": hash_node(self._current_node),
                }
            )
        else:
            # find first unstarted node for hint
            for n in self._all_nodes:
                if n.name not in self._started_nodes:
                    event.update(
                        {
                            "node": n.name,
                            "node_id": hash_node(n),
                            "status": "not_started",
                        }
                    )
                    break

        self._add_event(event, True)


# singleton hook instance
pipeline_run_hook = PipelineRunStatusHook()
