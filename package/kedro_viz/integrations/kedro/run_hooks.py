"""`kedro_viz.integrations.kedro.run_hooks` defines hooks to add additional functionalities for a kedro run."""

import logging
import traceback
from time import perf_counter
from typing import Any, Dict, Optional

from kedro.framework.hooks import hook_impl
from kedro.pipeline.node import Node as KedroNode

from kedro_viz.integrations.kedro.hooks_utils import (
    _hash_input_output,
    compute_size,
    generate_timestamp,
    hash_node,
    is_default_run,
    is_sequential_runner,
    write_events,
)

logger = logging.getLogger(__name__)


def create_dataset_event(
    event_name: str,
    dataset_name: str,
    dataset_value: Any = None,
    datasets: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """Generic builder for dataset load/save events.

    Args:
        event_type: Event type/name
        dataset_name: Dataset name
        dataset_value: Dataset data
        datasets: Dictionary of available datasets

    Returns:
        Dictionary with event data
    """
    event: Dict[str, Any] = {
        "event": event_name,
        "dataset": dataset_name,
        "node_id": _hash_input_output(dataset_name),
        "status": "Available",
    }

    if dataset_value is not None and datasets:
        size = compute_size(dataset_name, datasets)
        if size is not None:
            event["size"] = size  # only attach size when available
    return event


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
        self._should_collect_events: bool = False

    def _add_event(self, event: dict[str, Any], flush: bool = False) -> None:
        """Append one event to the events list and optionally flush to disk."""
        self._events.append(event)
        if flush:
            write_events(self._events)

    def _set_event_context(self, dataset: str, operation: str, node: KedroNode) -> None:
        """Save dataset I/O and node context for error handling."""
        self._current_dataset = dataset
        self._current_operation = operation
        self._current_node = node

    def _clear_event_context(self) -> None:
        """Clear dataset I/O context after successful operations."""
        self._current_dataset = None
        self._current_operation = None

    @hook_impl
    def after_catalog_created(self, catalog: Any):
        """
        Triggered after the Kedro DataCatalog is constructed, before pipeline execution.
        Captures references to all datasets for metadata lookups. At this point, no data
        has been loaded or saved yet — so only static dataset configuration (not size/content)
        can be accessed.
        """
        self._datasets = catalog

    @hook_impl
    def before_pipeline_run(self, run_params: dict, pipeline) -> None:
        """
        Emit start event based on run_params values.

        Records the beginning of a pipeline execution
        only for full/default pipeline runs with sequential runner.
        """
        # Determine if we should collect events based on run parameters
        if not is_default_run(run_params):
            logger.warning(
                "Workflow tracking is disabled during partial pipeline runs (executed using --from-nodes, --to-nodes, --tags, --pipeline, and more). `.viz/kedro_pipeline_events.json` will be created only during a full kedro run. See issue https://github.com/kedro-org/kedro-viz/issues/2443 for more details."
            )
            return

        if not is_sequential_runner(run_params):
            logger.warning(
                "Workflow tracking is disabled for non-sequential runners. `.viz/kedro_pipeline_events.json` will be created only during a sequential run. See issue https://github.com/kedro-org/kedro-viz/issues/2443 for more details."
            )
            return

        self._should_collect_events = True
        self._all_nodes = list(pipeline.nodes)
        self._started_nodes.clear()
        self._add_event(
            {"event": "before_pipeline_run", "timestamp": generate_timestamp()}
        )

    @hook_impl
    def before_dataset_loaded(self, dataset_name: str, node: KedroNode) -> None:
        """Set context before a dataset is loaded by a node."""
        if not self._should_collect_events:
            return

        self._set_event_context(dataset_name, "loading", node)

    @hook_impl
    def after_dataset_loaded(self, dataset_name: str, data: Any) -> None:
        """Record dataset loading event."""
        if not self._should_collect_events:
            return

        self._add_event(
            create_dataset_event(
                "after_dataset_loaded", dataset_name, data, self._datasets
            )
        )
        self._clear_event_context()

    @hook_impl
    def before_dataset_saved(self, dataset_name: str, node: KedroNode) -> None:
        """Set context before a dataset is saved by a node."""
        if not self._should_collect_events:
            return

        self._set_event_context(dataset_name, "saving", node)

    @hook_impl
    def after_dataset_saved(self, dataset_name: str, data: Any) -> None:
        """Record dataset saving event."""
        if not self._should_collect_events:
            return

        self._add_event(
            create_dataset_event(
                "after_dataset_saved", dataset_name, data, self._datasets
            )
        )
        self._clear_event_context()

    @hook_impl
    def before_node_run(self, node: KedroNode) -> None:
        """Record node execution start time and set current node context."""
        if not self._should_collect_events:
            return

        self._node_start[node.name] = perf_counter()
        self._current_node = node
        self._started_nodes.add(node.name)

    @hook_impl
    def after_node_run(self, node: KedroNode) -> None:
        """Record successful node completion with performance metrics."""
        if not self._should_collect_events:
            return

        start = self._node_start.get(node.name)
        if start is None:
            duration = 0.0
        else:
            duration = perf_counter() - start
        self._add_event(
            {
                "event": "after_node_run",
                "node": node.name,
                "node_id": hash_node(node),
                "duration": duration,  # duration in seconds
                "status": "success",
            }
        )
        if self._current_node == node:
            self._current_node = None  # clear node context

    @hook_impl
    def after_pipeline_run(self) -> None:
        """Record pipeline completion and flush all events to disk."""
        if not self._should_collect_events:
            return

        self._add_event(
            {"event": "after_pipeline_run", "timestamp": generate_timestamp()}, True
        )

    @hook_impl
    def on_node_error(self, error: Exception, node: Any) -> None:
        """Record node execution errors with detailed context."""
        if not self._should_collect_events:
            return

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
        if not self._should_collect_events:
            return

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
