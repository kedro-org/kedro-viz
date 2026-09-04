"""Capture the current Kedro-Viz backend output as generated test baselines.

Runs the live-object backend against ``demo-project`` and writes normalized JSON for ``/api/main``
and every ``/api/pipelines/{id}``, node-detail responses, and a per task-node ID report.

Run in the ``viz-3-14`` env (Python 3.14, kedro 1.4.0):

    conda run -n viz-3-14 python package/tests/test_inspection_adapter/capture_baseline.py

Node metadata expectations use production imports from PR 1 commit 2, before live helper
extraction. The source commit is recorded in the generated report.

The generated files are committed under ``baseline/`` and used by inspection adapter tests.
"""

# TODO(#2265): the generated graph baselines (baseline/main.json + baseline/pipelines/*) and this
# parity harness are temporary scaffolding to prove the adapter matches the live backend; remove
# them before feat/backend_v2 is merged to main.

from __future__ import annotations

import hashlib
import json
from pathlib import Path
from typing import Any

REPO_ROOT = Path(__file__).resolve().parents[3]
DEMO_PROJECT = REPO_ROOT / "demo-project"
OUT_DIR = Path(__file__).resolve().parent / "baseline"
NODE_METADATA_BASELINE_SOURCE_COMMIT = "9c3d7b5ff38619066371a8b647caa2f647291c43"


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


def normalize_node_metadata(response: dict) -> dict:
    """Normalize project paths and compact complete preview payloads."""
    response = json.loads(json.dumps(response))
    filepath = response.get("filepath")
    if isinstance(filepath, str):
        project_marker = f"{DEMO_PROJECT.name}/"
        if project_marker in filepath:
            _, project_relative_path = filepath.split(project_marker, maxsplit=1)
            response["filepath"] = f"<DEMO_PROJECT>/{project_relative_path}"
    if "preview" in response:
        preview_json = json.dumps(
            response["preview"],
            ensure_ascii=False,
            separators=(",", ":"),
            sort_keys=True,
        )
        response["preview"] = {
            "sha256": hashlib.sha256(preview_json.encode()).hexdigest()
        }
    return response


def _write_json(path: Path, data: Any) -> None:
    """Write ``data`` to ``path`` as indented, key-sorted JSON."""
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=2, sort_keys=True) + "\n", encoding="utf-8")


# --------------------------------------------------------------------------- #
# Node-ID report fields for each task node.
# --------------------------------------------------------------------------- #
def classify_node(node) -> dict:
    """Build the node-ID report entry for a Kedro node."""
    from kedro_viz.integrations.kedro import node_ids
    from kedro_viz.integrations.kedro.hooks_utils import hash_node

    # Store both IDs so tests can detect whether graph and run-status IDs are aligned.
    graph_id = node_ids._create_task_node_id(
        node_name=node.name,
        func_name=node._func_name,
        namespace=node.namespace,
        inputs=node.inputs,
        outputs=node.outputs,
    )
    runstatus_id = hash_node(node)

    if node._name is None:
        kind = "auto"
    elif node._name == node._func_name:
        kind = "explicit_eq_func"
    else:
        kind = "explicit_diff_func"

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
    }


def build_node_id_report() -> dict:
    """Return the node-ID report for all registered pipelines."""
    from kedro.framework.project import pipelines as kedro_pipelines

    seen: dict[tuple[str, str, tuple[str, ...], tuple[str, ...]], dict] = {}
    for pipe in kedro_pipelines.values():
        if pipe is None:
            continue
        for node in pipe.nodes:
            entry = classify_node(node)
            # Key by node identity, not graph ID, so an ID collision between two distinct nodes is
            # preserved for test_task_node_ids_are_unique to catch (not silently deduped away).
            identity = (
                entry["snapshot_name"],
                entry["func_name"],
                tuple(entry["inputs"]),
                tuple(entry["outputs"]),
            )
            seen.setdefault(identity, entry)

    nodes = sorted(seen.values(), key=lambda e: e["snapshot_name"])
    counts: dict[str, int] = {}
    for e in nodes:
        counts[e["kind"]] = counts.get(e["kind"], 0) + 1

    return {
        "total_task_nodes": len(nodes),
        "counts_by_kind": counts,
        "all_graph_ids_match_runstatus": all(
            e["graph_id_matches_runstatus"] for e in nodes
        ),
        "nodes": nodes,
    }


def build_node_metadata_report() -> dict[str, Any]:
    """Return capture provenance and metadata-bearing legacy node responses."""
    from fastapi import FastAPI
    from fastapi.testclient import TestClient

    from kedro_viz.api.rest.responses.nodes import (
        NodeMetadataAPIResponse,
        get_node_metadata_response,
    )
    from kedro_viz.data_access import data_access_manager

    app = FastAPI()

    @app.get(
        "/api/nodes/{node_id}",
        response_model=NodeMetadataAPIResponse,
        response_model_exclude_none=True,
    )
    async def get_node_metadata(node_id: str):
        return get_node_metadata_response(node_id)

    client = TestClient(app)
    responses = {}
    for node_id in data_access_manager.nodes.get_node_ids():
        node = data_access_manager.nodes.get_node_by_id(node_id)
        if node is not None and node.has_metadata():
            responses[node_id] = normalize_node_metadata(
                client.get(f"/api/nodes/{node_id}").json()
            )
    return {
        "captured_from_commit": NODE_METADATA_BASELINE_SOURCE_COMMIT,
        "responses": responses,
    }


# --------------------------------------------------------------------------- #
def main() -> None:
    """Capture graph, node-detail, and node-ID baselines into ``baseline/``."""
    import os

    os.chdir(DEMO_PROJECT)
    from kedro_viz.api.rest.responses.pipelines import get_kedro_project_json_data
    from kedro_viz.server import load_and_populate_data

    print(f"Loading demo project: {DEMO_PROJECT}")
    load_and_populate_data(DEMO_PROJECT)

    main_resp = normalize_graph(get_kedro_project_json_data())
    _write_json(OUT_DIR / "main.json", main_resp)
    print(
        f"  wrote main.json  (nodes={len(main_resp['nodes'])} edges={len(main_resp['edges'])})"
    )

    pipeline_ids = [p["id"] for p in main_resp.get("pipelines", [])]
    for pid in pipeline_ids:
        resp = normalize_graph(get_kedro_project_json_data(pid))
        _write_json(OUT_DIR / "pipelines" / f"{pid}.json", resp)
        print(f"  wrote pipelines/{pid}.json  (nodes={len(resp['nodes'])})")

    node_metadata = build_node_metadata_report()
    _write_json(OUT_DIR / "node_metadata.json", node_metadata)
    print(f"  wrote node_metadata.json  (nodes={len(node_metadata['responses'])})")

    report = build_node_id_report()
    _write_json(OUT_DIR / "node_id_report.json", report)
    print(
        f"  wrote node_id_report.json  "
        f"(total={report['total_task_nodes']} counts={report['counts_by_kind']})"
    )
    print(
        f"  graph ids all match run-status hook ids: {report['all_graph_ids_match_runstatus']}"
    )
    print(f"\nBaseline written to: {OUT_DIR}")


if __name__ == "__main__":
    main()
