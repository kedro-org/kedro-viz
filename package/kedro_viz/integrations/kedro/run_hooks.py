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
    is_default_run,
    write_events,
)

logger = logging.getLogger(__name__)


class PipelineRunStatusHook:
    """
    Collect and write pipeline and dataset events during Kedro runs.
    
    This hook class tracks pipeline execution events. It integrates with Kedro's hook
    system to monitor pipeline runs and persist execution data for visualization.
    
    Attributes:
        _node_start (dict[str, float]): Mapping of node names to their start times
            for performance tracking.
        _events (list[dict[str, Any]]): List of all events collected during the run.
        _datasets (dict[str, Any]): Dictionary of dataset configurations from the
            Kedro data catalog for size and metadata lookups.
        _current_node (Optional[KedroNode]): Currently executing node, used for
            error context and tracking.
        _current_dataset (Optional[str]): Currently processed dataset name,
            used for error context during I/O operations.
        _current_operation (Optional[str]): Current dataset operation type
            (e.g., 'loading', 'saving'), used for error context.
        _all_nodes (list[KedroNode]): Complete list of nodes in the pipeline,
            used for tracking execution progress.
        _started_nodes (set[str]): Set of node names that have begun execution,
            used to identify unstarted nodes during pipeline errors.
    """

    def __init__(self):
        """
        Initialize the pipeline run status hook.
        
        Sets up empty tracking structures for monitoring pipeline execution,
        including event collection, timing data, and error context management.
        """
        # Track times, events, and context for errors
        self._node_start: dict[str, float] = {}
        self._events: list[dict[str, Any]] = []
        self._datasets: dict[str, Any] = {}
        self._current_node: Optional[Any] = None
        self._current_dataset: Optional[str] = None
        self._current_operation: Optional[str] = None
        self._all_nodes: list[KedroNode] = []
        self._started_nodes: set[str] = set()

    def _write_events(self) -> None:
        """Persist events list to the project's .viz JSON file."""
        write_events(self._events)

    def _add_event(self, event: dict[str, Any], flush: bool = False) -> None:
        """Append one event to the events list and optionally flush to disk."""
        
        # We add events only for full/default pipeline as for MVP we only support
        # full/default pipeline.
        if not self._all_nodes:
            return

        self._events.append(event)
        if flush:
            self._write_events()

    def _set_context(self, dataset: str, operation: str, node: KedroNode) -> None:
        """Save dataset I/O and node context for error handling."""
        self._current_dataset = dataset
        self._current_operation = operation
        self._current_node = node

    def _clear_context(self) -> None:
        """Clear dataset I/O context after successful operations."""
        self._current_dataset = None
        self._current_operation = None

    @hook_impl
    def after_catalog_created(self, catalog: Union[Any, Any]):
        """Grab catalog datasets for size lookups and metadata access."""
        try:
            # prefer new KedroDataCatalog
            from kedro.io import KedroDataCatalog

            if isinstance(catalog, KedroDataCatalog):
                self._datasets = catalog.datasets
                return
        except ImportError:
            pass
        # fallback older versions
        self._datasets = getattr(
            catalog, "_datasets", getattr(catalog, "_data_sets", {})
        )

    @hook_impl
    def before_pipeline_run(self, run_params: dict, pipeline) -> None:
        """
        Emit start event based on run_params values.
        
        Records the beginning of a pipeline execution 
        only for full/default pipeline.
        """
        if not is_default_run(run_params):
            return
        self._all_nodes = list(pipeline.nodes)
        self._started_nodes.clear()
        self._add_event(
            {"event": "before_pipeline_run", "timestamp": generate_timestamp()}
        )

    @hook_impl
    def before_dataset_loaded(self, dataset_name: str, node: KedroNode) -> None:
        """Set context before a dataset is loaded by a node. """
        self._set_context(dataset_name, "loading", node)

    @hook_impl
    def after_dataset_loaded(self, dataset_name: str, data: Any) -> None:
        """Record dataset loading event."""
        self._add_event(
            create_dataset_event(
                "after_dataset_loaded", dataset_name, data, self._datasets
            )
        )
        self._clear_context()

    @hook_impl
    def before_dataset_saved(self, dataset_name: str, node: KedroNode) -> None:
        """Set context before a dataset is saved by a node."""
        self._set_context(dataset_name, "saving", node)

    @hook_impl
    def after_dataset_saved(self, dataset_name: str, data: Any) -> None:
        """Record dataset saving event."""
        self._add_event(
            create_dataset_event(
                "after_dataset_saved", dataset_name, data, self._datasets
            )
        )
        self._clear_context()

    @hook_impl
    def before_node_run(self, node: KedroNode) -> None:
        """Record node execution start time and set current node context."""
        self._node_start[node.name] = perf_counter()
        self._current_node = node
        self._started_nodes.add(node.name)

    @hook_impl
    def after_node_run(self, node: KedroNode) -> None:
        """Record successful node completion with performance metrics."""
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
        """Record pipeline completion and flush all events to disk."""
        if not is_default_run(run_params):
            return
        self._add_event(
            {"event": "after_pipeline_run", "timestamp": generate_timestamp()}, True
        )

    @hook_impl
    def on_node_error(self, error: Exception, node: Any) -> None:
        """Record node execution errors with detailed context."""
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
