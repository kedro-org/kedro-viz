import inspect
from pathlib import Path
from types import FunctionType
from typing import Any, Dict, Optional, Union
import logging

try:
    # kedro 0.18.12 onwards
    from kedro.io.core import AbstractDataset
except ImportError:  # pragma: no cover
    # older versions
    from kedro.io.core import AbstractDataSet as AbstractDataset  # type: ignore

logger = logging.getLogger(__name__)


def _parse_filepath(dataset_description: Dict[str, Any]) -> Optional[str]:
    filepath = dataset_description.get("filepath") or dataset_description.get("path")
    return str(filepath) if filepath else None


def _extract_wrapped_func(func: FunctionType) -> FunctionType:
    """Extract a wrapped decorated function to inspect the source code if available."""
    if func.__closure__ is None:
        return func
    closure = (c.cell_contents for c in func.__closure__)
    wrapped_func = next((c for c in closure if isinstance(c, FunctionType)), None)
    return func if wrapped_func is None else wrapped_func


def get_dataset_type(dataset: AbstractDataset) -> str:
    """Utility function to get the dataset type."""
    return f"{dataset.__class__.__module__}.{dataset.__class__.__qualname__}"
