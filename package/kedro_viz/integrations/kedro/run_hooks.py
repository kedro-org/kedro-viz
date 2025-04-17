"""`kedro_viz.integrations.kedro.run_hooks` defines hooks to add additional
functionalities for a kedro run."""

import json
import logging
from kedro_viz.utils import _hash, _hash_input_output
import requests
import threading
import sys
from time import perf_counter
from pathlib import Path
from typing import Any

from kedro.framework.hooks import hook_impl
from kedro.pipeline.node import Node as KedroNode

logger = logging.getLogger(__name__)

# Define the server URL (configurable)
SERVER_URL = "http://localhost:4141"  # Default Kedro-Viz port

def send_event_to_server(event_type: str, data: dict):
    """Send event to Kedro-Viz server asynchronously"""
    def _send_request():
        try:
            requests.post(
                f"{SERVER_URL}/api/run-events",
                json={"type": event_type, "data": data},
                timeout=0.5  # Short timeout to not block pipeline execution
            )
        except requests.RequestException as e:
            logger.error("Failed to send event to server: %s", e)

    # Run in thread to avoid blocking
    thread = threading.Thread(target=_send_request)
    thread.daemon = True
    thread.start()

# Optional: keep a global list to write to file at the end
pipeline_events = []

class PipelineRunHooks:
    def __init__(self):
        self._node_start_times = {}
        self._dataset_load_times = {}
        self._dataset_save_times = {}
        self._dataset_sizes = {}

    # async def _queue_event(self, event: dict):
    #     # Save to file later
    #     pipeline_events.append(event)
    #     # Send to frontend
    #     event_queue.put_nowait(json.dumps(event))

    def _estimate_size(self, data: Any) -> int:
        """Estimate size of dataset in bytes."""
        try:
            return sys.getsizeof(data)
        except Exception:
            return -1

    def _write_events_to_file(self):
        output_path = Path(".viz/kedro_pipeline_events.json")
        output_path.parent.mkdir(parents=True, exist_ok=True)
        with open(output_path, "w") as f:
            json.dump(pipeline_events, f, indent=2)

    @hook_impl
    def before_dataset_loaded(self, dataset_name: str):
        self._dataset_load_times[dataset_name] = perf_counter()

        node_id = (
            _hash(str(dataset_name))
            if isinstance(dataset_name, KedroNode)
            else _hash_input_output(dataset_name)
        )

        event = {
            "event": "before_dataset_loaded",
            "dataset": dataset_name,
            "node_id": node_id,
        }
        send_event_to_server("beforeDatasetLoaded", event)
        pipeline_events.append(event)

    @hook_impl
    def after_dataset_loaded(self, dataset_name: str, data: Any):
        duration = perf_counter() - self._dataset_load_times.get(dataset_name, 0)
        size = self._estimate_size(data)
        self._dataset_sizes[dataset_name] = size

        node_id = (
            _hash(str(dataset_name))
            if isinstance(dataset_name, KedroNode)
            else _hash_input_output(dataset_name)
        )
        event = {
            "event": "after_dataset_loaded",
            "dataset": dataset_name,
            "node_id": node_id,
            "load_time_sec": duration,
            "size_bytes": size,
        }
        send_event_to_server("afterDatasetLoaded", event)
        pipeline_events.append(event)

    @hook_impl
    def before_node_run(self, node, inputs):
        self._node_start_times[node.name] = perf_counter()

        node_id = (
            _hash(str(node))
            if isinstance(node, KedroNode)
            else _hash_input_output(node)
        )
        
        event = {
            "event": "before_node_run",
            "node": node.name,
            "node_id": node_id,
        }
        send_event_to_server("beforeNodeRun", event)
        pipeline_events.append(event)

    @hook_impl
    def after_node_run(self, node, inputs, outputs):
        duration = perf_counter() - self._node_start_times.get(node.name, 0)

        node_id = (
            _hash(str(node))
            if isinstance(node, KedroNode)
            else _hash_input_output(node)
        )

        event = {
            "event": "after_node_run",
            "node": node.name,
            "node_id": node_id,
            "duration_sec": duration,
            "status": "success"
        }
        send_event_to_server("afterNodeRun", event)
        pipeline_events.append(event)

    @hook_impl
    def before_dataset_saved(self, dataset_name: str, data: Any):
        self._dataset_save_times[dataset_name] = perf_counter()
        size = self._estimate_size(data)
        self._dataset_sizes[dataset_name] = size
        node_id = (
            _hash(str(dataset_name))
            if isinstance(dataset_name, KedroNode)
            else _hash_input_output(dataset_name)
        )
        event = {
            "event": "before_dataset_saved",
            "dataset": dataset_name,
            "node_id": node_id,
            "size_bytes": size,
        }
        send_event_to_server("beforeDatasetSaved", event)
        pipeline_events.append(event)

    @hook_impl
    def after_dataset_saved(self, dataset_name: str):
        duration = perf_counter() - self._dataset_save_times.get(dataset_name, 0)
        size = self._dataset_sizes.get(dataset_name, -1)
        node_id = (
            _hash(str(dataset_name))
            if isinstance(dataset_name, KedroNode)
            else _hash_input_output(dataset_name)
        )
        event = {
            "event": "after_dataset_saved",
            "dataset": dataset_name,
            "save_time_sec": duration,
            "node_id": node_id,
            "size_bytes": size,
        }
        send_event_to_server("afterDatasetSaved", event)
        pipeline_events.append(event)

    @hook_impl
    def after_pipeline_run(self, run_params, pipeline, catalog):
        """At the end of the run, write events to a file."""
        event = {
            "event": "after_pipeline_run",
        }
        send_event_to_server("afterPipelineRun", event)
        pipeline_events.append(event)
        self._write_events_to_file()

    @hook_impl
    def on_node_error(self, error: Exception, node: Any):
        node_id = (
            _hash(str(node))
            if isinstance(node, KedroNode)
            else _hash_input_output(node)
        )
        event = {
            "event": "on_node_error",
            "node": node.name,
            "node_id": node_id,
            "error": str(error),
        }
        send_event_to_server("onNodeError", event)
        pipeline_events.append(event)
        self._write_events_to_file()

    @hook_impl
    def on_pipeline_error(self, error: Exception, run_params: dict):
        event = {
            "event": "on_pipeline_error",
            "error": str(error),
        }
        send_event_to_server("onPipelineError", event)
        pipeline_events.append(event)
        self._write_events_to_file()    

pipeline_run_hook = PipelineRunHooks()