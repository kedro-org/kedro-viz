"""Phase 3 — the slim metadata-node builder yields a byte-identical metadata bridge.

``DataAccessManager.add_metadata_nodes`` creates the live viz node objects WITHOUT the graph
traversal (no edges / modular tree / registered-pipeline lists). This proves the metadata bridge
(``/api/nodes/{id}`` source) is identical whether the nodes were built by that slim path or by the
full ``add_pipelines`` — so Phase 4 can drop the graph-building code without changing node detail.

Additive only: nothing is switched or deleted; ``add_pipelines`` and the live fallback are intact.
"""

import json
from pathlib import Path
from typing import Any

import pytest

from kedro_viz.api.inspection_adapter_provider import InspectionAdapterProvider
from kedro_viz.integrations.kedro.inspection import snapshot_source

DEMO = Path(__file__).resolve().parents[3] / "demo-project"

pytestmark = pytest.mark.skipif(
    not snapshot_source.is_inspection_available(),
    reason="kedro inspection API unavailable (requires kedro>=1.4.0)",
)


def _bridge(repo: Any) -> dict:
    """Build the ``{new_id -> viz node}`` metadata bridge from a node repository."""
    provider = InspectionAdapterProvider.__new__(InspectionAdapterProvider)
    return provider._build_metadata_bridge(repo)


def _payload(node: Any) -> str:
    """The ``/api/nodes/{id}`` metadata payload, JSON-serialised.

    Serialising (rather than comparing dicts) makes the comparison NaN-tolerant: dataset previews
    can contain ``nan`` floats, and ``nan != nan`` would make identical payloads compare unequal.
    """
    resp = InspectionAdapterProvider._live_metadata_response(node)
    payload = (
        resp.model_dump() if hasattr(resp, "model_dump") else json.loads(resp.body)
    )
    return json.dumps(payload, sort_keys=True, default=str)


def test_slim_node_index_yields_identical_metadata_bridge(
    _restore_kedro_project_state,
) -> None:
    from kedro_viz.data_access.managers import DataAccessManager
    from kedro_viz.integrations.kedro import data_loader

    catalog, pipelines, node_extras = data_loader.load_data(DEMO)

    full = DataAccessManager()
    full.add_catalog(catalog, pipelines)
    full.add_node_extras(node_extras)
    full.add_pipelines(pipelines)  # the full path (graph engine)

    slim = DataAccessManager()
    slim.add_catalog(catalog, pipelines)
    slim.add_node_extras(node_extras)
    slim.add_metadata_nodes(pipelines)  # the slim path (nodes only)

    full_bridge, slim_bridge = _bridge(full.nodes), _bridge(slim.nodes)

    # Same set of metadata-bearing node ids.
    assert set(full_bridge) == set(slim_bridge)
    assert full_bridge, "demo should have metadata-bearing nodes"

    # And the actual /api/nodes payload is identical for every node.
    for node_id in full_bridge:
        assert _payload(full_bridge[node_id]) == _payload(slim_bridge[node_id]), node_id
