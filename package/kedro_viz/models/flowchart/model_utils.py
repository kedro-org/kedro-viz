"""`kedro_viz.models.flowchart.model_utils` defines utils for Kedro entities in a viz graph."""

import logging
from enum import Enum
from types import FunctionType
from typing import Any, Dict, Optional, TypeAlias, Union

# JSON-safe type system
JSONScalar: TypeAlias = str | int | float | bool | None
JSONValue: TypeAlias = Union[JSONScalar, "JSONObject", "JSONArray"]
JSONObject: TypeAlias = dict[str, JSONValue]
JSONArray: TypeAlias = list[JSONValue]
Meta: TypeAlias = dict[str, JSONValue]

logger = logging.getLogger(__name__)

def _parse_filepath(dataset_description: Dict[str, Any]) -> Optional[str]:
    """
    Extract the file path from a dataset description dictionary.
    """
    filepath = dataset_description.get("filepath") or dataset_description.get("path")
    return str(filepath) if filepath else None


def _extract_wrapped_func(func: FunctionType) -> FunctionType:
    """Extract a wrapped decorated function to inspect the source code if available."""
    # Check if the function has a `__wrapped__` attribute (set by functools.wraps)
    if hasattr(func, "__wrapped__"):
        return func.__wrapped__

    # Inspect the closure for the original function if still wrapped
    if func.__closure__:
        closure = (c.cell_contents for c in func.__closure__)
        wrapped_func = next((c for c in closure if isinstance(c, FunctionType)), None)
        if wrapped_func:
            return wrapped_func

    # Return the original function if no wrapping detected
    return func

# Preview limiter helpers

# Constants
DEFAULT_ROW_LIMIT = 5
MIN_ROW_LIMIT = DEFAULT_ROW_LIMIT
MAX_ROW_LIMIT = 50
MAX_JSON_DEPTH = 5

def _get_row_limit(meta: Meta) -> int:
    """Get row limit from meta, clamped to allowed bounds."""
    limit = meta.get("limit", DEFAULT_ROW_LIMIT)
    if not isinstance(limit, int):
        return DEFAULT_ROW_LIMIT
    return max(MIN_ROW_LIMIT, min(limit, MAX_ROW_LIMIT))

# Meta helpers
def _normalize_meta(meta: Optional[Meta]) -> Meta:
    """Ensure meta is always a mutable JSON-safe dictionary."""
    return dict(meta or {})

def _update_meta_with_truncation(meta: Meta, **info: JSONValue) -> Meta:
    """Attach truncation metadata in a JSON-safe way."""
    updated: Meta = dict(meta)
    updated["truncated"] = True
    updated.setdefault("truncation", {}).update(info)
    return updated


# limiters
def _limit_list(
    content: list[JSONValue],
    meta: Meta,
    *,
    total_key: str,
    displayed_key: str,
) -> tuple[list[JSONValue], Meta]:
    """Limit list-like preview content (used by table and JSON arrays)."""
    limit = _get_row_limit(meta)

    if len(content) <= limit:
        return content, meta

    return (
        content[:limit],
        _update_meta_with_truncation(
            meta,
            **{
                total_key: len(content),
                displayed_key: limit,
            },
        ),
    )


def _limit_json_nested(
    obj: JSONValue,
    limit: int,
    *,
    depth: int = 0,
    max_depth: int = MAX_JSON_DEPTH,
) -> JSONValue:
    """Recursively limit arrays in nested JSON objects."""
    if depth >= max_depth:
        return obj

    if isinstance(obj, list):
        return obj[:limit] if len(obj) > limit else obj

    if isinstance(obj, dict):
        return {
            key: _limit_json_nested(value, limit, depth=depth + 1)
            for key, value in obj.items()
        }

    return obj


def _limit_table_preview(
    content: list[JSONValue],
    meta: Meta,
) -> tuple[list[JSONValue], Meta]:
    """Limit table preview rows using shared list limiter."""
    return _limit_list(
        content,
        meta,
        total_key="total_rows",
        displayed_key="displayed_rows",
    )

def _limit_json_preview(
    content: JSONValue,
    meta: Meta,
) -> tuple[JSONValue, Meta]:
    """Limit JSON preview, handling both arrays and nested objects."""
    limit = _get_row_limit(meta)

    if isinstance(content, list):
        limited, updated_meta = _limit_list(
            content,
            meta,
            total_key="total_items",
            displayed_key="displayed_items",
        )
        return limited, updated_meta

    if isinstance(content, dict):
        limited = _limit_json_nested(content, limit)
        if limited != content:
            return limited, _update_meta_with_truncation(meta)

    return content, meta


# limiter api
def limit_preview_data(preview: dict) -> dict:
    """Limit preview payload size for table and JSON previews only."""
    kind = preview.get("kind")
    content = preview.get("content")

    if content is None:
        return preview

    meta = _normalize_meta(preview.get("meta"))

    # Table preview
    if kind == "table" and isinstance(content, list):
        limited, updated_meta = _limit_table_preview(content, meta)
        return {
            **preview,
            "content": limited,
            "meta": updated_meta,
        }

    # JSON preview
    if kind == "json":
        limited, updated_meta = _limit_json_preview(content, meta)
        return {
            **preview,
            "content": limited,
            "meta": updated_meta,
        }
    
    return preview

# =============================================================================
# Shared base classes and enumerations for model components
# =============================================================================


class GraphNodeType(str, Enum):
    """Represent all possible node types in the graph representation of a Kedro pipeline.
    The type needs to inherit from str as well so FastAPI can serialise it. See:
    https://fastapi.tiangolo.com/tutorial/path-params/#working-with-python-enumerations
    """

    TASK = "task"
    DATA = "data"
    PARAMETERS = "parameters"
    MODULAR_PIPELINE = "modularPipeline"  # CamelCase for frontend compatibility
