"""`kedro_viz.integrations.kedro.run_hooks` defines hooks to add additional functionalities for a kedro run."""

import json
import logging
import fsspec
from kedro_viz.utils import _hash, _hash_input_output
from time import perf_counter
from pathlib import Path
from typing import Any, Union
from datetime import datetime

from kedro.framework.hooks import hook_impl
from kedro.pipeline.node import Node as KedroNode

try:
    from kedro.io import KedroDataCatalog
    IS_KEDRODATACATALOG = True
except ImportError:
    KedroDataCatalog = None  # type: ignore
    IS_KEDRODATACATALOG = False

from kedro_viz.constants import VIZ_METADATA_ARGS
from kedro_viz.launchers.utils import _find_kedro_project

logger = logging.getLogger(__name__)

class PipelineRunHooks:
    """Collects pipeline run events during a Kedro run and saves them to a JSON file."""

    def __init__(self):
        self._node_start_times = {}
        self._dataset_sizes = {}
        self._missing_datasets = {}
        self._events = []
        self.datasets = {}

    def _get_dataset_file_size(self, dataset_name: str, data: Any) -> Union[int, None]:
        try:
            import pandas as pd

            if isinstance(data, pd.DataFrame):        
                dataset = self.datasets.get(dataset_name, None)

                if hasattr(dataset, "filepath") and dataset.filepath:
                    filepath = dataset.filepath
                # Fallback to private '_filepath' for known datasets
                elif hasattr(dataset, "_filepath") and dataset._filepath:
                    filepath = dataset._filepath
                else:
                    return None

                fs, path_in_fs = fsspec.core.url_to_fs(filepath)
                if fs.exists(path_in_fs):
                    file_size = fs.size(path_in_fs)
                    return file_size
                else:
                    return None

        except ImportError as exc:  # pragma: no cover
            logger.warning(
                "Unable to import dependencies to get dataset file size for %s : %s",
                dataset_name,
                exc,
            )
            return None 

        except Exception as exc:  # pragma: no cover
            logger.warning(
                "Unable to get file size for the dataset %s: %s", dataset, exc
            )
            return None   

    def _write_events_to_file(self):
        try:
            kedro_project_path = _find_kedro_project(Path.cwd())
            if not kedro_project_path:
                logger.warning("Could not find a Kedro project to create pipeline events file")
                return
            events_path = Path(f"{kedro_project_path}/{VIZ_METADATA_ARGS['path']}/kedro_pipeline_events.json")
            events_path.parent.mkdir(parents=True, exist_ok=True)
            with events_path.open("w", encoding="utf8") as file:
                json.dump(self._events, file, indent=2)
        except Exception as exc:
            logger.warning("Unable to write pipeline run events to file: %s", exc)

    def _add_event(self, event: dict, write: bool = False):
        self._events.append(event)
        if write:
            self._write_events_to_file()

    def _get_node_id(self, node):
        if isinstance(node, KedroNode):
            return _hash(str(node))
        return _hash_input_output(node)

    @hook_impl
    def after_catalog_created(self, catalog):
        try:
            if IS_KEDRODATACATALOG and isinstance(catalog, KedroDataCatalog):
                self.datasets = catalog.datasets
                logger.debug("Using KedroDataCatalog for dataset access")
            elif hasattr(catalog, "_datasets"):
                self.datasets = catalog._datasets
            else:
                self.datasets = catalog._data_sets  # type: ignore
        except Exception as exc:
            logger.warning("Unable to access datasets in catalog: %s", exc)
            self.datasets = {}
        
        for dataset_name, dataset in self.datasets.items():
            exists = False
            try:
                if hasattr(dataset, "exists"):
                    exists = dataset.exists()
            except Exception as exc:
                logger.warning("Unable to check existence for dataset %s: %s", dataset_name, exc)
            
            if not exists:
                self._missing_datasets[dataset_name] = True

    @hook_impl
    def before_pipeline_run(self, run_params, pipeline, catalog):
        if run_params.get("pipeline_name") is not None:
            return
        self._add_event({
            "event": "before_pipeline_run",
            "timestamp": datetime.utcnow().isoformat(),
        }, write=True)

    @hook_impl
    def before_dataset_loaded(self, dataset_name: str):
        if dataset_name in self._missing_datasets:
            self._add_event({
                "event": "before_dataset_loaded",
                "dataset": dataset_name,
                "node_id": _hash_input_output(dataset_name),
                "status": "Missing",
            })

    @hook_impl
    def after_dataset_loaded(self, dataset_name: str, data: Any):
        size = self._get_dataset_file_size(dataset_name, data)
        self._dataset_sizes[dataset_name] = size
        self._add_event({
            "event": "after_dataset_loaded",
            "dataset": dataset_name,
            "node_id": _hash_input_output(dataset_name),
            "size_bytes": size,
            "status": "Available",
        })

    @hook_impl
    def before_node_run(self, node, inputs):
        self._node_start_times[node.name] = perf_counter()

    @hook_impl
    def after_node_run(self, node, inputs, outputs):
        duration = perf_counter() - self._node_start_times.get(node.name, 0)
        self._add_event({
            "event": "after_node_run",
            "node": node.name,
            "node_id": self._get_node_id(node),
            "duration_sec": duration,
            "status": "success"
        })

    @hook_impl
    def before_dataset_saved(self, dataset_name: str):
        
        if dataset_name in self._missing_datasets:
            self._add_event({
                "event": "before_dataset_saved",
                "dataset": dataset_name,
                "node_id": _hash_input_output(dataset_name),
                "status": "Missing",
            })

    @hook_impl
    def after_dataset_saved(self, dataset_name: str, data: Any):
        size = self._get_dataset_file_size(dataset_name, data)
        self._add_event({
            "event": "after_dataset_saved",
            "dataset": dataset_name,
            "node_id": _hash_input_output(dataset_name),
            "size_bytes": size,
            "status": "Available",
        })

    @hook_impl
    def after_pipeline_run(self, run_params, pipeline, catalog):
        if run_params.get("pipeline_name") is not None:
            return
        self._add_event({
            "event": "after_pipeline_run",
            "timestamp": datetime.utcnow().isoformat(),
        }, write=True)

    @hook_impl
    def on_node_error(self, error: Exception, node: Any):
        self._add_event({
            "event": "on_node_error",
            "node": getattr(node, 'name', str(node)),
            "node_id": self._get_node_id(node),
            "error": str(error),
            "timestamp": datetime.utcnow().isoformat(),
        }, write=True)

    @hook_impl
    def on_pipeline_error(self, error: Exception, run_params: dict):
        self._add_event({
            "event": "on_pipeline_error",
            "error": str(error),
            "timestamp": datetime.utcnow().isoformat(),
        }, write=True)

pipeline_run_hook = PipelineRunHooks()