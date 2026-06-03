"""Extract dataset layers from the raw catalog config.

Layer is a Kedro-Viz concept (under ``metadata.kedro-viz.layer``); Kedro stores the ``metadata``
dict but doesn't interpret it, and the inspection snapshot drops it. So we read the catalog config
directly here (no ``DataCatalog`` is materialised). Transcoding is stripped, so ``name@a`` and
``name@b`` map to one layer.
"""

from __future__ import annotations

from typing import Any

from kedro_viz.utils import _strip_transcoding


def extract_layers(catalog_config: dict[str, Any]) -> dict[str, str]:
    """Map dataset name to its layer from ``metadata.kedro-viz.layer`` in the catalog config."""
    mapping: dict[str, str] = {}
    for name, config in catalog_config.items():
        if not isinstance(config, dict):
            continue
        try:
            layer = config["metadata"]["kedro-viz"]["layer"]
        except (KeyError, TypeError):
            continue
        mapping[_strip_transcoding(name)] = layer
    return mapping
