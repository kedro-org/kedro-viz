"""Tests for explicit live-field enrichment of inspection graph responses."""

from __future__ import annotations

import pytest
from kedro_datasets.pandas import CSVDataset
from pydantic import ValidationError

from kedro_viz.api.rest.responses.pipelines import (
    DataNodeAPIResponse,
    GraphAPIResponse,
    GraphEdgeAPIResponse,
    NodeExtrasAPIResponse,
)
from kedro_viz.integrations.kedro.inspection.enrichment import (
    EnrichmentSources,
    enrich_graph_response,
    load_enrichment_sources,
)
from kedro_viz.integrations.kedro.node_ids import _create_dataset_node_id
from kedro_viz.models.flowchart.nodes import GraphNode, TranscodedDataNode
from kedro_viz.models.metadata import NodeExtras
from kedro_viz.utils import _hash_input_output


def _live_dataset(
    name: str,
    *,
    stats: dict | None = None,
    styles: dict | None = None,
) -> GraphNode:
    extras = (
        NodeExtras(stats=stats, styles=styles)
        if stats is not None or styles is not None
        else None
    )
    return GraphNode.create_data_node(
        dataset_id=_hash_input_output(name),
        dataset_name=name,
        layer=None,
        tags=set(),
        dataset=CSVDataset(filepath="data.csv"),
        modular_pipelines=None,
        node_extras=extras,
    )


def _graph_dataset(
    name: str,
    *,
    dataset_type: str | None = "pandas.CSVDataset",
) -> DataNodeAPIResponse:
    return DataNodeAPIResponse(
        id=_create_dataset_node_id(name),
        name=name,
        tags=[],
        pipelines=["__default__"],
        type="data",
        modular_pipelines=None,
        layer=None,
        dataset_type=dataset_type,
    )


def _graph_response(
    *nodes: DataNodeAPIResponse,
    edges: list[GraphEdgeAPIResponse] | None = None,
) -> GraphAPIResponse:
    return GraphAPIResponse(
        nodes=list(nodes),
        edges=edges or [],
        layers=[],
        tags=[],
        pipelines=[],
        modular_pipelines={},
        selected_pipeline="__default__",
    )


def test_live_dataset_fields_are_copied_by_existing_node_id() -> None:
    """Copy icon type, stats and styles without recalculating the live node ID."""
    live_node = _live_dataset(
        "companies",
        stats={"rows": 5},
        styles={"backgroundColor": "#fff"},
    )
    graph_node = _graph_dataset("companies")
    sources = load_enrichment_sources(
        "/unused", nodes=[live_node], node_extras_by_name={}
    )

    enrich_graph_response(_graph_response(graph_node), sources)

    assert live_node.id == graph_node.id
    assert graph_node.dataset_type == "pandas.csv_dataset.CSVDataset"
    assert isinstance(graph_node.node_extras, NodeExtrasAPIResponse)
    assert graph_node.node_extras.stats == {"rows": 5}
    assert graph_node.node_extras.styles == {"backgroundColor": "#fff"}


def test_enrichment_sources_copy_the_layer_mapping() -> None:
    """Later mutations of the caller's mapping cannot change a prepared service."""
    layers = {"companies": "raw"}
    sources = load_enrichment_sources(
        "/unused", node_extras_by_name={}, layer_by_dataset_name=layers
    )

    layers["companies"] = "changed"

    assert sources.layer_by_dataset_name == {"companies": "raw"}


def test_enrichment_sources_are_frozen() -> None:
    """Prepared enrichment fields cannot be replaced after construction."""
    sources = EnrichmentSources(layer_by_dataset_name={"companies": "raw"})

    with pytest.raises(ValidationError, match="Instance is frozen"):
        sources.layer_by_dataset_name = {}  # type: ignore[misc]


def test_enrichment_sources_copy_all_constructor_mappings() -> None:
    """The direct constructor defensively copies mappings just like the factory."""
    extras = {"node": NodeExtras(stats={"rows": 1})}
    dataset_types = {"node": "pandas.csv_dataset.CSVDataset"}
    sources = EnrichmentSources(
        node_extras_by_node_id=extras,
        dataset_type_by_node_id=dataset_types,
    )

    extras.clear()
    dataset_types.clear()

    assert list(sources.node_extras_by_node_id) == ["node"]
    assert list(sources.dataset_type_by_node_id) == ["node"]


def test_live_nodes_are_consumed_in_one_pass() -> None:
    """A generator supplies both extras and dataset types, not only the first mapping."""
    live_node = _live_dataset("companies", stats={"rows": 5})

    sources = load_enrichment_sources(
        "/unused", nodes=(node for node in [live_node]), node_extras_by_name={}
    )

    assert live_node.id in sources.node_extras_by_node_id
    assert live_node.id in sources.dataset_type_by_node_id


def test_missing_live_node_leaves_builder_fields_untouched() -> None:
    graph_node = _graph_dataset("only_in_snapshot")

    enrich_graph_response(_graph_response(graph_node), EnrichmentSources())

    assert graph_node.dataset_type == "pandas.CSVDataset"
    assert graph_node.node_extras is None


def test_enrichment_does_not_change_graph_topology() -> None:
    source = _graph_dataset("source")
    target = _graph_dataset("target")
    response = _graph_response(
        source,
        target,
        edges=[GraphEdgeAPIResponse(source=source.id, target=target.id)],
    )
    node_shape = [(node.id, node.type, node.name) for node in response.nodes]
    edge_shape = [(edge.source, edge.target) for edge in response.edges]
    sources = load_enrichment_sources(
        "/unused",
        nodes=[_live_dataset("source", stats={"rows": 5})],
        node_extras_by_name={},
    )

    enrich_graph_response(response, sources)

    assert [(node.id, node.type, node.name) for node in response.nodes] == node_shape
    assert [(edge.source, edge.target) for edge in response.edges] == edge_shape
    assert source.node_extras is not None


def test_transcoded_dataset_uses_one_id_without_exposing_a_dataset_type() -> None:
    """A transcoded live node enriches the base graph node but keeps its type hidden."""
    live_node = _live_dataset("ds@pandas", stats={"rows": 7})
    assert isinstance(live_node, TranscodedDataNode)
    graph_node = _graph_dataset("ds", dataset_type=None)
    sources = load_enrichment_sources(
        "/unused", nodes=[live_node], node_extras_by_name={}
    )

    enrich_graph_response(_graph_response(graph_node), sources)

    assert live_node.id == graph_node.id
    assert graph_node.dataset_type is None
    assert graph_node.node_extras is not None
    assert graph_node.node_extras.stats == {"rows": 7}


def test_file_extras_are_available_without_live_nodes(tmp_path, mocker) -> None:
    """File data does not depend on a populated catalog or live graph."""
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
    assert sources.node_extras_by_node_id == {}
    assert sources.dataset_type_by_node_id == {}
    assert sources.layer_by_dataset_name is None


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


def test_file_metadata_and_live_graph_overlays_keep_their_own_values(tmp_path) -> None:
    """Consolidation must not change live graph precedence or static file metadata."""
    file_extras = {"companies": NodeExtras(stats={"rows": 5})}
    live_node = _live_dataset("companies", stats={"rows": 9})
    live_node.id = "existing-canonical-id"

    sources = load_enrichment_sources(
        tmp_path,
        nodes=[live_node],
        node_extras_by_name=file_extras,
        layer_by_dataset_name={},
    )

    assert sources.node_extras_by_name["companies"].stats == {"rows": 5}
    assert sources.node_extras_by_node_id["existing-canonical-id"].stats == {"rows": 9}
    assert sources.layer_by_dataset_name == {}
