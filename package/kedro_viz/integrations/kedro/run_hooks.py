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
from datetime import datetime

from kedro.framework.hooks import hook_impl
from kedro.pipeline.node import Node as KedroNode

from kedro_viz.constants import VIZ_METADATA_ARGS
from kedro_viz.launchers.utils import _find_kedro_project

logger = logging.getLogger(__name__)

# Optional: keep a global list to write to file at the end
pipeline_events = []

class PipelineRunHooks:
    def __init__(self):
        self._node_start_times = {}
        self._dataset_sizes = {}

    def _estimate_size(self, data: Any) -> int:
        """Estimate size of dataset in bytes."""
        try:
            return sys.getsizeof(data)
        except Exception:
            return -1

    def _write_events_to_file(self):
        try:
            kedro_project_path = _find_kedro_project(Path.cwd())

            if not kedro_project_path:
                logger.warning("Could not find a Kedro project to create kedro pipeline events file")
                return

            pipeline_events_file_path = Path(
                f"{kedro_project_path}/{VIZ_METADATA_ARGS['path']}/kedro_pipeline_events.json"
            )
            pipeline_events_file_path.parent.mkdir(parents=True, exist_ok=True)

            with pipeline_events_file_path.open("w", encoding="utf8") as file:
                json.dump(pipeline_events, file, indent=2)

        except Exception as exc:  # pragma: no cover
            logger.warning(
                "Unable to write pipeline run events to file: %s", exc
            )            
    @hook_impl
    def before_pipeline_run(self, run_params, pipeline, catalog):
        """At the start of the run"""
        if run_params.get("pipeline_name") is not None:
            return

        event = {
            "event": "before_pipeline_run",
            "timestamp": datetime.utcnow().isoformat(),
        }
        
        pipeline_events.append(event)
        self._write_events_to_file()


    @hook_impl
    def after_dataset_loaded(self, dataset_name: str, data: Any):
        size = self._estimate_size(data)
        self._dataset_sizes[dataset_name] = size

        node_id = _hash_input_output(dataset_name)
        event = {
            "event": "after_dataset_loaded",
            "dataset": dataset_name,
            "node_id": node_id,
            "size_bytes": size,
        }

        pipeline_events.append(event)

    @hook_impl
    def before_node_run(self, node, inputs):
        # Just keep track of time without storing the event
        self._node_start_times[node.name] = perf_counter()

    @hook_impl
    def after_node_run(self, node, inputs, outputs):
        # Calculate duration
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
        
        pipeline_events.append(event)

    @hook_impl
    def before_dataset_saved(self, dataset_name: str, data: Any):
        size = self._estimate_size(data)
        self._dataset_sizes[dataset_name] = size

    @hook_impl
    def after_dataset_saved(self, dataset_name: str):
        size = self._dataset_sizes.get(dataset_name, -1)
        node_id = _hash_input_output(dataset_name)
        
        event = {
            "event": "after_dataset_saved",
            "dataset": dataset_name,
            "node_id": node_id,
            "size_bytes": size,
        }
        
        pipeline_events.append(event)

    @hook_impl
    def after_pipeline_run(self, run_params, pipeline, catalog):
        """At the end of the run, write events to a file."""
        if run_params.get("pipeline_name") is not None:
            return

        event = {
            "event": "after_pipeline_run",
            "timestamp": datetime.utcnow().isoformat(),
        }
        
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
            "timestamp": datetime.utcnow().isoformat(),
        }

        pipeline_events.append(event)
        self._write_events_to_file()

    @hook_impl
    def on_pipeline_error(self, error: Exception, run_params: dict):
        event = {
            "event": "on_pipeline_error",
            "error": str(error),
            "timestamp": datetime.utcnow().isoformat(),
        }

        pipeline_events.append(event)
        self._write_events_to_file()    

pipeline_run_hook = PipelineRunHooks()