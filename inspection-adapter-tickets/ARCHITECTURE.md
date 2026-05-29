# Inspection-Adapter — Architecture & File Map

> Cross-cutting view of the inspection-adapter work (issue #2265). For the
> step-by-step phase log read `progress.md`; for the GitHub-shaped sub-tickets
> read the other files in this folder. This doc is the **"which file belongs
> to which phase, and what comes out in Phase 7"** index.
>
> The project-level `architecture.md` at the repo root is unrelated — it
> describes the general kedro-viz architecture.

## The big picture in one paragraph

Kedro-Viz used to build the graph by loading the whole Kedro project into memory and walking it (the **legacy backend**). We replaced that with a thin **adapter** that reads a lightweight Kedro snapshot and emits the same `GraphAPIResponse` JSON the frontend already consumes. To land the work safely we introduced a small **switchboard** (a runtime data provider with two implementations and a flag) so the legacy and new paths could coexist for one release while teams validate the new path. **Phase 7** then deletes both the switchboard (it was temporary scaffolding) and the legacy backend code that the adapter replaces.

## The two phases — at a glance

```
              Phase 6 (this PR)            Phase 7 (follow-up PR)
              ─────────────────            ──────────────────────
   Legacy   ┌──────────────┐             ┌──────────────┐
   backend  │ data_access  │   stays     │ data_access  │   DELETED (mostly)
   code     │ live graph   │   (with     │ live graph   │
            │ traversal    │   flag=0)   │ traversal    │
            └──────────────┘             └──────────────┘
                  +                              +
   Adapter  ┌──────────────┐             ┌──────────────┐
   code     │ inspection/  │   added     │ inspection/  │   STAYS (becomes the
            │ + bridge     │             │ + bridge     │   only path)
            └──────────────┘             └──────────────┘
                  +                              +
   Switch-  ┌──────────────┐             ┌──────────────┐
   board    │ data_provider│   added     │ data_provider│   DELETED (it was
   (temp)   │ flag, holder │             │ flag, holder │   temporary
            └──────────────┘             └──────────────┘   scaffolding)
```

## Code-volume accounting

| Bucket | Lines | What happens in Phase 7 |
|---|---:|---|
| **Switchboard / flag scaffolding** (added in Phase 6, removed in Phase 7) | ~300 | Deleted. Was temporary infra to let the two paths coexist for one release. |
| **Legacy backend code** (was in `main` before us, deletable after Phase 7) | ~500–700 | Deleted. The live pipeline-traversal that built the graph the adapter now builds from the snapshot. |
| **Adapter code** (added in Phase 6, stays forever) | ~1,200 source + ~1,600 test | Stays. This is the new path. |

So Phase 6 *adds* ~3,000 lines (source + test) and Phase 7 *deletes* ~800–1,000 lines (legacy backend + temporary switchboard). Net codebase growth after both phases: only ~2,000 lines, all of it the new path + its tests.

### What "switchboard / flag scaffolding" means specifically

These are the lines that exist **only** because the legacy and new paths needed to coexist for a release. Once Phase 7 deletes the legacy path, every line below has nothing left to switch between:

| Where | What | Approx lines |
|---|---|---:|
| `data_provider.py` — entire file | `RuntimeDataProvider` Protocol, `LiveDataProvider`, `_AdapterProviderHolder`, env var, `is_inspection_adapter_enabled`, `set_inspection_adapter_provider`, `get_runtime_data_provider` | ~150 |
| `save_responses.py` — `provider=` parameter + `_resolve_provider` helper | The provider injection that lets either implementation drive the export | ~15 |
| `server.py` — `_configure_inspection_adapter_provider` + flag-on/off branches in `load_and_populate_data` | Startup-time decision: "should we install an adapter?" | ~50 |
| `router.py` — `get_runtime_data_provider()` indirection | The route calls the factory instead of the adapter directly | ~5 |
| `test_data_provider.py` + the flag tests inside `test_server.py` | Tests for the flag itself (truthy values, default behaviour, opt-out) | ~80 |

After Phase 7: `data_provider.py` is deleted, `save_responses.py` reads from the adapter directly, `server.py` always builds the adapter, the route calls the adapter directly, and the flag tests are deleted.

### What "legacy backend code" means specifically

These files were in `main` before this work started — they're not ours to delete in Phase 6, but the adapter replaces what they do.

| File | Lines today | What stays after Phase 7 | Realistic deletion |
|---|---:|---|---:|
| `data_access/managers.py` | 575 | Catalog-indexing only (for the metadata bridge); maybe ~100 lines | ~470 |
| `data_access/repositories/modular_pipelines.py` | 299 | Almost nothing — the adapter has its own `modular_pipelines.py` | ~280 |
| `data_access/repositories/graph.py` | 98 | `GraphNodesRepository` stays (the bridge reads from it) | ~0 |
| `data_access/repositories/{catalog,registered_pipelines,tags}.py` | 129 | All stay (still used) | ~0 |
| `api/rest/responses/pipelines.py` — `get_pipeline_response()` body | ~30 | Route calls the adapter directly | ~30 |
| `modular_pipelines.py` — `_hash(str(node))` callsites (lines 205, 291) | 2 callsites | Adapter uses `node_ids.task_node_id` everywhere | ~5 |

So Phase 7 deletes roughly **500–700 lines** of legacy backend code on top of the switchboard. The codebase ends up meaningfully shorter.

## File-by-file map

Every file that changed on this branch, grouped by phase, with a one-line "what it does." Demo-project output artefacts (`demo-project/.viz/*`, generated plots, etc.) are noise from running `kedro run` against the demo and are not listed.

### Planning + documentation (cross-phase)

| File | Phase | What it is |
|---|---|---|
| `INSPECTION_ADAPTER_PLAN.md` | Pre-implementation | The full implementation plan agreed before coding started. Source of truth for decisions. |
| `progress.md` | Every phase | Living log of what was done, decisions made, tests run, next steps. One entry per phase. |
| `inspection-adapter-tickets/ARCHITECTURE.md` (this file) | All | The "which file belongs where" index. |
| `RELEASE.md` (modified) | 6.7 | New top-of-file release section announcing the breaking ID change and the temporary opt-out. |
| `inspection-adapter-tickets/README.md` | All | Reviewer-facing summary of the seven sub-tickets. |
| `inspection-adapter-tickets/01-foundations.md` | 1 | Sub-ticket for Phase 1. |
| `inspection-adapter-tickets/02-main-graph.md` | 2 | Sub-ticket for Phase 2. |
| `inspection-adapter-tickets/03-modular-pipelines.md` | 3 | Sub-ticket for Phase 3. |
| `inspection-adapter-tickets/04-layers.md` | 4 | Sub-ticket for Phase 4. |
| `inspection-adapter-tickets/05-runtime-provider-and-flag.md` | 6.2a + 6.2b | Sub-ticket for the runtime seam + experimental flag. |
| `inspection-adapter-tickets/06-id-lockstep-metadata-bridge.md` | 6.3 + 6.4 + 6.5 | Sub-ticket for the ID lockstep, metadata bridge, and export-via-provider. |
| `inspection-adapter-tickets/07-lite-mode-and-flip-default.md` | 6.6 + 6.7 | Sub-ticket for lite mode and the flag flip. |
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
| `package/kedro_viz/api/data_provider.py` (162 lines) | 6.2a + 6.2b (+ 6.5 + 6.7) | The switchboard: `RuntimeDataProvider` Protocol, `LiveDataProvider`, the env-var flag, the holder, the factory. **Entire file deleted in Phase 7.** |
| `package/kedro_viz/api/inspection_adapter_provider.py` (300 lines) | 6.2b + 6.4 + 6.5 + 6.6 | The adapter-side implementation of the provider surface: graph reads, metadata bridge (full mode), snapshot lookup (lite mode), pipeline / node id lists, static export. |

### Production source files (modified — what we touched in existing files)

| File | Phase | What changed |
|---|---|---|
| `package/kedro_viz/integrations/kedro/hooks_utils.py` | 6.3 | `hash_node()` rewritten to route through `node_ids.task_node_id` / `dataset_node_id`. Removed the direct imports of `_hash` / `_hash_input_output` from `kedro_viz.utils`. |
| `package/kedro_viz/integrations/kedro/run_hooks.py` | 6.3 | `create_dataset_event()` switched from `_hash_input_output` to `node_ids.dataset_node_id` — closes the last ID-generation site outside the shared module. |
| `package/kedro_viz/server.py` | 6.2b + 6.6 | Added `_configure_inspection_adapter_provider()` (startup wiring + D14 `--params` fallback + exception fallback). 6.6 added the lite-mode short-circuit: when adapter ON + `--lite`, skip `load_data` + `populate_data` entirely. |
| `package/kedro_viz/api/rest/router.py` | 6.2b + 6.4 | `/api/main`, `/api/pipelines/{id}`, `/api/nodes/{id}` now go through `get_runtime_data_provider()`. `/api/run-status` left on the direct call (the hook itself was switched in 6.3). |
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
| `package/tests/test_inspection_adapter/test_router_flag_on.py` (135 lines) | 6.2b | End-to-end via FastAPI `TestClient` with the flag on — `/api/main`, `/api/pipelines/{id}`, 404, `--pipeline` scope. |
| `package/tests/test_inspection_adapter/test_id_lockstep.py` (119 lines) | 6.3 | The cross-endpoint test: every `/api/main` task id equals `hash_node(live_kedro_node)`. The gate for Phase 6.3. |
| `package/tests/test_inspection_adapter/test_metadata_bridge.py` (222 lines) | 6.4 | Hermetic bridge tests + end-to-end `/api/nodes/{id}` against the populated demo project. |
| `package/tests/test_inspection_adapter/test_export.py` (125 lines) | 6.5 | Static-export tests: every metadata-bearing id in `/api/main` has a matching file in the export. |
| `package/tests/test_inspection_adapter/test_lite_metadata.py` (165 lines) | 6.6 | Hermetic snapshot-lookup tests + end-to-end lite-mode `/api/nodes/{id}` returning the thin payload. |
| `package/tests/test_api/test_data_provider.py` (147 lines) | 6.2a + 6.2b (+ 6.5 + 6.7) | Switchboard tests: protocol satisfaction, flag truthiness parametrize, factory defaults, install/clear round-trip. **Entire file deleted in Phase 7.** |

### Test files (modified — what we touched in existing tests)

| File | Phase | What changed |
|---|---|---|
| `package/tests/test_api/test_rest/test_responses/test_save_responses.py` | 6.5 | Rewritten to inject a stub provider rather than monkeypatch direct response functions. Adds a new test for the factory-fallback path. |
| `package/tests/test_server.py` | 6.2b + 6.6 + 6.7 | Added `TestInspectionAdapterStartup` (4 tests), `TestLiteModeAdapter` (3 tests), `test_env_var_unset_installs_adapter_by_default` (1 test). The pre-existing `TestServer` class is unchanged. |

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
| What's the runtime flag? | `data_provider.py` — `is_inspection_adapter_enabled` |
| Where is the bridge built? | `inspection_adapter_provider.py` — `_build_metadata_bridge` |
| Where is the lite-mode payload built? | `inspection_adapter_provider.py` — `_build_snapshot_lookup` |
| Where does the flag default get decided? | `data_provider.py` — `is_inspection_adapter_enabled` (default = on per D16) |
| Where does the lite-mode short-circuit live? | `server.py` — `load_and_populate_data` |
| Where is the cross-endpoint ID lockstep proven? | `tests/test_inspection_adapter/test_id_lockstep.py` |
| What's the breaking-change release note? | `RELEASE.md` top section |
| What does the frontend team need to do? | `inspection-adapter-tickets/FRONTEND_HANDOFF.md` |

## Phase 7 deletion checklist (for future reference)

When Phase 7 is opened as its own PR, this is the rough deletion list. Use it as the starting point for that PR's plan:

```
DELETE entirely:
  package/kedro_viz/api/data_provider.py
  package/tests/test_api/test_data_provider.py

DELETE from existing files:
  package/kedro_viz/api/rest/responses/save_responses.py
    - the `provider` parameter
    - the `_resolve_provider` helper
    - simplify each sub-helper to call the adapter directly
  package/kedro_viz/server.py
    - `_configure_inspection_adapter_provider` (replace with: always build the adapter)
    - the lite-mode short-circuit becomes the default path
  package/kedro_viz/api/rest/router.py
    - the `get_runtime_data_provider()` calls become direct adapter references
  package/tests/test_server.py
    - TestInspectionAdapterStartup class
    - TestLiteModeAdapter class (or simplify)

DELETE legacy backend (gated on Gate B — real-project parity sign-off):
  package/kedro_viz/data_access/managers.py
    - everything that builds the live graph (`add_pipelines`,
      `_add_graph_node`, `create_modular_pipelines_tree_*`,
      `get_nodes_for_registered_pipeline`, etc.)
  package/kedro_viz/data_access/repositories/modular_pipelines.py
    - almost everything (the adapter has its own modular pipelines module)
    - `_hash(str(node))` callsites (lines 205, 291)
  package/kedro_viz/api/rest/responses/pipelines.py
    - the body of `get_pipeline_response()` (the route calls the adapter directly)

KEEP from legacy (still needed for the metadata bridge in full mode):
  package/kedro_viz/models/flowchart/{nodes.py, node_metadata.py, edge.py, ...}
  package/kedro_viz/data_access/repositories/graph.py
  package/kedro_viz/data_access/repositories/catalog.py
  package/kedro_viz/data_access/repositories/registered_pipelines.py
  package/kedro_viz/data_access/repositories/tags.py
```

That's the complete picture: one ledger of what's added, what stays, what comes back out.
