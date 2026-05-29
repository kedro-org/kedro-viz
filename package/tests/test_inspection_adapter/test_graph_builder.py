"""Structural parity tests for the snapshot graph builder (Phase 2 + 3a/3b).

The adapter graph is compared to the captured live-backend baseline by **structure** — node sets
(by name/type), edge connectivity (incl. modular edges), tags, pipelines, modular-pipeline membership,
the modular tree, and layers — NOT by literal IDs, which deliberately changed (Decision D9).

Requires the inspection API (``kedro>=1.4.0``); skipped otherwise.
"""

import json
from pathlib import Path

import pytest

from kedro_viz.integrations.kedro.inspection import snapshot_source
from kedro_viz.integrations.kedro.inspection.graph_builder import GraphBuilder
from kedro_viz.integrations.kedro.inspection.layers import extract_layers

REPO_ROOT = Path(__file__).resolve().parents[3]
DEMO_PROJECT = REPO_ROOT / "demo-project"
BASELINE_DIR = Path(__file__).parent / "baseline"

pytestmark = pytest.mark.skipif(
    not snapshot_source.is_inspection_available(),
    reason="kedro inspection API unavailable (requires kedro>=1.4.0)",
)

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
    # Depend on the autouse state-restore fixture so it is set up *before* this bootstraps.
    snapshot = snapshot_source.load_snapshot(DEMO_PROJECT)
    layers = extract_layers(snapshot_source.load_catalog_config(DEMO_PROJECT))
    return GraphBuilder(snapshot, layers)


def _baseline(pipeline_id: str) -> dict:
    name = "main" if pipeline_id == "__default__" else pipeline_id
    path = BASELINE_DIR / ("main.json" if name == "main" else f"pipelines/{name}.json")
    return json.loads(path.read_text(encoding="utf-8"))


def _names(nodes: list[dict], node_type: str) -> set[str]:
    key = "full_name" if node_type == "task" else "name"
    return {n[key] for n in nodes if n["type"] == node_type}


def _edge_keys(graph: dict) -> set[tuple[str, str]]:
    """Translate ID-based edges to name keys (full_name for tasks, name/id otherwise).

    Covers all edges, including modular edges (modularPipeline IDs map to themselves).
    """
    key_by_id = {n["id"]: n.get("full_name", n["name"]) for n in graph["nodes"]}
    return {
        (key_by_id[edge["source"]], key_by_id[edge["target"]])
        for edge in graph["edges"]
    }


@pytest.mark.parametrize("pipeline_id", ALL_PIPELINES)
@pytest.mark.parametrize("node_type", ["task", "data", "parameters", "modularPipeline"])
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


def test_selected_pipeline_defaults_to_default(builder: GraphBuilder) -> None:
    assert builder.build().model_dump()["selected_pipeline"] == "__default__"


def _membership_by_key(graph: dict) -> dict[str, list | None]:
    out = {}
    for node in graph["nodes"]:
        if node["type"] in ("task", "data", "parameters"):
            key = node.get("full_name", node["name"])
            out[key] = node.get("modular_pipelines")
    return out


@pytest.mark.parametrize("pipeline_id", ALL_PIPELINES)
def test_modular_pipeline_membership_matches_baseline(
    builder: GraphBuilder, pipeline_id: str
) -> None:
    adapter = builder.build(pipeline_id).model_dump()
    baseline = _baseline(pipeline_id)
    assert _membership_by_key(adapter) == _membership_by_key(baseline)


def test_data_node_tags_match_baseline(builder: GraphBuilder) -> None:
    adapter = builder.build("__default__").model_dump()
    baseline = _baseline("__default__")

    def tags_by_name(graph: dict) -> dict[str, list[str]]:
        return {
            n["name"]: sorted(n["tags"])
            for n in graph["nodes"]
            if n["type"] in ("data", "parameters")
        }

    assert tags_by_name(adapter) == tags_by_name(baseline)


def _tree_by_name(graph: dict) -> dict[str, dict]:
    """Translate the modular tree's hashed IDs to names (modularPipeline IDs map to themselves)."""
    key = {n["id"]: n.get("full_name", n["name"]) for n in graph["nodes"]}
    return {
        mid: {
            "inputs": {key.get(i, i) for i in entry["inputs"]},
            "outputs": {key.get(o, o) for o in entry["outputs"]},
            "children": {
                (key.get(c["id"], c["id"]), c["type"]) for c in entry["children"]
            },
        }
        for mid, entry in graph["modular_pipelines"].items()
    }


def test_modular_tree_entries_match_baseline(builder: GraphBuilder) -> None:
    """Every modular-pipeline entry (not __root__) matches inputs/outputs/children by name+type."""
    adapter = _tree_by_name(builder.build("__default__").model_dump())
    baseline = _tree_by_name(_baseline("__default__"))
    modular_ids = {mid for mid in baseline if mid != "__root__"}
    assert {mid for mid in adapter if mid != "__root__"} == modular_ids
    for mid in modular_ids:
        assert adapter[mid] == baseline[mid], mid


@pytest.mark.parametrize("pipeline_id", ["__default__", "modelling_stage"])
def test_root_children_match_baseline_by_name(
    builder: GraphBuilder, pipeline_id: str
) -> None:
    """__root__ children compared by name set (the live param-as-data duplicate is not replicated)."""
    adapter = _tree_by_name(builder.build(pipeline_id).model_dump())["__root__"]
    baseline = _tree_by_name(_baseline(pipeline_id))["__root__"]
    assert {name for name, _ in adapter["children"]} == {
        name for name, _ in baseline["children"]
    }


def test_modular_pipeline_nodes_match_baseline(builder: GraphBuilder) -> None:
    adapter = builder.build("__default__").model_dump()
    baseline = _baseline("__default__")

    def mp_nodes(graph: dict) -> dict[str, tuple]:
        return {
            n["id"]: (sorted(n["tags"]), sorted(n["pipelines"]), n["modular_pipelines"])
            for n in graph["nodes"]
            if n["type"] == "modularPipeline"
        }

    assert mp_nodes(adapter) == mp_nodes(baseline)


def test_data_node_layers_match_baseline(builder: GraphBuilder) -> None:
    adapter = builder.build("__default__").model_dump()
    baseline = _baseline("__default__")

    def layer_by_name(graph: dict) -> dict[str, str | None]:
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


def test_cyclic_modular_input_edge_is_removed() -> None:
    """A modular input that is reachable from the modular pipeline must lose its input edge."""
    from kedro_viz.api.rest.responses.pipelines import GraphEdgeAPIResponse
    from kedro_viz.integrations.kedro.inspection.graph_builder import GraphBuilder
    from kedro_viz.integrations.kedro.inspection.modular_pipelines import (
        ModularTreeEntry,
    )

    tree = {"p": ModularTreeEntry(name="p", inputs={"A"}, outputs={"B"})}
    edges = {
        ("A", "p"): GraphEdgeAPIResponse(source="A", target="p"),  # input -> mp
        ("p", "B"): GraphEdgeAPIResponse(source="p", target="B"),  # mp -> output
        ("B", "A"): GraphEdgeAPIResponse(
            source="B", target="A"
        ),  # closes the loop p->B->A
    }
    GraphBuilder._remove_cyclic_modular_edges(edges, tree)
    assert ("A", "p") not in edges  # cyclic input edge dropped
    assert ("p", "B") in edges and ("B", "A") in edges  # others untouched
