# Kedro-Viz Backend Re-Architecture Plan

## Context

kedro-viz is a read-only React app. Its Python backend was built when Kedro had no introspection API, so it manually walks `DataCatalog` + `Pipeline` objects, builds an in-memory graph, and serves it via FastAPI. The `kedro.inspection` layer (`kedro>=1.4.0`) now exposes a `get_project_snapshot()` call that encodes the same information in a structured, lightweight snapshot — making the hand-rolled graph-building stack redundant.

**The goal:** replace the heavy graph-building backend with a thin adapter over the Kedro inspection layer, without losing any UI functionality (graph rendering, detail panel, run-status, deployment, params support).

**Current pain:** ~1,200–1,500 lines of bespoke graph-building code that duplicates what Kedro now natively provides.

---

## What Must Stay vs. What Can Go

| Layer | Files | Decision | Reason |
|---|---|---|---|
| API response models | `api/rest/responses/` | **Keep** | Define the wire format the React app depends on |
| REST router | `api/rest/router.py` | **Keep** | Contract with frontend |
| Node metadata extraction | `models/flowchart/node_metadata.py` | **Keep** (trim) | Detail panel needs code, filepath, params, preview |
| Run-status hooks | `integrations/kedro/hooks.py`, `run_hooks.py` | **Keep** | Power the run-status endpoint |
| Deploy / version / metadata endpoints | `api/rest/responses/{version,metadata}.py` | **Keep** | Unrelated to graph |
| Graph-building manager | `data_access/managers.py` (~700 lines) | **Delete** | Replaced by `inspection/graph_builder.py` |
| Repositories | `data_access/repositories/` (~500 lines) | **Delete** | Replaced by snapshot lookup |
| Kedro data loader | `integrations/kedro/data_loader.py` | **Delete** | Replaced by `inspection/snapshot_source.py` |
| Internal node models | `models/flowchart/nodes.py` (factory methods + `kedro_obj` holder) | **Slim** | Only metadata extractors need live objects; graph builder can use plain dicts |
| Layer sorting service | `services/layers.py` | **Delete** | Replaced by `inspection/layers.py` |

---

## Phased Implementation

### Phase 1 — Unblock `--params` via Direct Param Overlay (Critical Path)

**Goal:** make the snapshot reflect `--params` runtime overrides so the old graph-building path can be deleted.

**What `--params` actually affects in kedro-viz:**
- Does NOT change graph structure (nodes, edges, topology are purely from pipeline definition)
- Only changes two things:
  1. The `parameters` field on task nodes in `/api/main` (e.g. `{"test_size": 0.3}`)
  2. Parameter values in the detail panel — `/api/nodes/{id}` → `ParametersNodeMetadataAPIResponse.parameters`


- `_build_project_snapshot` calls `bootstrap_project()` + `_make_config_loader()` directly — no `KedroSession`, no `KedroContext`, no full `DataCatalog` instantiation. We need no KedroSession anywhere in the new stack.

- `ProjectSnapshot.parameters` stores only sorted parameter key names (e.g. `["model_options", "test_size"]`), not their values. The docstring is explicit: *"values are not stored"*. So we must load parameter values separately via the config loader.


**Naming note — `extra_params` vs `runtime_params`:**
Kedro renamed `extra_params` → `runtime_params` at the API level in Kedro 1.0.0 (confirmed in 1.4.0 migration docs). kedro-viz still uses `extra_params` internally but already translates at the boundary (`data_loader.py:187`). Rename all internal uses to `runtime_params` as part of this work.

**Approach — Config Loader for Parameter Values + Runtime Overlay**

After the snapshot loads, make one extra lightweight call to the config loader (the same path the snapshot uses internally) to get actual parameter values, then overlay `runtime_params`:

```python
# In snapshot_source.py
def load_snapshot(project_path, env, runtime_params=None):
    snapshot = get_project_snapshot(project_path, env)
    # snapshot.parameters is list[str] (keys only) — load values separately
    config_loader = _make_config_loader(project_path, env)
    try:
        parameter_values: dict = config_loader["parameters"]
    except (KeyError, MissingConfigException):
        parameter_values = {}
    if runtime_params:
        _apply_runtime_params(parameter_values, runtime_params)
    return snapshot, parameter_values

def _apply_runtime_params(parameters: dict, runtime_params: dict):
    """Overlay dotted-key CLI params onto the parameters dict.
    e.g. {"model_options.test_size": 0.3} → parameters["model_options"]["test_size"] = 0.3
    """
    for dotted_key, value in runtime_params.items():
        keys = dotted_key.split(".")
        target = parameters
        for key in keys[:-1]:
            target = target.setdefault(key, {})
        target[keys[-1]] = value
```

No KedroSession, no hooks, no file I/O, no stale data risk, cannot be disabled.

**Files to change:**
- `package/kedro_viz/integrations/kedro/inspection/snapshot_source.py` — add `runtime_params` param, load parameter values via config loader, add `_apply_runtime_params()` helper (~35 lines)
- `package/kedro_viz/server.py` — rename `extra_params` → `runtime_params` throughout; pass to snapshot loader
- `package/kedro_viz/integrations/kedro/data_loader.py` — rename `extra_params` → `runtime_params`; deleted entirely in Phase 2
- `package/kedro_viz/launchers/cli/run.py` — rename `"extra_params"` key → `"runtime_params"` in kwargs dict (line 182)
- `package/kedro_viz/launchers/jupyter.py` — rename `"extra_params"` key → `"runtime_params"` (line 124)
- `package/kedro_viz/integrations/kedro/hooks.py` — no new hook needed

**Outcome:** ~700 lines deleted from `managers.py` + ~500 lines from `repositories/`.

---

### Phase 2 — Delete the Old Graph-Building Stack

Once Phase 1 is done and parity tests pass:

1. Delete `package/kedro_viz/data_access/managers.py`
2. Delete `package/kedro_viz/data_access/repositories/` (graph.py, catalog.py, modular_pipelines.py, registered_pipelines.py, tags.py)
3. Delete `package/kedro_viz/integrations/kedro/data_loader.py`
4. Delete `package/kedro_viz/services/layers.py`
5. Remove `LiveDataProvider` from `api/data_provider.py`; make `InspectionAdapterProvider` the only provider
6. Update `server.py` — remove `populate_data()` and `load_and_populate_data()` calls; replace with snapshot load

**Net removal:** ~1,200–1,500 lines of production code.

**Key file:** `package/kedro_viz/api/data_provider.py` — remove dual-engine routing, keep only the adapter path.

---

### Phase 3 — Slim the Internal Node Models

**Problem:** `models/flowchart/nodes.py` holds live Kedro objects (`kedro_obj: KedroNode | AbstractDataset`) because `node_metadata.py` uses them for detail-panel extraction (code, preview, filepath).

**Approach:**
- Keep `node_metadata.py` as-is — it legitimately needs live Kedro objects for preview and code extraction
- In `models/flowchart/nodes.py`: remove the factory methods and repository wiring; the graph builder (`inspection/graph_builder.py`) already builds nodes directly from snapshot data
- The metadata path (`GET /api/nodes/{id}`) stays on live objects via the "bridge" mechanism in `InspectionAdapterProvider`

**Files to change:**
- `package/kedro_viz/models/flowchart/nodes.py` — remove `create_task_node()`, `create_data_node()`, `create_parameters_node()` factory class methods and the `kedro_obj` field (move to metadata-only path)
- `package/kedro_viz/integrations/kedro/inspection/graph_builder.py` — already builds nodes without factories; no change needed

**Net removal:** ~150–200 lines from `nodes.py`.

---

### Phase 4 — Metadata Panel via Snapshot (Longer Term)

**Goal:** remove the need for live Kedro objects entirely for the detail panel.

The snapshot currently provides:
- `node.name`, `node.inputs`, `node.outputs`, `node.tags`, `node.namespace` ✅
- `catalog_config[dataset].type` → `dataset_type` ✅
- `catalog_config[dataset].metadata.kedro-viz.layer` → `layer` ✅
- `parameters` dict → parameter values ✅

Still missing from snapshot for detail panel:
- **Node source code** — `NodeSnapshot` has no `func_source` field; Kedro inspection may expose this in future; raise a Kedro-core issue
- **Dataset preview** — requires actually loading the dataset; inherently stateful, keep as-is
- **Dataset stats** — already file-based (`stats.json`), no change needed

Already solved by snapshot:
- **Dataset filepath** — `DatasetSnapshot.filepath` is extracted from catalog config by `DatasetSnapshot.from_config()` ✅
- **Parameter values** — loaded separately via config loader in Phase 1 ✅

**Approach for Phase 4:**
- Raise a Kedro-core issue to expose `func_source` in `NodeSnapshot`
- Until then: keep the live-object bridge only for node source code + dataset preview; everything else from snapshot

---

## Architecture After All Phases

```
kedro viz run
      │
      ▼
server.py  ──►  inspection/snapshot_source.py  ──►  kedro.inspection.get_project_snapshot()
      │                    │
      │         snapshot (ProjectSnapshot)
      │                    │
      ▼                    ▼
  FastAPI app      api/data_provider.py
                   InspectionAdapterProvider (only provider)
                          │
              ┌───────────┴────────────┐
              ▼                        ▼
   GET /api/main               GET /api/nodes/{id}
   inspection/graph_builder    node_metadata.py
   → GraphAPIResponse          → NodeMetadataAPIResponse
                                (code + preview via live objects
                                 via metadata bridge; rest from snapshot)
```

**What's completely gone:**
- `data_access/` directory (~1,200 lines)
- `integrations/kedro/data_loader.py` (~200 lines)
- `services/layers.py` (~60 lines)
- Dual-engine routing in `api/data_provider.py`

**What stays lean:**
- `api/rest/responses/` — unchanged (wire format)
- `models/flowchart/node_metadata.py` — unchanged (detail panel)
- `integrations/kedro/hooks.py` + `run_hooks.py` — unchanged (run-status)
- `integrations/kedro/inspection/` — the new adapter (~600 lines total)

---

## Critical Files

| File | Role in Plan |
|---|---|
| `package/kedro_viz/integrations/kedro/inspection/snapshot_source.py` | Phase 1: add `runtime_params` param + `_apply_runtime_params()` dotted-key overlay |
| `package/kedro_viz/server.py` | Phase 1+2: rename `extra_params` → `runtime_params`; pass to snapshot loader; simplify to snapshot-only init |
| `package/kedro_viz/integrations/kedro/data_loader.py` | Phase 1: rename `extra_params` → `runtime_params` to remove internal/external naming mismatch |
| `package/kedro_viz/launchers/cli/run.py` | Phase 1: rename `"extra_params"` → `"runtime_params"` in kwargs dict (line 182) |
| `package/kedro_viz/launchers/jupyter.py` | Phase 1: rename `"extra_params"` → `"runtime_params"` in kwargs dict (line 124) |
| `package/kedro_viz/api/data_provider.py` | Phase 2: remove `LiveDataProvider` |
| `package/kedro_viz/data_access/managers.py` | Phase 2: delete |
| `package/kedro_viz/data_access/repositories/` | Phase 2: delete directory |
| `package/kedro_viz/integrations/kedro/data_loader.py` | Phase 2: delete |
| `package/kedro_viz/services/layers.py` | Phase 2: delete |
| `package/kedro_viz/models/flowchart/nodes.py` | Phase 3: slim factory methods |
| `package/kedro_viz/integrations/kedro/inspection/graph_builder.py` | Already correct; validate parity |

---

## Verification

1. **Parity test** — run `package/tests/test_inspection_adapter/` baseline comparison; adapter JSON must match live-backend JSON byte-for-byte for all node types
2. **`--params` test** — `kedro viz run --params spaceflights.model_options.test_size=0.3`; verify parameter node value updated in graph and detail panel
3. **Detail panel test** — click each node type (task, data, parameters, transcoded); code, filepath, preview, stats must all render
4. **Run-status test** — run a pipeline with hooks; verify `/api/run-status` returns durations + errors
5. **Lite mode test** — run without optional dependencies; graph must still render
6. **Static export test** — `kedro viz build`; verify all node JSON files written correctly
7. **Net line count** — confirm ≥900 lines removed from production code after Phase 1+2

---

## Branch Strategy

All work lands on **`feat/backend_v2`**. `main` is untouched until every viz feature listed in the verification section is confirmed working end-to-end on the new stack. The branch should be kept rebased against `main` to ease eventual merge.

Suggested milestone gates before merging to main:
1. Phase 1+2 complete → graph renders identically; `--params` works via hook
2. Phase 3 complete → detail panel fully functional from snapshot (code, filepath, params)
3. All existing integration tests green on `feat/backend_v2`
4. Net line count confirmed ≥900 lines removed from production code

---

## Open Questions

1. Should `InspectionAdapterProvider` eventually become a public extension point (for third-party catalog adapters), or stay internal?
2. Is there a preference on where `resolved_params.json` lives — `.kedro_viz/` alongside `stats.json`, or somewhere else?
