"""Capture the current Kedro-Viz backend output as a generated test baseline.

Runs the live-object backend against ``demo-project`` and writes normalized JSON for ``/api/main``
and every ``/api/pipelines/{id}``, plus a per task-node ID report.

Run in the ``viz-3-14`` env (Python 3.14, kedro 1.4.0):

    conda run -n viz-3-14 python package/tests/test_inspection_adapter/capture_baseline.py

The generated files are committed under ``baseline/`` and used by inspection adapter tests.
"""

# TODO(#2265): the generated graph baselines (baseline/main.json + baseline/pipelines/*) and this
# parity harness are temporary scaffolding to prove the adapter matches the live backend; remove
# them before feat/backend_v2 is merged to main.

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

REPO_ROOT = Path(__file__).resolve().parents[3]
DEMO_PROJECT = REPO_ROOT / "demo-project"
OUT_DIR = Path(__file__).resolve().parent / "baseline"


# --------------------------------------------------------------------------- #
# Normalization: make captured JSON order-stable so diffs are meaningful.
# ``layers`` is intentionally left untouched because its order is significant.
# --------------------------------------------------------------------------- #
def _sort_in_place(container: dict, key: str, sort_key: Any = None) -> None:
    """Sort ``container[key]`` in place when it is a list."""
    value = container.get(key)
    if isinstance(value, list):
        container[key] = sorted(value, key=sort_key) if sort_key else sorted(value)


def normalize_graph(resp: dict) -> dict:
    """Return a deterministic copy of a GraphAPIResponse-shaped dict."""
    resp = json.loads(json.dumps(resp))  # deep copy

    for node in resp.get("nodes", []):
        for key in ("tags", "pipelines", "modular_pipelines"):
            _sort_in_place(node, key)
    resp["nodes"] = sorted(resp.get("nodes", []), key=lambda n: n["id"])
    resp["edges"] = sorted(
        resp.get("edges", []), key=lambda e: (e["source"], e["target"])
    )
    _sort_in_place(resp, "tags", lambda x: x.get("id", ""))
    _sort_in_place(resp, "pipelines", lambda x: x.get("id", ""))

    # modular_pipelines is a dict keyed by modular pipeline id; sort each entry's lists.
    for entry in (resp.get("modular_pipelines") or {}).values():
        if isinstance(entry, dict):
            _sort_in_place(
                entry, "children", lambda c: (c.get("id", ""), c.get("type", ""))
            )
            _sort_in_place(entry, "inputs")
            _sort_in_place(entry, "outputs")
    return resp


def _write_json(path: Path, data: Any) -> None:
    """Write ``data`` to ``path`` as indented, key-sorted JSON."""
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=2, sort_keys=True) + "\n", encoding="utf-8")


# --------------------------------------------------------------------------- #
# Node-ID report fields for each task node.
# --------------------------------------------------------------------------- #
def classify_node(node) -> dict:
    """Build the node-ID report entry for a Kedro node."""
    from kedro_viz.integrations.kedro.hooks_utils import hash_node
    from kedro_viz.utils import _hash

    # Store both IDs so tests can detect whether graph and run-status IDs are aligned. A live
    # node's graph ID is a hash of its string form, which is what the adapter reconstructs.
    graph_id = _hash(str(node))
    runstatus_id = hash_node(node)

    if node._name is None:
        kind, reconstructable, note = (
            "auto",
            True,
            "func name embedded in snapshot name",
        )
    elif node._name == node._func_name:
        kind, reconstructable, note = (
            "explicit_eq_func",
            True,
            "reconstructable BY CONVENTION only (name == func), not a contract",
        )
    else:
        kind, reconstructable, note = (
            "explicit_diff_func",
            False,
            "func name absent from snapshot -> ID NOT reconstructable",
        )

    return {
        "snapshot_name": node.name,
        "namespace": node.namespace,
        "inputs": list(node.inputs),
        "outputs": list(node.outputs),
        "explicit_name": node._name,
        "func_name": node._func_name,
        "graph_id": graph_id,
        "runstatus_hook_id": runstatus_id,
        "graph_id_matches_runstatus": graph_id == runstatus_id,
        "str_node": str(node),
        "kind": kind,
        "id_reconstructable_from_snapshot": reconstructable,
        "note": note,
    }


def build_node_id_report() -> dict:
    """Return the node-ID report for all registered pipelines."""
    from kedro.framework.project import pipelines as kedro_pipelines

    seen: dict[tuple[str, tuple[str, ...], tuple[str, ...]], dict] = {}
    for pipe in kedro_pipelines.values():
        if pipe is None:
            continue
        for node in pipe.nodes:
            entry = classify_node(node)
            # Key by node identity, not graph ID, so an ID collision between two distinct nodes is
            # preserved for test_task_node_ids_are_unique to catch (not silently deduped away).
            identity = (
                entry["snapshot_name"],
                tuple(entry["inputs"]),
                tuple(entry["outputs"]),
            )
            seen.setdefault(identity, entry)

    nodes = sorted(seen.values(), key=lambda e: e["snapshot_name"])
    counts: dict[str, int] = {}
    for e in nodes:
        counts[e["kind"]] = counts.get(e["kind"], 0) + 1

    reconstructable = sum(1 for e in nodes if e["id_reconstructable_from_snapshot"])
    return {
        "total_task_nodes": len(nodes),
        "counts_by_kind": counts,
        "reconstructable": reconstructable,
        "not_reconstructable": len(nodes) - reconstructable,
        "all_graph_ids_match_runstatus": all(
            e["graph_id_matches_runstatus"] for e in nodes
        ),
        "nodes": nodes,
    }


# --------------------------------------------------------------------------- #
def _graph_dict(provider, pipeline_id: str | None = None) -> dict:
    """A GraphAPIResponse from the adapter as a plain dict."""
    from kedro_viz.api.rest.responses.pipelines import GraphAPIResponse

    result = provider.get_pipeline_response(pipeline_id)
    assert isinstance(result, GraphAPIResponse)
    return result.model_dump()


def main() -> None:
    """Capture the baseline graph responses and node-ID report into ``baseline/``."""
    import os

    os.chdir(DEMO_PROJECT)
    from kedro_viz.api.inspection_adapter_provider import InspectionAdapterProvider

    print(f"Loading demo project: {DEMO_PROJECT}")
    provider = InspectionAdapterProvider(DEMO_PROJECT)

    main_resp = normalize_graph(_graph_dict(provider))
    _write_json(OUT_DIR / "main.json", main_resp)
    print(
        f"  wrote main.json  (nodes={len(main_resp['nodes'])} edges={len(main_resp['edges'])})"
    )

    for pid in provider.get_pipeline_ids():
        resp = normalize_graph(_graph_dict(provider, pid))
        _write_json(OUT_DIR / "pipelines" / f"{pid}.json", resp)
        print(f"  wrote pipelines/{pid}.json  (nodes={len(resp['nodes'])})")

    report = build_node_id_report()
    _write_json(OUT_DIR / "node_id_report.json", report)
    print(
        f"  wrote node_id_report.json  "
        f"(total={report['total_task_nodes']} "
        f"reconstructable={report['reconstructable']} "
        f"not={report['not_reconstructable']} "
        f"counts={report['counts_by_kind']})"
    )
    print(
        f"  graph ids all match run-status hook ids: {report['all_graph_ids_match_runstatus']}"
    )
    print(f"\nBaseline written to: {OUT_DIR}")


if __name__ == "__main__":
    main()
