"""Tests for file-backed node extras and layer overrides for inspection graph responses.

Node extras (stats/styles) are always read directly from the snapshot's node/dataset names
or from ``.viz/stats.json``/``.viz/styles.json``, so no live Kedro catalog or session is
needed here. How the graph builder attaches these to a node by name is covered in
``test_graph_builder_edge_cases.py``.
"""

from __future__ import annotations

import pytest
from pydantic import ValidationError

from kedro_viz.integrations.kedro.inspection.enrichment import (
    EnrichmentSources,
    GraphExtras,
    load_enrichment_sources,
)
from kedro_viz.models.metadata import NodeExtras


def test_enrichment_sources_copy_the_layer_mapping() -> None:
    """Later mutations of the caller's mapping cannot change a prepared service."""
    layers = {"companies": "raw"}
    sources = load_enrichment_sources(
        "/unused", node_extras_by_name={}, layer_by_dataset_name=layers
    )

    layers["companies"] = "changed"

    assert sources.graph_extras.layer_by_dataset_name == {"companies": "raw"}


def test_enrichment_sources_are_frozen() -> None:
    """Prepared enrichment fields cannot be replaced after construction."""
    sources = GraphExtras(layer_by_dataset_name={"companies": "raw"})

    with pytest.raises(ValidationError, match="Instance is frozen"):
        sources.layer_by_dataset_name = {}  # type: ignore[misc]


def test_enrichment_container_keeps_consumers_separate() -> None:
    extras = {"data": NodeExtras(stats={"rows": 3})}
    graph_extras = GraphExtras(layer_by_dataset_name={"data": "raw"})
    sources = EnrichmentSources(node_extras_by_name=extras, graph_extras=graph_extras)
    extras.clear()

    assert sources.node_extras_by_name["data"].stats == {"rows": 3}
    assert sources.graph_extras is graph_extras
    with pytest.raises(ValidationError, match="Instance is frozen"):
        sources.graph_extras = GraphExtras()  # type: ignore[misc]


def test_file_extras_are_read_when_none_are_supplied(tmp_path, mocker) -> None:
    """File data is the default source, with no catalog or live graph involved."""
    from kedro_viz.integrations.kedro.inspection import enrichment

    stats = mocker.patch.object(
        enrichment, "_get_dataset_stats", return_value={"companies": {"rows": 5}}
    )
    styles = mocker.patch.object(
        enrichment, "_get_node_styles", return_value={"companies": {"color": "red"}}
    )

    sources = load_enrichment_sources(tmp_path)

    stats.assert_called_once_with(tmp_path)
    styles.assert_called_once_with(tmp_path)
    assert sources.node_extras_by_name == {
        "companies": NodeExtras(stats={"rows": 5}, styles={"color": "red"})
    }
    assert sources.graph_extras.layer_by_dataset_name is None


@pytest.mark.parametrize("extras", [{}, {"companies": NodeExtras(stats={"rows": 5})}])
def test_supplied_file_extras_are_copied_without_reading_files(
    tmp_path, mocker, extras
) -> None:
    from kedro_viz.integrations.kedro.inspection import enrichment

    stats = mocker.patch.object(enrichment, "_get_dataset_stats")
    styles = mocker.patch.object(enrichment, "_get_node_styles")
    supplied = dict(extras)

    sources = load_enrichment_sources(tmp_path, node_extras_by_name=supplied)
    supplied.clear()

    stats.assert_not_called()
    styles.assert_not_called()
    assert sources.node_extras_by_name == extras
