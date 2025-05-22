"""`kedro_viz.integrations.kedro.run_hooks` defines hooks to add additional functionalities for a kedro run."""

import json
import logging
from datetime import datetime
from pathlib import Path
from time import perf_counter
from typing import Any, Dict, Optional, Set, Union

import fsspec
from kedro.framework.hooks import hook_impl
from kedro.pipeline.node import Node as KedroNode

from kedro_viz.constants import VIZ_METADATA_ARGS
from kedro_viz.launchers.utils import _find_kedro_project
from kedro_viz.utils import _hash, _hash_input_output

# Try to import DataCatalog and KedroDataCatalog (version dependent)
try:
    from kedro.io import DataCatalog, KedroDataCatalog
    IS_KEDRODATACATALOG = True
except ImportError:
    DataCatalog = None  # type: ignore
    KedroDataCatalog = None  # type: ignore
    IS_KEDRODATACATALOG = False

logger = logging.getLogger(__name__)

class PipelineRunHooks:
    """Collects pipeline run events during a Kedro run and saves them to a JSON file.
    
    This hook implementation captures the execution of nodes, datasets being loaded and saved,
    as well as errors occurring during the pipeline execution. All events are recorded with
    timestamps and relevant metadata, and written to a JSON file within the project.
    """

    def __init__(self):
        """Initialize the hooks with empty collections for tracking data."""
        self._node_start_times: Dict[str, float] = {}
        self._dataset_sizes: Dict[str, Optional[int]] = {}
        self._events: list = []
        self.datasets: Dict[str, Any] = {}
        # Added tracking variables for error detection
        self._current_node: Optional[Any] = None
        self._current_dataset: Optional[str] = None
        self._current_operation: Optional[str] = None
        self._pipeline_nodes: list = []
        self._started_nodes: Set[str] = set()

    def _get_dataset_file_size(self, dataset_name: str, data: Any) -> Optional[int]:
        """Get the file size of a dataset.
        
        Args:
            dataset_name: Name of the dataset
            data: The dataset data object
            
        Returns:
            Size of the dataset in bytes or None if size cannot be determined
        """
        try:
            dataset = self.datasets.get(dataset_name, None)
            
            # Handle pandas DataFrame
            try:
                import pandas as pd
                is_dataframe = isinstance(data, pd.DataFrame)
            except ImportError:
                is_dataframe = False
                
            if is_dataframe:
                if hasattr(dataset, "filepath") and dataset.filepath:
                    filepath = dataset.filepath
                # Fallback to private '_filepath' for known datasets
                elif hasattr(dataset, "_filepath") and dataset._filepath:
                    filepath = dataset._filepath
                else:
                    return None

                fs, path_in_fs = fsspec.core.url_to_fs(filepath)
                if fs.exists(path_in_fs):
                    return fs.size(path_in_fs)
                return None
                
            # Handle other dataset types with filepath attribute
            elif dataset and hasattr(dataset, "filepath") and dataset.filepath:
                fs, path_in_fs = fsspec.core.url_to_fs(dataset.filepath)
                if fs.exists(path_in_fs):
                    return fs.size(path_in_fs)
                    
            # Handle other dataset types with _filepath attribute
            elif dataset and hasattr(dataset, "_filepath") and dataset._filepath:
                fs, path_in_fs = fsspec.core.url_to_fs(dataset._filepath)
                if fs.exists(path_in_fs):
                    return fs.size(path_in_fs)
                    
            return None

        except ImportError as exc:  # pragma: no cover
            logger.warning(
                "Unable to import dependencies to get dataset file size for %s: %s",
                dataset_name,
                exc,
            )
            return None 

        except Exception as exc:  # pragma: no cover
            logger.warning(
                "Unable to get file size for the dataset %s: %s", dataset_name, exc
            )
            return None

    def _write_events_to_file(self) -> None:
        """Write collected events to a JSON file in the project directory."""
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

    def _add_event(self, event: Dict[str, Any], write: bool = False) -> None:
        """Add an event to the collection and optionally write all events to file.
        
        Args:
            event: The event data to record
            write: Whether to write all events to file after adding this event
        """
        self._events.append(event)
        if write:
            self._write_events_to_file()

    def _get_node_id(self, node: Any) -> str:
        """Get a unique ID for a node.
        
        Args:
            node: A Kedro node or node-like object
            
        Returns:
            A hash string that uniquely identifies the node
        """
        if isinstance(node, KedroNode):
            return _hash(str(node))
        return _hash_input_output(node)

    def _create_dataset_event(self, 
                              event_type: str, 
                              dataset_name: str, 
                              data: Any = None, 
                              status: str = "Available",
                              node: KedroNode = None) -> Dict[str, Any]:
        """Create a standardized dataset event.
        
        Args:
            event_type: Type of event (e.g., "after_dataset_loaded")
            dataset_name: Name of the dataset
            data: Dataset data (used for size calculation)
            status: Status of the dataset
            node: The node related to this dataset operation
            
        Returns:
            Dictionary with the event data
        """
        event = {
            "event": event_type,
            "dataset": dataset_name,
            "node_id": _hash_input_output(dataset_name),
            "status": status,
        }
        
        # Add node information if available
        if node:
            event["node"] = getattr(node, 'name', str(node))
            event["node_id_from"] = self._get_node_id(node)
        
        if data is not None and status == "Available":
            size = self._get_dataset_file_size(dataset_name, data)
            if size is not None:  # Only include size if available
                event["size_bytes"] = size
            
        return event

    @hook_impl
    def after_catalog_created(self, catalog: Union[DataCatalog, "KedroDataCatalog"]):
        """Hooks to be invoked after a data catalog is created.

        Args:
            catalog: The catalog that was created.
        """
        # Check for KedroDataCatalog first (DataCatalog 2.0)
        try:
            if IS_KEDRODATACATALOG and isinstance(catalog, KedroDataCatalog):
                self.datasets = (
                    catalog.datasets
                )  # This gives access to both lazy normal datasets
                logger.debug("Using KedroDataCatalog for dataset statistics collection")
            # For original DataCatalog
            elif hasattr(catalog, "_datasets"):
                self.datasets = catalog._datasets
            else:
                # Support for older Kedro versions
                self.datasets = catalog._data_sets  # type: ignore
        except Exception as exc:  # pragma: no cover
            logger.warning("Unable to access datasets in catalog: %s", exc)
            self.datasets = {}

    @hook_impl
    def before_pipeline_run(self, run_params, pipeline, catalog) -> None:
        """Record the start of a pipeline run.
        
        Args:
            run_params: Parameters of the run
            pipeline: The pipeline being executed
            catalog: The data catalog
        """
        # Skip for named pipelines to avoid duplicate events
        if run_params.get("pipeline_name") is not None:
            return
            
        # Initialize tracking variables for this pipeline run
        self._pipeline_nodes = list(pipeline.nodes)
        self._started_nodes = set()
        self._current_node = None
        self._current_dataset = None
        self._current_operation = None
            
        self._add_event({
            "event": "before_pipeline_run",
            "timestamp": datetime.utcnow().isoformat()
        }, write=True)

    @hook_impl
    def before_dataset_loaded(self, dataset_name: str, node: KedroNode) -> None:
        """Record attempt to load a dataset, especially for missing ones.
        
        Args:
            dataset_name: Name of the dataset
            node: The node that's requesting this dataset
        """
        # Track the current dataset being loaded and the node requesting it
        self._current_dataset = dataset_name
        self._current_operation = "loading"
        self._current_node = node

    @hook_impl
    def after_dataset_loaded(self, dataset_name: str, data: Any, node: KedroNode = None) -> None:
        """Record successful dataset load with size information.
        
        Args:
            dataset_name: Name of the dataset
            data: The loaded data
            node: The node that's requesting this dataset
        """
        self._add_event(self._create_dataset_event(
            "after_dataset_loaded", 
            dataset_name, 
            data=data
        ))
        
        # Reset tracking variables after operation completes
        # Don't reset _current_node as it might be needed for error context
        self._current_dataset = None
        self._current_operation = None

    @hook_impl
    def before_node_run(self, node, inputs) -> None:
        """Record the start time of a node execution.
        
        Args:
            node: The node about to be executed
            inputs: Input data for the node
        """
        self._node_start_times[node.name] = perf_counter()
        
        # Track the current node and mark it as started
        self._current_node = node
        self._started_nodes.add(node.name)

    @hook_impl
    def after_node_run(self, node, inputs, outputs) -> None:
        """Record successful node execution with duration.
        
        Args:
            node: The node that was executed
            inputs: Input data for the node
            outputs: Output data from the node
        """
        start_time = self._node_start_times.get(node.name, perf_counter())
        duration = perf_counter() - start_time
        
        self._add_event({
            "event": "after_node_run",
            "node": node.name,
            "node_id": self._get_node_id(node),
            "duration_sec": duration,
            "status": "success"
        })
        
        # Reset the current node since it completed successfully
        if self._current_node == node:
            self._current_node = None

    @hook_impl
    def before_dataset_saved(self, dataset_name: str, node: KedroNode) -> None:
        """Record attempt to save a dataset, especially for missing ones.
        
        Args:
            dataset_name: Name of the dataset
            node: The node that's saving this dataset
        """
        # Track the current dataset being saved and the node saving it
        self._current_dataset = dataset_name
        self._current_operation = "saving"
        self._current_node = node

    @hook_impl
    def after_dataset_saved(self, dataset_name: str, data: Any, node: KedroNode = None) -> None:
        """Record successful dataset save with size information.
        
        Args:
            dataset_name: Name of the dataset
            data: The saved data
            node: The node that saved this dataset
        """
        self._add_event(self._create_dataset_event(
            "after_dataset_saved", 
            dataset_name, 
            data=data
        ))
        
        # Reset tracking variables after operation completes
        # Don't reset _current_node as it might be needed for error context
        self._current_dataset = None
        self._current_operation = None

    @hook_impl
    def after_pipeline_run(self, run_params, pipeline, catalog) -> None:
        """Record the successful completion of a pipeline run.
        
        Args:
            run_params: Parameters of the run
            pipeline: The pipeline that was executed
            catalog: The data catalog
        """
        # Skip for named pipelines to avoid duplicate events
        if run_params.get("pipeline_name") is not None:
            return
            
        self._add_event({
            "event": "after_pipeline_run",
            "timestamp": datetime.utcnow().isoformat()
        }, write=True)

    @hook_impl
    def on_node_error(self, error: Exception, node: Any) -> None:
        """Record node execution errors.
        
        Args:
            error: The exception that occurred
            node: The node that failed
        """
        self._add_event({
            "event": "on_node_error",
            "node": getattr(node, 'name', str(node)),
            "node_id": self._get_node_id(node),
            "error": str(error),
            "timestamp": datetime.utcnow().isoformat()
        }, write=True)

    @hook_impl
    def on_pipeline_error(self, error: Exception, run_params: dict) -> None:
        """Record pipeline execution errors.
        
        Args:
            error: The exception that occurred
            run_params: Parameters of the run
        """
        # Create a more detailed error event with context about the dataset if applicable
        event = {
            "event": "on_pipeline_error",
            "error": str(error),
            "timestamp": datetime.utcnow().isoformat()
        }
        
        # Add dataset context if we were in the middle of a dataset operation
        if self._current_dataset:
            event["dataset"] = self._current_dataset
            event["operation"] = self._current_operation
            if self._current_node:
                node_name = getattr(self._current_node, 'name', str(self._current_node))
                event["node"] = node_name
                event["node_id"] = self._get_node_id(self._current_node)
        # If no dataset context but we have a current node, add node info
        elif self._current_node:
            node_name = getattr(self._current_node, 'name', str(self._current_node))
            event["node"] = node_name
            event["node_id"] = self._get_node_id(self._current_node)
        # If no current node is set, try to deduce which node was about to run
        else:
            for node in self._pipeline_nodes:
                if node.name not in self._started_nodes:
                    event["node"] = node.name
                    event["node_id"] = self._get_node_id(node)
                    event["status"] = "not_started"
                    break
                    
        self._add_event(event, write=True)


pipeline_run_hook = PipelineRunHooks()