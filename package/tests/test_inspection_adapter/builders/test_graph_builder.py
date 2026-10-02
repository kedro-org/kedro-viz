"""Tests for snapshot-backed graphs built from the demo project."""

from pathlib import Path
from typing import Any

import pytest

from kedro_viz.integrations.kedro.inspection.builders.graph_builder import GraphBuilder
from kedro_viz.integrations.kedro.inspection.datasource.snapshot_source import (
    _InspectionSession,
)

DEMO_PROJECT = Path(__file__).resolve().parents[4] / "demo-project"

RUNTIME_PARAM_OVERRIDE: dict[str, Any] = {"split_options": {"test_size": 0.99}}


@pytest.fixture(scope="module")
def builder(_restore_kedro_project_state) -> GraphBuilder:
    # Start state restoration before bootstrapping the demo project.
    return _graph_builder()


def _graph_builder(runtime_params: dict[str, Any] | None = None) -> GraphBuilder:
    session = _InspectionSession(DEMO_PROJECT, runtime_params=runtime_params)
    return GraphBuilder(
        session.snapshot(),
        session.catalog_config(),
        parameters=session.parameters(),
    )


def _edge_keys(graph: dict) -> set[tuple[str, str]]:
    """Return every edge, including modular ones, as raw ID pairs."""
    return {(edge["source"], edge["target"]) for edge in graph["edges"]}


def _id_by_name(nodes: list[dict]) -> dict[tuple[str, str], str]:
    return {
        (node["type"], node.get("full_name", node["name"])): node["id"]
        for node in nodes
        if node["type"] in {"task", "data", "parameters"}
    }


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


def test_transcoded_dataset_has_no_dataset_type(builder: GraphBuilder) -> None:
    """A transcoded dataset has several types, so its graph node shows none."""
    graph = builder.build("data_ingestion").model_dump()
    node = next(
        n
        for n in graph["nodes"]
        if n["type"] == "data" and n["name"] == "ingestion.int_typed_shuttles"
    )

    assert node["dataset_type"] is None


@pytest.mark.parametrize(
    ("pipeline_id", "expected"),
    [(None, "__default__"), ("data_ingestion", "data_ingestion")],
)
def test_selected_pipeline(
    builder: GraphBuilder, pipeline_id: str | None, expected: str
) -> None:
    assert builder.build(pipeline_id).selected_pipeline == expected
