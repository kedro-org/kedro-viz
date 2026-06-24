"""Compare the live backend (== production/main) vs the snapshot adapter, on demo-project.

The live graph + node-metadata code is unchanged vs main (verified), so "live" here == main.

/api/main: aligned by node name (the adapter uses a NEW node-id scheme by design, so ids differ —
reported separately, not as a diff). Every other field is compared exactly.
/api/nodes/{id}: metadata payloads carry no ids, so they are compared word-for-word, for N nodes.

    conda activate viz-3-14
    python inspection-adapter-tickets/compare_live_vs_adapter.py
"""

import json
from pathlib import Path
from typing import Any

DEMO = Path(__file__).resolve().parents[1] / "demo-project"


def _key(node: dict) -> str:
    return node["full_name"] if node["type"] == "task" else node["name"]


def _to_dict(resp: Any) -> dict:
    if hasattr(resp, "model_dump"):
        return resp.model_dump()
    if hasattr(resp, "body"):
        return json.loads(resp.body)
    return {}


def build_live() -> tuple[dict, Any]:
    from kedro_viz.api.rest.responses.nodes import get_node_metadata_response
    from kedro_viz.api.rest.responses.pipelines import get_pipeline_response
    from kedro_viz.data_access import data_access_manager
    from kedro_viz.integrations.kedro import data_loader
    from kedro_viz.server import populate_data

    catalog, pipelines, extras = data_loader.load_data(DEMO)
    populate_data(data_access_manager, catalog, pipelines, extras)
    main = _to_dict(get_pipeline_response())
    return main, get_node_metadata_response  # the live metadata fn reads data_access_manager


def build_adapter() -> tuple[dict, Any]:
    from kedro_viz.api.inspection_adapter_provider import InspectionAdapterProvider

    prov = InspectionAdapterProvider(DEMO)  # full bridge (data_access_manager already populated)
    return _to_dict(prov.get_pipeline_response()), prov.get_node_metadata_response


def compare_main(live: dict, adapter: dict) -> None:
    print("=" * 72)
    print("/api/main")
    print("=" * 72)
    live_by, adapter_by = {_key(n): n for n in live["nodes"]}, {
        _key(n): n for n in adapter["nodes"]
    }
    print(f"  node count:  live={len(live['nodes'])}  adapter={len(adapter['nodes'])}")
    print(f"  node names identical? {set(live_by) == set(adapter_by)}")

    # field-by-field, ignoring the (intentionally different) id
    field_diffs = []
    for name in sorted(set(live_by) & set(adapter_by)):
        ln = {k: v for k, v in live_by[name].items() if k != "id"}
        an = {k: v for k, v in adapter_by[name].items() if k != "id"}
        if ln != an:
            field_diffs.append((name, ln, an))
    print(f"  nodes with non-id field differences: {len(field_diffs)}")
    for name, ln, an in field_diffs[:5]:
        diffs = {k: (ln.get(k), an.get(k)) for k in set(ln) | set(an) if ln.get(k) != an.get(k)}
        print(f"    - {name}: {diffs}")

    # edges, re-keyed by name (so the id-scheme difference doesn't show as a diff)
    def edge_keys(g: dict) -> set:
        by_id = {n["id"]: _key(n) for n in g["nodes"]}
        return {(by_id.get(e["source"], e["source"]), by_id.get(e["target"], e["target"]))
                for e in g["edges"]}

    print(f"  edges identical (by name)? {edge_keys(live) == edge_keys(adapter)}")
    print(f"  tags identical? { {t['id'] for t in live['tags']} == {t['id'] for t in adapter['tags']} }")
    print(f"  layers identical? {live.get('layers') == adapter.get('layers')}")
    print(f"  selected_pipeline identical? {live['selected_pipeline'] == adapter['selected_pipeline']}")
    # show the intentional id remap for a couple of nodes
    print("  id remap (intentional, D9):")
    for name in list(set(live_by) & set(adapter_by))[:3]:
        print(f"    {name}: live={live_by[name]['id']}  ->  adapter={adapter_by[name]['id']}")


def compare_nodes(live: dict, adapter: dict, live_meta, adapter_meta, n: int = 10) -> None:
    print("=" * 72)
    print(f"/api/nodes/{{id}} — word-for-word for up to {n} nodes (payloads have no ids)")
    print("=" * 72)
    live_by = {_key(x): x for x in live["nodes"]}
    adapter_by = {_key(x): x for x in adapter["nodes"]}
    names = [x for x in sorted(set(live_by) & set(adapter_by))][:n]
    ok = 0
    for name in names:
        lp = _to_dict(live_meta(live_by[name]["id"]))
        ap = _to_dict(adapter_meta(adapter_by[name]["id"]))
        match = lp == ap
        ok += match
        mark = "OK " if match else "DIFF"
        print(f"  [{mark}] {live_by[name]['type']:10} {name}")
        if not match:
            keys = set(lp) | set(ap)
            for k in sorted(keys):
                if lp.get(k) != ap.get(k):
                    lv, av = repr(lp.get(k))[:60], repr(ap.get(k))[:60]
                    print(f"        {k}: live={lv}  adapter={av}")
    print(f"  => {ok}/{len(names)} node responses word-for-word identical")


if __name__ == "__main__":
    live_main, live_meta = build_live()
    adapter_main, adapter_meta = build_adapter()
    compare_main(live_main, adapter_main)
    compare_nodes(live_main, adapter_main, live_meta, adapter_meta)
