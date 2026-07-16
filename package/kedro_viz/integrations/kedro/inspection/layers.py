"""Extract dataset layers from the raw catalog config.

Layer is a Kedro-Viz concept (under ``metadata.kedro-viz.layer``); Kedro stores the ``metadata``
dict but doesn't interpret it, and the inspection snapshot drops it. So we read the catalog config
directly here (no ``DataCatalog`` is materialised). Transcoding is stripped, so ``name@a`` and
``name@b`` map to one layer.
"""

from __future__ import annotations

from collections.abc import Iterable
from typing import Any

from kedro.io import CatalogConfigResolver

from kedro_viz.utils import _strip_transcoding


def _extract_layers(
    catalog_config: dict[str, Any], dataset_names: Iterable[str] = ()
) -> dict[str, str]:
    """Map concrete dataset names to layers from ``metadata.kedro-viz.layer``.

    Dataset factory patterns are resolved against ``dataset_names`` using Kedro's catalog
    resolver.

    Raises:
        ValueError: If transcoded variants of one dataset (``name@a``, ``name@b``) declare
            different layers, matching the legacy backend's validation.
    """
    mapping: dict[str, str] = {}
    resolver_config: dict[str, dict[str, Any]] = {}
    has_patterns = False
    for name, config in catalog_config.items():
        if not isinstance(config, dict):
            continue
        resolver_entry: dict[str, Any] = {"type": "kedro.io.MemoryDataset"}
        resolver_config[name] = resolver_entry
        try:
            layer = config["metadata"]["kedro-viz"]["layer"]
        except (KeyError, TypeError):
            continue
        resolver_entry["metadata"] = {"kedro-viz": {"layer": layer}}
        if CatalogConfigResolver.is_pattern(name):
            has_patterns = True
            continue
        _set_layer(mapping, name, layer)

    if has_patterns:
        resolver = CatalogConfigResolver(
            resolver_config,
            default_runtime_patterns={"{default}": {"type": "kedro.io.MemoryDataset"}},
        )
        for name in dataset_names:
            resolved_config = resolver.resolve_pattern(name)
            try:
                layer = resolved_config["metadata"]["kedro-viz"]["layer"]
            except (KeyError, TypeError):
                continue
            _set_layer(mapping, name, layer)

    return mapping


def _set_layer(mapping: dict[str, str], name: str, layer: str) -> None:
    """Store a layer under the dataset's non-transcoded name."""
    stripped = _strip_transcoding(name)
    existing = mapping.get(stripped)
    if existing is not None and existing != layer:
        raise ValueError(
            "Transcoded datasets should have the same layer. "
            "Please ensure consistent layering in your Kedro catalog. "
            f"Mismatch found for: {stripped}"
        )
    mapping[stripped] = layer
