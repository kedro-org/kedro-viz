"""Runtime parameter overrides on task-node ``parameters`` via ``GraphBuilder``.

Uses ``_InspectionSession.parameters()`` (config loader with ``--params`` merged) rather than
the adapter provider, which is wired in a separate ticket.
"""

from pathlib import Path
from typing import Any

from kedro_viz.integrations.kedro.inspection.graph_builder import GraphBuilder
from kedro_viz.integrations.kedro.inspection.snapshot_source import _InspectionSession

DEMO = Path(__file__).resolve().parents[3] / "demo-project"
OVERRIDE: dict[str, Any] = {"split_options": {"test_size": 0.99}}


def _builder(runtime_params: dict[str, Any] | None) -> GraphBuilder:
    session = _InspectionSession(DEMO, runtime_params=runtime_params)
    return GraphBuilder(
        session.snapshot(),
        session.catalog_config(),
        parameters=session.parameters(),
    )


def _task_params(builder: GraphBuilder) -> dict[str, dict]:
    main = builder.build("__default__").model_dump()
    return {
        n["full_name"]: n["parameters"] for n in main["nodes"] if n["type"] == "task"
    }


def _structure(
    runtime_params: dict[str, Any] | None,
) -> tuple[frozenset[str], frozenset[tuple[str, str]]]:
    main = _builder(runtime_params).build("__default__").model_dump()
    node_ids = frozenset(n["id"] for n in main["nodes"])
    edges = frozenset((e["source"], e["target"]) for e in main["edges"])
    return node_ids, edges


def test_runtime_override_is_reflected_in_task_parameters() -> None:
    params = _task_params(_builder(OVERRIDE))
    assert any(
        p.get("split_options", {}).get("test_size") == 0.99 for p in params.values()
    )


def test_runtime_override_changes_values_but_not_topology() -> None:
    base = _task_params(_builder(None))
    overridden = _task_params(_builder(OVERRIDE))
    assert base != overridden
    assert _structure(None) == _structure(OVERRIDE)
