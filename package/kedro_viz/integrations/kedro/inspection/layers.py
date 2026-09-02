"""Extract and sort dataset layers for the inspection adapter."""

from __future__ import annotations

import logging
from collections import defaultdict
from collections.abc import Iterable
from graphlib import CycleError, TopologicalSorter
from typing import Any

from kedro.io import CatalogConfigResolver

from kedro_viz.utils import _strip_transcoding

logger = logging.getLogger(__name__)


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
    layer_by_dataset: dict[str, str] = {}
    resolver_config: dict[str, dict[str, Any]] = {}
    has_patterns = False
    for name, config in catalog_config.items():
        if not isinstance(config, dict):
            continue
        # Include entries without layers to preserve Kedro's resolver precedence.
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
        _set_layer(layer_by_dataset, name, layer)

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
            _set_layer(layer_by_dataset, name, layer)

    return layer_by_dataset


def _set_layer(layer_by_dataset: dict[str, str], name: str, layer: str) -> None:
    """Store a layer under the dataset's non-transcoded name."""
    stripped = _strip_transcoding(name)
    existing = layer_by_dataset.get(stripped)
    if existing is not None and existing != layer:
        raise ValueError(
            "Transcoded datasets should have the same layer. "
            "Please ensure consistent layering in your Kedro catalog. "
            f"Mismatch found for: {stripped}"
        )
    layer_by_dataset[stripped] = layer


def sort_layers(
    layer_by_node_id: dict[str, str | None],
    dependencies: dict[str, set[str]],
) -> list[str]:
    """Return dataset layers in graph dependency order."""
    child_layers_by_node: dict[str, set[str]] = {}

    def find_child_layers(node_id: str) -> set[str]:
        if node_id in child_layers_by_node:
            return child_layers_by_node[node_id]

        child_layers = child_layers_by_node[node_id] = set()
        node_layer = layer_by_node_id.get(node_id)
        if node_layer is not None:
            child_layers.add(node_layer)

        for child_id in dependencies.get(node_id, set()):
            child_layer = layer_by_node_id.get(child_id)
            if child_layer is not None:
                child_layers.add(child_layer)
            child_layers.update(find_child_layers(child_id))

        return child_layers

    for node_id in sorted(layer_by_node_id):
        find_child_layers(node_id)

    layer_dependencies: dict[str, set[str]] = defaultdict(set)
    all_layers: set[str] = set()
    for node_id, child_layers in child_layers_by_node.items():
        node_layer = layer_by_node_id.get(node_id)
        if node_layer is None:
            continue
        all_layers.add(node_layer)
        for child_layer in child_layers:
            all_layers.add(child_layer)
            if child_layer != node_layer:
                layer_dependencies[child_layer].add(node_layer)

    for layer in all_layers:
        layer_dependencies.setdefault(layer, set())

    ordered_dependencies = {
        layer: layer_dependencies[layer] for layer in sorted(layer_dependencies)
    }
    try:
        return list(TopologicalSorter(ordered_dependencies).static_order())
    except CycleError as exc:
        logger.warning(
            "Layers visualisation is disabled as circular dependency detected among layers. "
            "Circular dependency detected: %s. "
            "Please check the `layer` configuration in your catalog for the datasets to avoid circular references. ",
            str(exc),
        )
        return []
