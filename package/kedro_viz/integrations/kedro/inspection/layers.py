"""Layer extraction from raw catalog config (Phase 4).

Layer is a Kedro-Viz concept (it lives under the Viz-owned ``metadata.kedro-viz.layer`` key; Kedro
stores the ``metadata`` dict but does not interpret it), so it stays a Viz concern — we do NOT ask
Kedro to expose "layer". The snapshot also drops the generic ``metadata`` dict, so we read the
catalog config here ourselves (no ``DataCatalog`` is materialised). Transcoding is stripped so
``name@a`` and ``name@b`` map to one layer.

The only non-leaky thing Kedro could expose is the raw ``metadata`` dict on ``DatasetSnapshot`` —
purely to save this extra config read — but that is optional; layer interpretation remains in Viz.
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
