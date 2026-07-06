"""Structural parity tests for the snapshot graph builder (Phase 2 — the main graph).

The adapter graph is compared to the captured live-backend baseline by **structure** — node sets
(by name/type), edge connectivity, tags, pipelines and data-node tags — NOT by literal IDs, which
deliberately changed (Decision D9).

Phase 2 builds only the main graph, so this module scopes the comparison to it: modular-pipeline
nodes and modular edges are filtered out of the baseline, and the ``layers`` and ``modular_pipelines``
fields are ignored. Modular membership/tree, layers and resolved parameters are asserted in later
phases.

Runs against the bundled demo project (requires ``kedro>=1.4.0``).
"""

import json
from pathlib import Path

import pytest

from kedro_viz.integrations.kedro.inspection.graph_builder import GraphBuilder
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
    # Depend on the autouse state-restore fixture so it is set up *before* this bootstraps.
    snapshot = _InspectionSession(DEMO_PROJECT).snapshot()
    return GraphBuilder(snapshot)


def _baseline(pipeline_id: str) -> dict:
    name = "main" if pipeline_id == "__default__" else pipeline_id
    path = BASELINE_DIR / ("main.json" if name == "main" else f"pipelines/{name}.json")
    return json.loads(path.read_text(encoding="utf-8"))


def _names(nodes: list[dict], node_type: str) -> set[str]:
    key = "full_name" if node_type == "task" else "name"
    return {n[key] for n in nodes if n["type"] == node_type}


def _edge_keys(graph: dict) -> set[tuple[str, str]]:
    """Translate ID-based edges to name keys (full_name for tasks, name otherwise).

    Modular-pipeline edges are a later phase, so edges touching a ``modularPipeline`` node are
    dropped — the phase-2 adapter emits none, and the baseline's are filtered out here.
    """
    modular_ids = {n["id"] for n in graph["nodes"] if n["type"] == "modularPipeline"}
    key_by_id = {n["id"]: n.get("full_name", n["name"]) for n in graph["nodes"]}
    return {
        (key_by_id[edge["source"]], key_by_id[edge["target"]])
        for edge in graph["edges"]
        if edge["source"] not in modular_ids and edge["target"] not in modular_ids
    }


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


def test_selected_pipeline_defaults_to_default(builder: GraphBuilder) -> None:
    assert builder.build().model_dump()["selected_pipeline"] == "__default__"


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
