"""Structural parity tests for snapshot-backed graphs, independent of node IDs."""

import json
from pathlib import Path

import pytest

from kedro_viz.integrations.kedro.inspection.graph_builder import GraphBuilder
from kedro_viz.integrations.kedro.inspection.layers import _extract_layers
from kedro_viz.integrations.kedro.inspection.snapshot_source import _InspectionSession

DEMO_PROJECT = Path(__file__).resolve().parents[3] / "demo-project"
BASELINE_DIR = Path(__file__).parent / "baseline"

# Every registered pipeline in the demo project (a baseline file exists for each).
ALL_PIPELINES = [
    "__default__",
    "data_ingestion",
    "feature_engineering",
    "modelling_stage",
    "pre_modelling",
    "reporting_stage",
]


@pytest.fixture(scope="module")
def builder(_restore_kedro_project_state) -> GraphBuilder:
    # Start state restoration before bootstrapping the demo project.
    session = _InspectionSession(DEMO_PROJECT)
    snapshot = session.snapshot()
    dataset_names = {
        name
        for pipeline in snapshot.pipelines
        for node in pipeline.nodes
        for name in [*node.inputs, *node.outputs]
    }
    layer_mapping = _extract_layers(session.catalog_config(), dataset_names)
    return GraphBuilder(snapshot, layer_mapping)


def _baseline(pipeline_id: str) -> dict:
    name = "main" if pipeline_id == "__default__" else pipeline_id
    path = BASELINE_DIR / ("main.json" if name == "main" else f"pipelines/{name}.json")
    return json.loads(path.read_text(encoding="utf-8"))


def _names(nodes: list[dict], node_type: str) -> set[str]:
    key = "full_name" if node_type == "task" else "name"
    return {n[key] for n in nodes if n["type"] == node_type}


def _edge_keys(graph: dict) -> set[tuple[str, str]]:
    """Return non-modular edges keyed by node names instead of IDs."""
    modular_ids = {n["id"] for n in graph["nodes"] if n["type"] == "modularPipeline"}
    key_by_id = {n["id"]: n.get("full_name", n["name"]) for n in graph["nodes"]}
    return {
        (key_by_id[edge["source"]], key_by_id[edge["target"]])
        for edge in graph["edges"]
        if edge["source"] not in modular_ids and edge["target"] not in modular_ids
    }


def _field_by_name(
    nodes: list[dict], node_type: str, field: str
) -> dict[str, list[str]]:
    key = "full_name" if node_type == "task" else "name"
    return {n[key]: sorted(n[field]) for n in nodes if n["type"] == node_type}


@pytest.mark.parametrize("pipeline_id", ALL_PIPELINES)
@pytest.mark.parametrize("node_type", ["task", "data", "parameters"])
def test_node_sets_match_baseline(
    builder: GraphBuilder, pipeline_id: str, node_type: str
) -> None:
    adapter = builder.build(pipeline_id).model_dump()
    baseline = _baseline(pipeline_id)
    assert _names(adapter["nodes"], node_type) == _names(baseline["nodes"], node_type)


@pytest.mark.parametrize("pipeline_id", ALL_PIPELINES)
def test_edge_connectivity_matches_baseline(
    builder: GraphBuilder, pipeline_id: str
) -> None:
    adapter = builder.build(pipeline_id).model_dump()
    baseline = _baseline(pipeline_id)
    assert _edge_keys(adapter) == _edge_keys(baseline)


def test_tags_and_pipelines_match_baseline(builder: GraphBuilder) -> None:
    adapter = builder.build("__default__").model_dump()
    baseline = _baseline("__default__")
    assert {t["id"] for t in adapter["tags"]} == {t["id"] for t in baseline["tags"]}
    assert {p["id"] for p in adapter["pipelines"]} == {
        p["id"] for p in baseline["pipelines"]
    }


def test_task_display_names_match_baseline(builder: GraphBuilder) -> None:
    adapter = builder.build("__default__").model_dump()
    baseline = _baseline("__default__")
    adapter_name_by_full = {
        n["full_name"]: n["name"] for n in adapter["nodes"] if n["type"] == "task"
    }
    baseline_name_by_full = {
        n["full_name"]: n["name"] for n in baseline["nodes"] if n["type"] == "task"
    }
    assert adapter_name_by_full == baseline_name_by_full


def test_transcoded_dataset_type_matches_baseline(builder: GraphBuilder) -> None:
    node_name = "ingestion.int_typed_shuttles"
    adapter = builder.build("data_ingestion").model_dump()
    baseline = _baseline("data_ingestion")
    adapter_node = next(
        n for n in adapter["nodes"] if n["type"] == "data" and n["name"] == node_name
    )
    baseline_node = next(
        n for n in baseline["nodes"] if n["type"] == "data" and n["name"] == node_name
    )

    assert adapter_node["dataset_type"] is None
    assert adapter_node["dataset_type"] == baseline_node["dataset_type"]


@pytest.mark.parametrize(
    ("pipeline_id", "expected"),
    [(None, "__default__"), ("data_ingestion", "data_ingestion")],
)
def test_selected_pipeline(
    builder: GraphBuilder, pipeline_id: str | None, expected: str
) -> None:
    assert builder.build(pipeline_id).selected_pipeline == expected


@pytest.mark.parametrize("pipeline_id", ALL_PIPELINES)
@pytest.mark.parametrize("node_type", ["task", "data", "parameters"])
def test_per_node_fields_match_baseline(
    builder: GraphBuilder, pipeline_id: str, node_type: str
) -> None:
    """Per-node pipeline dictionary and tags match every baseline view."""
    adapter = builder.build(pipeline_id).model_dump()
    baseline = _baseline(pipeline_id)
    for field in ("pipelines", "tags"):
        assert _field_by_name(adapter["nodes"], node_type, field) == _field_by_name(
            baseline["nodes"], node_type, field
        ), field


@pytest.mark.parametrize("pipeline_id", ALL_PIPELINES)
def test_data_node_layers_match_baseline(
    builder: GraphBuilder, pipeline_id: str
) -> None:
    """Each data node's ``layer`` (read from the catalog config) matches the baseline view."""
    adapter = builder.build(pipeline_id).model_dump()
    baseline = _baseline(pipeline_id)

    def layer_by_name(graph: dict) -> dict[str, "str | None"]:
        return {
            n["name"]: n.get("layer") for n in graph["nodes"] if n["type"] == "data"
        }

    assert layer_by_name(adapter) == layer_by_name(baseline)


@pytest.mark.parametrize("pipeline_id", ["__default__", "reporting_stage"])
def test_layers_list_matches_baseline(builder: GraphBuilder, pipeline_id: str) -> None:
    # The layers list is order-significant (topologically sorted).
    adapter = builder.build(pipeline_id).model_dump()
    baseline = _baseline(pipeline_id)
    assert adapter["layers"] == baseline["layers"]
