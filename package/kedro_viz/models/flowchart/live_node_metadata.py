"""Calculate metadata fields that still require live Kedro objects."""

import inspect
import logging
from functools import cache
from pathlib import Path
from typing import Any, Dict, List, Optional, Union, cast

from kedro.io.core import AbstractDataset
from kedro.pipeline.node import Node as KedroNode

from kedro_viz.models.utils import get_dataset_type

from .model_utils import _extract_wrapped_func, _parse_filepath
from .nodes import DataNode, TaskNode, TranscodedDataNode

logger = logging.getLogger(__name__)


def _get_kedro_task_node(task_node: TaskNode) -> KedroNode:
    return cast(KedroNode, task_node.kedro_obj)


def _get_data_node_dataset(data_node: DataNode) -> AbstractDataset:
    return cast(AbstractDataset, data_node.kedro_obj)


def _get_task_function(task_node: TaskNode) -> Any:
    func = _get_kedro_task_node(task_node).func
    return func.__func__ if inspect.ismethod(func) else func


def get_task_code(task_node: TaskNode) -> Optional[str]:
    """Return source code for a live task function when it is inspectable."""
    func = _get_task_function(task_node)
    return (
        inspect.getsource(_extract_wrapped_func(func))
        if inspect.isfunction(func)
        else None
    )


def get_task_filepath(task_node: TaskNode) -> Optional[str]:
    """Return the existing source-filepath representation for a live task."""
    func = _get_task_function(task_node)
    if not inspect.isfunction(func):
        return None

    code_full_path = Path(inspect.getfile(func)).expanduser().resolve()
    try:
        filepath = code_full_path.relative_to(Path.cwd().parent)
    except ValueError:
        filepath = code_full_path
    return str(filepath)


def _get_supported_task_preview_types() -> tuple[type, type, type]:
    from kedro.pipeline.preview_contract import (
        ImagePreview,
        MermaidPreview,
        TextPreview,
    )

    return TextPreview, MermaidPreview, ImagePreview


@cache
def _warn_missing_task_preview_contract() -> None:
    logger.warning(
        "Task node previews are disabled because this Kedro version "
        "does not provide 'kedro.pipeline.preview_contract'."
    )


def get_task_preview(task_node: TaskNode) -> Optional[Dict]:
    """Return a supported serialized preview payload for a live task."""
    kedro_node = _get_kedro_task_node(task_node)
    try:
        task_node_preview_fn = getattr(kedro_node, "preview", None)
        if task_node_preview_fn is None:
            return None

        preview_payload = task_node_preview_fn()
        if preview_payload is None:
            return None

        if not isinstance(preview_payload, _get_supported_task_preview_types()):
            return None
        return cast(Any, preview_payload).to_dict()
    except ImportError:
        _warn_missing_task_preview_contract()
        return None
    except Exception as exc:  # noqa: BLE001
        logger.warning(
            "'%s' could not be previewed. Full exception: %s: %s",
            task_node.name,
            type(exc).__name__,
            exc,
        )
        return None


def get_data_node_type(data_node: DataNode) -> Optional[str]:
    """Return the normalized type retained on a live data node."""
    return data_node.dataset_type


def get_data_node_filepath(data_node: DataNode) -> Optional[str]:
    """Return the filepath described by a live dataset."""
    return _parse_filepath(
        _get_data_node_dataset(data_node)._describe()  # noqa: SLF001
    )


def _is_data_node_preview_enabled(
    data_node: DataNode,
    dataset: AbstractDataset,
    *,
    include_previews: bool,
) -> bool:
    return (
        data_node.is_preview_enabled()
        and hasattr(dataset, "preview")
        and include_previews
    )


def get_data_node_preview(
    data_node: DataNode,
    *,
    include_previews: bool,
) -> Optional[Union[Dict, str]]:
    """Return a live dataset preview when node and request policy allow it."""
    dataset = _get_data_node_dataset(data_node)
    if not _is_data_node_preview_enabled(
        data_node, dataset, include_previews=include_previews
    ):
        return None

    try:
        preview = cast(Any, dataset).preview
        preview_args = data_node.get_preview_args() if data_node.viz_metadata else None
        if preview_args is None:
            return preview()
        return preview(**preview_args)
    except Exception as exc:  # noqa: BLE001
        logger.warning(
            "'%s' could not be previewed. Full exception: %s: %s",
            data_node.name,
            type(exc).__name__,
            exc,
        )
        return None


def get_data_node_preview_type(
    data_node: DataNode,
    *,
    include_previews: bool,
) -> Optional[str]:
    """Return the annotation name from a live dataset's preview method."""
    dataset = _get_data_node_dataset(data_node)
    if not _is_data_node_preview_enabled(
        data_node, dataset, include_previews=include_previews
    ):
        return None

    try:
        annotation = inspect.signature(cast(Any, dataset).preview).return_annotation
        return getattr(annotation, "__name__", str(annotation))
    except Exception as exc:  # noqa: BLE001
        logger.warning(
            "'%s' did not have preview type. Full exception: %s: %s",
            data_node.name,
            type(exc).__name__,
            exc,
        )
        return None


def get_transcoded_data_node_filepath(
    data_node: TranscodedDataNode,
) -> Optional[str]:
    """Return the filepath described by a live transcoded original dataset."""
    original = cast(AbstractDataset, data_node.original_version)
    return _parse_filepath(original._describe())  # noqa: SLF001


def get_transcoded_data_node_original_type(data_node: TranscodedDataNode) -> str:
    """Return the normalized type of a live transcoded original dataset."""
    return get_dataset_type(cast(AbstractDataset, data_node.original_version))


def get_transcoded_data_node_types(data_node: TranscodedDataNode) -> List[str]:
    """Return normalized types for live transcoded consumer datasets."""
    return [
        get_dataset_type(transcoded_version)
        for transcoded_version in data_node.transcoded_versions
    ]
