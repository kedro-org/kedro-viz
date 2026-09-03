"""Structural and ID parity tests for snapshot-backed graphs."""

import json
from pathlib import Path
from typing import Any

import pytest

from kedro_viz.constants import ROOT_MODULAR_PIPELINE_ID
from kedro_viz.integrations.kedro.inspection.graph_builder import GraphBuilder
from kedro_viz.integrations.kedro.inspection.parameters import build_parameter_feed
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

RUNTIME_PARAM_OVERRIDE: dict[str, Any] = {"split_options": {"test_size": 0.99}}


@pytest.fixture(scope="module")
def builder(_restore_kedro_project_state) -> GraphBuilder:
    # Start state restoration before bootstrapping the demo project.
    session = _InspectionSession(DEMO_PROJECT)
    return GraphBuilder(
        session.snapshot(),
        session.catalog_config(),
        parameter_feed=build_parameter_feed(session.parameters()),
    )


def _baseline(pipeline_id: str) -> dict:
    name = "main" if pipeline_id == "__default__" else pipeline_id
    path = BASELINE_DIR / ("main.json" if name == "main" else f"pipelines/{name}.json")
    return json.loads(path.read_text(encoding="utf-8"))


def _names(nodes: list[dict], node_type: str) -> set[str]:
    key = "full_name" if node_type == "task" else "name"
    return {n[key] for n in nodes if n["type"] == node_type}


def _edge_keys(graph: dict) -> set[tuple[str, str]]:
    """Return every edge, including modular ones, as raw ID pairs.

    Node IDs match the established Viz format, so edges compare directly without
    translating to names.
    """
    return {(edge["source"], edge["target"]) for edge in graph["edges"]}


def _field_by_name(
    nodes: list[dict], node_type: str, field: str
) -> dict[str, list[str]]:
    key = "full_name" if node_type == "task" else "name"
    return {n[key]: sorted(n[field]) for n in nodes if n["type"] == node_type}


def _id_by_name(nodes: list[dict]) -> dict[tuple[str, str], str]:
    return {
        (node["type"], node.get("full_name", node["name"])): node["id"]
        for node in nodes
        if node["type"] in {"task", "data", "parameters"}
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
def test_node_ids_match_baseline(builder: GraphBuilder, pipeline_id: str) -> None:
    adapter = builder.build(pipeline_id).model_dump()
    baseline = _baseline(pipeline_id)
    assert _id_by_name(adapter["nodes"]) == _id_by_name(baseline["nodes"])


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


@pytest.mark.parametrize("pipeline_id", ALL_PIPELINES)
def test_task_parameters_match_baseline(
    builder: GraphBuilder, pipeline_id: str
) -> None:
    """Task-node parameter mappings match the legacy backend for every demo pipeline."""
    adapter = builder.build(pipeline_id).model_dump()
    baseline = _baseline(pipeline_id)
    adapter_by_full = {
        n["full_name"]: n["parameters"] for n in adapter["nodes"] if n["type"] == "task"
    }
    baseline_by_full = {
        n["full_name"]: n["parameters"]
        for n in baseline["nodes"]
        if n["type"] == "task"
    }
    assert adapter_by_full == baseline_by_full


def _graph_builder(runtime_params: dict[str, Any] | None = None) -> GraphBuilder:
    session = _InspectionSession(DEMO_PROJECT, runtime_params=runtime_params)
    return GraphBuilder(
        session.snapshot(),
        session.catalog_config(),
        parameter_feed=build_parameter_feed(session.parameters()),
    )


def test_runtime_params_are_reflected_in_task_node_parameters() -> None:
    """``--params`` overrides flow through to the task nodes that consume them."""
    graph = _graph_builder(RUNTIME_PARAM_OVERRIDE).build("__default__").model_dump()
    task_params = {
        n["full_name"]: n["parameters"] for n in graph["nodes"] if n["type"] == "task"
    }
    assert any(
        params.get("split_options", {}).get("test_size") == 0.99
        for params in task_params.values()
    )


def test_runtime_params_do_not_change_graph_topology() -> None:
    """Runtime overrides change parameter values only, not node IDs or edges."""
    base = _graph_builder().build("__default__").model_dump()
    overridden = (
        _graph_builder(RUNTIME_PARAM_OVERRIDE).build("__default__").model_dump()
    )
    assert _id_by_name(base["nodes"]) == _id_by_name(overridden["nodes"])
    assert _edge_keys(base) == _edge_keys(overridden)


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


@pytest.mark.parametrize("pipeline_id", ALL_PIPELINES)
def test_layers_list_matches_baseline(builder: GraphBuilder, pipeline_id: str) -> None:
    # The layers list is order-significant (topologically sorted).
    adapter = builder.build(pipeline_id).model_dump()
    baseline = _baseline(pipeline_id)
    assert adapter["layers"] == baseline["layers"]


def _modular_pipelines_by_name(graph: dict) -> dict[tuple[str, str], list[str] | None]:
    """Each node's ``modular_pipelines``, keyed by (type, name).

    Keyed by type as well as name so a task and a dataset sharing a name cannot overwrite
    one another and hide a mismatch.
    """
    return {
        (node["type"], node.get("full_name", node["name"])): node.get(
            "modular_pipelines"
        )
        for node in graph["nodes"]
        if node["type"] in {"task", "data", "parameters"}
    }


@pytest.mark.parametrize("pipeline_id", ALL_PIPELINES)
def test_node_modular_pipelines_match_baseline(
    builder: GraphBuilder, pipeline_id: str
) -> None:
    """Every node reports the same modular pipelines as the baseline."""
    adapter = builder.build(pipeline_id).model_dump()
    baseline = _baseline(pipeline_id)
    assert _modular_pipelines_by_name(adapter) == _modular_pipelines_by_name(baseline)


@pytest.mark.parametrize("pipeline_id", ALL_PIPELINES)
def test_modular_pipeline_nodes_match_baseline(
    builder: GraphBuilder, pipeline_id: str
) -> None:
    """Modular-pipeline nodes carry the same tags and registered pipelines."""
    adapter = builder.build(pipeline_id).model_dump()
    baseline = _baseline(pipeline_id)

    def mp_nodes(graph: dict) -> dict[str, tuple]:
        return {
            n["id"]: (sorted(n["tags"]), sorted(n["pipelines"]), n["modular_pipelines"])
            for n in graph["nodes"]
            if n["type"] == "modularPipeline"
        }

    assert mp_nodes(adapter) == mp_nodes(baseline)


@pytest.mark.parametrize("pipeline_id", ALL_PIPELINES)
def test_modular_tree_io_matches_baseline(
    builder: GraphBuilder, pipeline_id: str
) -> None:
    """Each modular pipeline exposes the same boundary inputs and outputs."""
    adapter = builder.build(pipeline_id).model_dump()
    baseline = _baseline(pipeline_id)

    def tree_io(graph: dict) -> dict[str, tuple[str, str, list[str], list[str]]]:
        return {
            mp_id: (
                entry["id"],
                entry["name"],
                sorted(entry["inputs"]),
                sorted(entry["outputs"]),
            )
            for mp_id, entry in graph["modular_pipelines"].items()
        }

    assert tree_io(adapter) == tree_io(baseline)


@pytest.mark.parametrize("pipeline_id", ALL_PIPELINES)
def test_modular_tree_children_match_baseline(
    builder: GraphBuilder, pipeline_id: str
) -> None:
    """Each modular pipeline holds the same children, compared by ID and type.

    The baseline lists a parameter in ``__root__`` twice, once as ``parameters`` and
    once as ``data``. Only that known duplicate is normalised away; every other child is
    still compared by both ID and type, so a wrong child type cannot slip through.
    """
    adapter = builder.build(pipeline_id).model_dump()
    baseline = _baseline(pipeline_id)

    def children(graph: dict, mp_id: str) -> set[tuple[str, str]]:
        return {
            (child["id"], child["type"])
            for child in graph["modular_pipelines"][mp_id]["children"]
        }

    def drop_baseline_duplicate(entries: set[tuple[str, str]]) -> set[tuple[str, str]]:
        """Remove a ``data`` entry whose ID also appears as ``parameters``."""
        parameter_ids = {cid for cid, ctype in entries if ctype == "parameters"}
        return {
            (cid, ctype)
            for cid, ctype in entries
            if not (ctype == "data" and cid in parameter_ids)
        }

    assert set(adapter["modular_pipelines"]) == set(baseline["modular_pipelines"])
    for mp_id in baseline["modular_pipelines"]:
        expected = children(baseline, mp_id)
        actual = children(adapter, mp_id)
        if mp_id == ROOT_MODULAR_PIPELINE_ID:
            expected = drop_baseline_duplicate(expected)
        assert actual == expected, mp_id
