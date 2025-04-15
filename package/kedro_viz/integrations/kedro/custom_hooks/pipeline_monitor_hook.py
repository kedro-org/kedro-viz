import json
import sys
from time import perf_counter
from pathlib import Path
from typing import Any

from kedro.framework.hooks import hook_impl
from kedro_viz.services.events_store import event_queue

# Optional: keep a global list to write to file at the end
pipeline_events = []

class PipelineMonitorHook:
    def __init__(self):
        self._node_start_times = {}
        self._dataset_load_times = {}
        self._dataset_save_times = {}
        self._dataset_sizes = {}

    async def _queue_event(self, event: dict):
        # Save to file later
        pipeline_events.append(event)
        # Send to frontend
        event_queue.put_nowait(json.dumps(event))

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
        event = {
            "event": "before_dataset_loaded",
            "dataset": dataset_name,
        }
        event_queue.put_nowait(json.dumps(event))
        pipeline_events.append(event)

    @hook_impl
    def after_dataset_loaded(self, dataset_name: str, data: Any):
        duration = perf_counter() - self._dataset_load_times.get(dataset_name, 0)
        size = self._estimate_size(data)
        self._dataset_sizes[dataset_name] = size
        event = {
            "event": "after_dataset_loaded",
            "dataset": dataset_name,
            "load_time_sec": duration,
            "size_bytes": size,
        }
        event_queue.put_nowait(json.dumps(event))
        pipeline_events.append(event)

    @hook_impl
    def before_node_run(self, node, inputs):
        self._node_start_times[node.name] = perf_counter()
        event = {
            "event": "before_node_run",
            "node": node.name,
        }
        event_queue.put_nowait(json.dumps(event))
        pipeline_events.append(event)

    @hook_impl
    def after_node_run(self, node, inputs, outputs):
        duration = perf_counter() - self._node_start_times.get(node.name, 0)
        event = {
            "event": "after_node_run",
            "node": node.name,
            "duration_sec": duration,
            "status": "success"
        }
        event_queue.put_nowait(json.dumps(event))
        pipeline_events.append(event)

    @hook_impl
    def before_dataset_saved(self, dataset_name: str, data: Any):
        self._dataset_save_times[dataset_name] = perf_counter()
        size = self._estimate_size(data)
        self._dataset_sizes[dataset_name] = size
        event = {
            "event": "before_dataset_saved",
            "dataset": dataset_name,
            "size_bytes": size,
        }
        event_queue.put_nowait(json.dumps(event))
        pipeline_events.append(event)

    @hook_impl
    def after_dataset_saved(self, dataset_name: str):
        duration = perf_counter() - self._dataset_save_times.get(dataset_name, 0)
        size = self._dataset_sizes.get(dataset_name, -1)
        event = {
            "event": "after_dataset_saved",
            "dataset": dataset_name,
            "save_time_sec": duration,
            "size_bytes": size,
        }
        event_queue.put_nowait(json.dumps(event))
        pipeline_events.append(event)

    @hook_impl
    def after_pipeline_run(self, run_params, pipeline, catalog):
        """At the end of the run, write events to a file."""
        event = {
            "event": "after_pipeline_run",
        }
        event_queue.put_nowait(json.dumps(event))
        pipeline_events.append(event)
        self._write_events_to_file()

    @hook_impl
    def on_node_error(self, error: Exception, node: Any):
        event = {
            "event": "node_error",
            "node": node.name,
            "error": str(error),
        }
        event_queue.put_nowait(json.dumps(event))
        pipeline_events.append(event)
        self._write_events_to_file()

    @hook_impl
    def on_pipeline_error(self, error: Exception, run_params: dict):
        event = {
            "event": "pipeline_error",
            "error": str(error),
        }
        event_queue.put_nowait(json.dumps(event))
        pipeline_events.append(event)
        self._write_events_to_file()

pipeline_monitor_hook = PipelineMonitorHook()
