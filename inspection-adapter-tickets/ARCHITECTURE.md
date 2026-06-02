# Inspection-Adapter — Architecture & File Map

> Cross-cutting view of the inspection-adapter work (issue #2265). For the
> step-by-step phase log read `progress.md`; for the GitHub-shaped sub-tickets
> read the other files in this folder. This doc is the **"which file belongs
> to which phase, and what is the live path for"** index.
>
> The project-level `architecture.md` at the repo root is unrelated — it
> describes the general kedro-viz architecture.

## The big picture in one paragraph

Kedro-Viz used to build the graph by loading the whole Kedro project into memory and walking it (the **live backend**). We replaced that — for the common case — with a thin **adapter** that reads a lightweight Kedro snapshot and emits the same `GraphAPIResponse` JSON the frontend already consumes. The adapter is installed at startup whenever a snapshot can be built, which is every `kedro viz run` except one: `kedro viz run --params=...`. The snapshot API has no runtime-params route, so for `--params` the adapter is intentionally not installed and the **live backend serves instead** (decision D14). **Phase 7 was originally scoped to delete the live backend; it was reclassified (D18) to retain it as the permanent runtime-params path** — see the Decision Log in `progress.md`. The provider seam (`get_runtime_data_provider`) is what routes each request to whichever engine is active, so it is retained too.

## The two engines — at a glance

```
              Phase 6 (this PR)            Phase 7 (reclassified, D18)
              ─────────────────            ──────────────────────────
   Live     ┌──────────────┐             ┌──────────────┐
   backend  │ data_access  │   fallback  │ data_access  │   RETAINED — now the
   code     │ live graph   │   only      │ live graph   │   --params runtime-
            │ traversal    │             │ traversal    │   params path
            └──────────────┘             └──────────────┘
                  +                              +
   Adapter  ┌──────────────┐             ┌──────────────┐
   code     │ inspection/  │   added     │ inspection/  │   The default path for
            │ + bridge     │             │ + bridge     │   every non-params run
            └──────────────┘             └──────────────┘
                  +                              +
   Runtime  ┌──────────────┐             ┌──────────────┐
   seam     │ data_provider│   added     │ data_provider│   RETAINED — it chooses
            │ holder       │             │ holder       │   adapter vs. live per
            └──────────────┘             └──────────────┘   request (--params)
```

## Why the live backend is retained (D18)

Phase 7 was originally scoped to delete the live backend and the seam once parity was proven. That collides with one hard requirement: `kedro viz run --params=...` must keep working, and the inspection snapshot API has no runtime-params route (D14). The live backend is the only engine that can reflect `--params`, and the seam is the only thing that routes `--params` requests to it. "Delete the live backend" and "keep `--params`" are mutually exclusive, so the live backend + seam are **retained as the runtime-params path**, not deleted. The other historical reason for a fallback — Kedro older than the inspection API — no longer applies (`kedro>=1.4.0` is the floor). Full removal would only be revisited if the snapshot API ever grows a runtime-params route.

## Code-volume accounting

| Bucket | Lines | Disposition |
|---|---:|---|
| **Runtime-provider seam** (`data_provider.py` + wiring) | ~220 | **Retained.** It chooses adapter vs. live per request — load-bearing for `--params`. |
| **Live backend code** (was in `main` before us) | ~500–700 | **Retained** as the `--params` runtime-params path. |
| **Adapter code** (added in Phase 6, the default path) | ~1,200 source + ~1,600 test | Stays. The default for every non-`--params` run. |

So Phase 6 *adds* ~3,000 lines (source + test). Phase 7 deletes **nothing** under D18 — it reclassifies the live backend + seam from "scaffolding to remove" to "the runtime-params path," and updates the docs/comments to say so.

### The runtime-provider seam — what it is and why it stays

| Where | What | Approx lines |
|---|---|---:|
| `data_provider.py` — entire file | `RuntimeDataProvider` Protocol, `LiveDataProvider`, `_AdapterProviderHolder`, `set_inspection_adapter_provider`, `get_runtime_data_provider` | ~100 |
| `save_responses.py` — `provider=` parameter + `_resolve_provider` helper | The provider injection that lets either engine drive the export | ~15 |
| `server.py` — `_configure_inspection_adapter_provider` + fallback branches in `load_and_populate_data` | Startup-time adapter installation; the live path serves `--params` and acts as the build-failure safety net | ~50 |
| `router.py` — `get_runtime_data_provider()` indirection | The route asks the seam which engine is active rather than hard-wiring one | ~5 |
| `test_data_provider.py` + provider-startup tests inside `test_server.py` | Tests for provider selection, adapter install/clear, and fallback behaviour | ~60 |

These exist because two engines coexist by design — the adapter (default) and the live backend (`--params`). As long as `--params` rides the live backend, the routes need one place to choose between them, and that is the seam.

### The live backend — what it is and why it stays

These files were in `main` before this work started. The adapter replaces what they do **for the default path**, but they remain the engine for `--params`.

| File | Lines today | Role under D18 |
|---|---:|---|
| `data_access/managers.py` | 575 | Builds the live graph + populates the metadata bridge. Serves `--params`; backs the bridge in full mode. |
| `data_access/repositories/modular_pipelines.py` | 299 | The live modular-tree builder. Used by the `--params` live path. |
| `data_access/repositories/graph.py` | 98 | `GraphNodesRepository` — the bridge reads from it in full mode. |
| `data_access/repositories/{catalog,registered_pipelines,tags}.py` | 129 | All still used by the live path. |
| `api/rest/responses/pipelines.py` — `get_pipeline_response()` body | ~30 | The live graph response builder `LiveDataProvider` delegates to. |
| `modular_pipelines.py` — `_hash(str(node))` callsites | 2 callsites | The live path's node-id scheme (internal; the bridge re-keys to the new scheme). |

Net: nothing in this table is deleted under D18. The accepted consequence is that the codebase keeps two graph engines — the price of supporting `--params` without a snapshot runtime-params route.

## File-by-file map

Every file that changed on this branch, grouped by phase, with a one-line "what it does." Demo-project output artefacts (`demo-project/.viz/*`, generated plots, etc.) are noise from running `kedro run` against the demo and are not listed.

### Planning + documentation (cross-phase)

| File | Phase | What it is |
|---|---|---|
| `INSPECTION_ADAPTER_PLAN.md` | Pre-implementation | The full implementation plan agreed before coding started. Source of truth for decisions. |
| `progress.md` | Every phase | Living log of what was done, decisions made, tests run, next steps. One entry per phase. |
| `inspection-adapter-tickets/ARCHITECTURE.md` (this file) | All | The "which file belongs where" index. |
| `inspection-adapter-tickets/README.md` | All | Reviewer-facing summary of the seven sub-tickets. |
| `inspection-adapter-tickets/FRONTEND_HANDOFF.md` | After 6.7 | Handoff doc to the frontend team. |
| `package/tests/test_inspection_adapter/README.md` | 0 | Notes on the parity baseline and the capture script. |

### Production source files (new)

| File | Phase | What it does |
|---|---|---|
| `package/kedro_viz/integrations/kedro/node_ids.py` (42 lines) | 1 (relocated in 6.1) | The shared ID functions: `task_node_id(name, inputs, outputs)` and `dataset_node_id(name)`. Both the adapter graph and the run-status hook import from here, so IDs are guaranteed identical on both sides. |
| `package/kedro_viz/integrations/kedro/inspection/__init__.py` (21 lines) | 1 | Package marker for the adapter. |
| `package/kedro_viz/integrations/kedro/inspection/snapshot_source.py` (76 lines) | 1 + 4 | `load_snapshot()`, `is_inspection_available()`, and `load_catalog_config()` (added in Phase 4 for layers). |
| `package/kedro_viz/integrations/kedro/inspection/graph_builder.py` (342 lines) | 2 + 3 + 4 (+ 6.2b + 6.5) | The core builder that turns a `ProjectSnapshot` into a `GraphAPIResponse`. Has the per-pipeline build logic, modular-tree integration, layer assignment, and the small public helpers (`has_pipeline`, `pipeline_ids`) that the provider needs. |
| `package/kedro_viz/integrations/kedro/inspection/modular_pipelines.py` (223 lines) | 3 | `ModularMembership` (per-node membership) and `ModularTreeBuilder` (tree + modular edges + cycle removal). |
| `package/kedro_viz/integrations/kedro/inspection/layers.py` (31 lines) | 4 | `extract_layers(catalog_config)` — reads `metadata.kedro-viz.layer` from the catalog (the snapshot drops it because it's a viz concept). |
| `package/kedro_viz/api/data_provider.py` (about 100 lines) | 6.2a + 6.2b (+ 6.5 + 6.7) | The runtime seam: `RuntimeDataProvider` Protocol, `LiveDataProvider`, the holder, and the factory. **Retained (D18)** — chooses adapter vs. live per request; load-bearing for `--params`. |
| `package/kedro_viz/api/inspection_adapter_provider.py` (300 lines) | 6.2b + 6.4 + 6.5 + 6.6 | The adapter-side implementation of the provider surface: graph reads, metadata bridge (full mode), snapshot lookup (lite mode), pipeline / node id lists, static export. |

### Production source files (modified — what we touched in existing files)

| File | Phase | What changed |
|---|---|---|
| `package/kedro_viz/integrations/kedro/hooks_utils.py` | 6.3 | `hash_node()` rewritten to route through `node_ids.task_node_id` / `dataset_node_id`. Removed the direct imports of `_hash` / `_hash_input_output` from `kedro_viz.utils`. |
| `package/kedro_viz/integrations/kedro/run_hooks.py` | 6.3 | `create_dataset_event()` switched from `_hash_input_output` to `node_ids.dataset_node_id` — closes the last ID-generation site outside the shared module. |
| `package/kedro_viz/server.py` | 6.2b + 6.6 + 6.7 | Added `_configure_inspection_adapter_provider()` (startup wiring + D14 `--params` live path + exception safety net). Lite mode attempts the adapter directly and falls back to the lite live load only if adapter construction fails. |
| `package/kedro_viz/api/rest/router.py` | 6.2b + 6.4 + 6.7 | `/api/main`, `/api/pipelines/{id}`, `/api/nodes/{id}`, and `/api/run-status` now go through `get_runtime_data_provider()`. |
| `package/kedro_viz/api/rest/responses/save_responses.py` | 6.5 | Refactored so every read in the export goes through a `RuntimeDataProvider` (passed in or resolved via the factory). No more direct `data_access_manager` access; the live response builders aren't imported here anymore. |

### Test files (new)

| File | Phase | What it covers |
|---|---|---|
| `package/tests/test_inspection_adapter/__init__.py` (0 lines) | 1 | Package marker. |
| `package/tests/test_inspection_adapter/conftest.py` (31 lines) | 1 | The autouse fixture that restores Kedro's global state after each test module (so bootstrapping the demo doesn't leak into other tests). |
| `package/tests/test_inspection_adapter/capture_baseline.py` (185 lines) | 0 (+ 6.3 update) | The script that captured the live-backend output as the parity baseline. Phase 6.3 updated the `graph_id` computation to use the new scheme. |
| `package/tests/test_inspection_adapter/baseline/` | 0 | The captured JSON files (one per pipeline + a per-node id report). |
| `package/tests/test_inspection_adapter/test_snapshot_source.py` (26 lines) | 1 | Tests `load_snapshot` / `is_inspection_available`. |
| `package/tests/test_inspection_adapter/test_ids.py` (83 lines) | 1 | Tests the new ID scheme properties (determinism, uniqueness, tag-invariance, no collisions). |
| `package/tests/test_inspection_adapter/test_graph_builder.py` (235 lines) | 2 + 3 + 4 | Parity tests for the snapshot graph vs the captured baseline. |
| `package/tests/test_inspection_adapter/test_layers.py` (26 lines) | 4 | Hermetic tests for the layer extractor. |
| `package/tests/test_inspection_adapter/test_inspection_adapter_provider.py` (108 lines) | 6.2b | Direct unit tests on the provider against the demo project (default behaviour, named pipeline, 404, `--pipeline` filter). |
| `package/tests/test_inspection_adapter/test_router_flag_on.py` (135 lines) | 6.2b | End-to-end via FastAPI `TestClient` with the adapter installed — `/api/main`, `/api/pipelines/{id}`, 404, `--pipeline` scope. |
| `package/tests/test_inspection_adapter/test_id_lockstep.py` (119 lines) | 6.3 | The cross-endpoint test: every `/api/main` task id equals `hash_node(live_kedro_node)`. The gate for Phase 6.3. |
| `package/tests/test_inspection_adapter/test_metadata_bridge.py` (222 lines) | 6.4 | Hermetic bridge tests + end-to-end `/api/nodes/{id}` against the populated demo project. |
| `package/tests/test_inspection_adapter/test_export.py` (125 lines) | 6.5 | Static-export tests: every metadata-bearing id in `/api/main` has a matching file in the export. |
| `package/tests/test_inspection_adapter/test_lite_metadata.py` (165 lines) | 6.6 | Hermetic snapshot-lookup tests + end-to-end lite-mode `/api/nodes/{id}` returning the thin payload. |
| `package/tests/test_api/test_data_provider.py` (about 100 lines) | 6.2a + 6.2b (+ 6.5 + 6.7) | Runtime-seam tests: protocol satisfaction, factory fallback, adapter install/clear round-trip. **Retained (D18)** — covers the seam that keeps choosing adapter vs. live. |

### Test files (modified — what we touched in existing tests)

| File | Phase | What changed |
|---|---|---|
| `package/tests/test_api/test_rest/test_responses/test_save_responses.py` | 6.5 | Rewritten to inject a stub provider rather than monkeypatch direct response functions. Adds a new test for the factory-fallback path. |
| `package/tests/test_server.py` | 6.2b + 6.6 + 6.7 | Added `TestInspectionAdapterStartup` and `TestLiteModeAdapter` coverage for adapter construction, `--params` fallback, constructor failures, and lite-mode startup. The pre-existing `TestServer` class is unchanged. |

### Demo project (noise — not code changes)

The following are output artefacts from running the demo locally and are not part of the change:

- `demo-project/.viz/kedro_pipeline_events.json` — run-status events file
- `demo-project/.viz/stats.json` — dataset stats from runs
- `demo-project/data/08_reporting/*` — generated plots / jsons
- `demo-project/.viz/kedro_pipeline_events copy.json` — manual backup we made while debugging
- `demo-project/pyproject.toml` — likely a benign demo-project tweak

## Where to look for what

If you want to understand a specific concern, here's the entry point:

| Question | File |
|---|---|
| How is the graph built from a snapshot? | `inspection/graph_builder.py` — `GraphBuilder.build` |
| How does the modular tree work? | `inspection/modular_pipelines.py` — `ModularTreeBuilder` |
| Where do layers come from? | `inspection/layers.py` — `extract_layers` |
| Where is the runtime provider seam (adapter vs. live)? | `api/data_provider.py` — `get_runtime_data_provider` |
| Where is the bridge built? | `inspection_adapter_provider.py` — `_build_metadata_bridge` |
| Where is the lite-mode payload built? | `inspection_adapter_provider.py` — `_build_snapshot_lookup` |
| Where does the lite-mode short-circuit live? | `server.py` — `load_and_populate_data` |
| Where is the cross-endpoint ID lockstep proven? | `tests/test_inspection_adapter/test_id_lockstep.py` |
| What does the frontend team need to do? | `inspection-adapter-tickets/FRONTEND_HANDOFF.md` |

## Phase 7 outcome — reclassification, not deletion (D18)

Phase 7 was originally scoped as a deletion PR. It was reclassified (D18): because `--params` is
served by the live backend and the snapshot API has no runtime-params route (D14), the live
backend + seam are **retained as the runtime-params path**. Nothing in the list below is deleted.
Each piece now has a permanent job:

```
RETAINED — the runtime seam (chooses adapter vs. live per request):
  package/kedro_viz/api/data_provider.py
    - RuntimeDataProvider Protocol, LiveDataProvider, the holder, get_runtime_data_provider
  package/tests/test_api/test_data_provider.py
    - covers provider selection + install/clear + fallback
  package/kedro_viz/api/rest/responses/save_responses.py
    - the `provider` parameter + `_resolve_provider` (export runs through whichever engine)
  package/kedro_viz/server.py
    - `_configure_inspection_adapter_provider`: installs the adapter for every non-`--params`
      run; `--params` and unexpected build failure leave the live path in place
  package/kedro_viz/api/rest/router.py
    - routes ask the seam which engine is active
  package/tests/test_server.py
    - TestInspectionAdapterStartup / TestLiteModeAdapter

RETAINED — the live backend (serves `--params`; backs the bridge in full mode):
  package/kedro_viz/data_access/managers.py
    - add_pipelines + the live graph traversal + bridge node population
  package/kedro_viz/data_access/repositories/modular_pipelines.py
    - the live modular-tree builder + the `_hash(str(node))` callsites
  package/kedro_viz/api/rest/responses/pipelines.py
    - the body of `get_pipeline_response()` (what LiveDataProvider delegates to)

ALWAYS KEPT — shared by both engines (the JSON contract + the bridge's currency):
  package/kedro_viz/models/flowchart/{nodes.py, node_metadata.py, edge.py, ...}
  package/kedro_viz/data_access/repositories/{graph,catalog,registered_pipelines,tags}.py
```

If the inspection snapshot API ever grows a runtime-params route, the `--params` justification
disappears and the deletion originally planned for Phase 7 could be revisited. Until then, the
codebase intentionally carries two graph engines.

That's the complete picture: one ledger of what's added, what's shared, and what serves `--params`.
