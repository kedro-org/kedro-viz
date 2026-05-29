# Inspection Adapter — Implementation Progress

> Living log for the Kedro Inspection Adapter work (see `INSPECTION_ADAPTER_PLAN.md`).
> Updated at every phase boundary. Most recent entry on top of the Changelog.

**How this file is maintained:** when a phase (or a meaningful chunk of work) completes, add a
Changelog entry recording: what was done, decisions made, files added/updated/deleted, tests run,
and next steps. Keep the Status Dashboard and Decision Log in sync.

**Per-phase exit gate (run at the END of every phase, before starting the next):**
1. Update this file (changelog + dashboard + decision log).
2. **Anti-drift review** — re-read the plan's §1 Goal & Scope and issue #2265 direction; confirm we
   still target the same `GraphAPIResponse` contract, haven't crept in scope, and are building what we
   set out to. Note + correct any drift before continuing.
3. **Quality pass** — new code follows kedro/kedro-viz standards (type hints, Google docstrings,
   `logger`, ruff + mypy clean) and KISS/YAGNI/DRY/SOLID; run `make lint` and the **FULL** test suite
   (`pytest tests/`, not just the adapter tests — global-state leaks only show up suite-wide) in `viz-3-14`.
4. Only then start the next phase.

---

## Status Dashboard

| Phase | Description | Status |
| --- | --- | --- |
| Planning | Investigation + final plan | ✅ Complete (2026-05-22) |
| Phase -1 | Kedro asks & decisions (GATING) | ✅ Resolved (min-kedro pinned D5; node-id decided Viz-side D9 — no Kedro ask). Secondary asks (dataset_type, runtime-params) tracked |
| Phase 0 | Environment + parity harness | 🟡 In progress (baseline + id report captured; adapter-diff deferred to Phase 2) |
| Phase 1 | Adapter scaffolding | ✅ Complete (package + `snapshot_source` + `ids` seam + tests; later modules deferred to their phases) |
| Phase 2 | Main graph from snapshot | 🟡 Core done & parity-validated (task/data/param nodes, edges, tags, pipelines, data-node tags); node_extras deferred (P5) |
| Phase 3 | Modular-pipeline refactor | ✅ Complete (3a membership, 3b tree + modularPipeline nodes, 3c modular edges + cycle removal) — all parity-validated |
| Phase 4 | Layers | ✅ Complete (config-based layer extractor + per-node `layer` + sorted `layers` list) — parity-validated |
| Phase 5 | Node metadata split | ✅ Decided (D10): keep `/api/nodes` on the live path; snapshot-backed metadata deferred to Phase 6 (built with its lite-mode consumer) |
| Phase 6 | Switch runtime path (GATED) | ✅ **Backend complete** — 6.1 through 6.7 done (flag flipped to ON by default; `KEDRO_VIZ_INSPECTION_ADAPTER=0` opts back to legacy). Frontend jest-snapshot regeneration + lite-mode degradation UX remain as cross-team follow-ups |
| Phase 7 | Remove old code (GATED) | ⬜ Not started |

Legend: ⬜ Not started · 🟡 In progress · ✅ Complete · ⛔ Blocked

**Gates:** Gate A (before Phase 6) — node-id decision + min-kedro pin. Gate B (before Phase 7) —
full parity on real projects + raised kedro floor.

---

## Decision Log

| # | Date | Decision | Rationale |
| --- | --- | --- | --- |
| D1 | 2026-05-22 | Source = local Python API `get_project_snapshot()` only; no remote/REST snapshot | HTTP `/snapshot` endpoint reverted in kedro#5570 (2026-05-20) |
| D2 | 2026-05-22 | Node-id strategy is a GATING prerequisite (Phase -1), not a Phase-0 discovery | Reconstruction proven impossible for `name != func.__name__` nodes |
| D3 | 2026-05-22 | All id generation isolated in one module (`ids.py`) | So the Phase -1 outcome changes exactly one place; Phases 0–5 can proceed in parallel |
| D4 | 2026-05-22 | Use conda env **`viz-3-14`** for ALL development & testing | User directive. Python 3.14.4, kedro 1.4.0 (ships `kedro.inspection`), kedro-viz reinstalled editable from THIS repo (`pip install -e package/ --no-deps`) so imports resolve here, not the kedro-viz-5 checkout |
| D5 | 2026-05-22 | **Minimum kedro for the adapter path = 1.4.0** | RELEASE.md lists "Added inspection API to get project snapshot" under `# Release 1.4.0` (released 2026-05-22); 1.1.1/1.2.0/1.3.x predate it. Adapter is version-gated to `kedro>=1.4.0`; below that, the live path is used |
| D6 | 2026-05-22 | Adapter lives at **`package/kedro_viz/integrations/kedro/inspection/`** (subpackage) | User directive to place it under `integrations/kedro`; grouped as a subpackage like `integrations/deployment/`. Supersedes the earlier `adapters/inspection/` path |
| D7 | 2026-05-22 | **Per-phase exit gate** (anti-drift review + kedro/kedro-viz quality + KISS/YAGNI/DRY/SOLID) | User directive: after each phase, review completed work against original requirements to avoid drift and keep code lean/clean. Codified in the plan's "Working Agreement" and this file's maintenance note |
| D8 | 2026-05-22 | Create adapter modules **per-phase**, not all upfront (YAGNI) | Avoids dead stub files. `snapshot_source`+`ids` in Phase 1; `graph_builder` in Phase 2; `modular_pipelines` in Phase 3; `layers` in Phase 4. Deviates from the plan's literal Phase-1 file list (which is "suggested components") |
| D9 | 2026-05-25 | **Node IDs generated Viz-side from identity fields (name + inputs/outputs, excluding tags); shipped as a breaking release** | Agreed with Kedro + Viz teams: node ID is a Viz concern, so no Kedro API change. New scheme works for all nodes (incl. `name!=func`), drops the func-name dependency. Resolves the Phase -1 node-id gate. Parity becomes **structural** (IDs deliberately new); run-status hook switches to the same scheme in lockstep at Phase 6 |
| D10 | 2026-05-25 | **Node metadata (`/api/nodes/{id}`) stays on the live path; defer snapshot-backed metadata to Phase 6** | The endpoint is mostly live-only (code, previews, parameter values, stats); the snapshot backs only a small subset (task io, dataset type/filepath, run_command) and has no consumer until a lite/snapshot-only mode exists. YAGNI: build the thin snapshot metadata together with that consumer in Phase 6, so the full-vs-lite contract is decided once |
| D15 | 2026-05-26 | **Experimental flag mechanism = env var `KEDRO_VIZ_INSPECTION_ADAPTER`** (truthy: `1`/`true`/`yes`/`on`) | Internal-only per D12; an env var keeps the flag off the user-facing CLI surface until 6.7 promotes it, and is trivial to flip in tests (`monkeypatch.setenv`). Promotable to a real CLI option later without breaking callers. The adapter provider is built once at startup (load-once) and reused per request |
| D16 | 2026-05-28 | **Flip the default: `KEDRO_VIZ_INSPECTION_ADAPTER` unset → adapter ON. `=0` opts back to the legacy graph path** (temporary safety net until Phase 7 removes the legacy code entirely) | Realises D12's intent: the experimental flag becomes the new default once parity is proven. Inverting the existing env var (rather than introducing a new opt-in name) means users who set it experimentally don't have to change anything; users who want today's behaviour get one clear knob (`=0`). The opt-out lives in `RELEASE.md` so it's discoverable, and disappears with the legacy path in Phase 7 |
| _ | _ | _(pending)_ Kedro ask outcome (func_name vs stable id vs id-break vs bridge) | — |

---

## Open Asks / Blockers

- **Kedro node-id ask:** ✅ **CLOSED (D9, 2026-05-25)** — teams agreed to do it Viz-side, no Kedro
  change. `INSPECTION_NODE_ID_ASK.md` is now historical. Gate A's blocking item is resolved.
- **Phase 6 lockstep task:** ✅ **CLOSED (Phase 6.3, 2026-05-26)** — `hash_node` and
  `create_dataset_event` now route through `kedro_viz.integrations.kedro.node_ids`; no run-status
  fixtures held literal hashes, so nothing required regeneration. Cross-endpoint test
  (`test_id_lockstep.py`) proves graph ID == hook ID for every demo task.
- **Min kedro version:** ✅ resolved — **1.4.0** (D5). kedro-viz floor is currently `kedro>=1.0.0`,
  so the adapter path must be gated to `kedro>=1.4.0` with a live-path fallback below that.
- **Secondary asks (non-blocking, to bundle later):** resolved `dataset_type` class string on
  `DatasetSnapshot`; a runtime-params/`extra_params` path through `get_project_snapshot`. Recorded
  here; drafts to follow if/when we decide to file them.

## Development Environment

All development and testing use the conda env **`viz-3-14`** (Decision D4):
`conda run -n viz-3-14 <cmd>` (or activate it). Python 3.14.4 · kedro 1.4.0 (has `kedro.inspection`) ·
kedro-viz installed editable from this repo (`package/`). The real `get_project_snapshot()` runs on
`demo-project` in this env with **no shims** — the earlier vendoring/shim workarounds are no longer needed.

---

## Artifacts Index

| File | Purpose |
| --- | --- |
| `INSPECTION_ADAPTER_PLAN.md` | The final implementation plan (source of truth) |
| `INSPECTION_NODE_ID_ASK.md` | Draft GitHub note: the node-id ask for Kedro inspection |
| `INSPECTION_ADAPTER_GITHUB_PROPOSAL.md` | The architecture proposal posted on issue #2265 |
| `progress.md` | This file — running implementation log |

---

## Changelog

### 2026-05-28 — Phase 6.7: flip the flag default — adapter is now the new default

**What was done**
- `package/kedro_viz/api/data_provider.py` — `is_inspection_adapter_enabled()` rewritten so that
  an **unset** ``KEDRO_VIZ_INSPECTION_ADAPTER`` reads as **on** (returns ``True``). Setting the
  variable to any falsy value (``0`` / ``false`` / ``no`` / ``off`` / ``""``) opts back into
  the legacy graph path. Docstring + env-var section comment updated to reflect the inverted
  semantics. No other code changed — the flip is one default value.
- `RELEASE.md` — new top-of-file `# Release {{ next-major }}` section calling out:
  - **Breaking changes:** node IDs changed, deep links stale, exported sites need re-export,
    run-status events from before the upgrade stop correlating (with the symptom we identified
    while testing — tasks gray, datasets fine).
  - **Major features and improvements:** snapshot-driven graph, genuine lite mode, one runtime
    surface. Linked to issue #2265.
  - **Opt-out:** `KEDRO_VIZ_INSPECTION_ADAPTER=0 kedro viz run` for one invocation; legacy path
    goes away in Phase 7.
  - **Known limitations:** runtime params auto-fallback (D14).
  - Minimum kedro version bumped to `kedro>=1.4.0` (the inspection API floor — D5).
- Test updates for the inverted default:
  - `test_api/test_data_provider.py`:
    - `test_is_inspection_adapter_enabled_default_off` → `test_is_inspection_adapter_enabled_default_on`
      (renamed + inverted assertion).
    - `test_get_runtime_data_provider_defaults_to_live` → renamed to
      `test_get_runtime_data_provider_defaults_to_live_when_no_adapter_installed` and
      docstring expanded — the fallback now reflects "no adapter built", not "flag off".
    - `test_get_runtime_data_provider_falls_back_when_flag_off_even_if_provider_installed` —
      now uses explicit `monkeypatch.setenv(..., "0")` instead of `delenv`, to express the
      opt-out path.
  - `test_server.py::TestInspectionAdapterStartup`:
    - `test_flag_off_does_not_install_adapter` — switched to explicit `=0`.
    - New `test_env_var_unset_installs_adapter_by_default` — covers the new default path.
  - `test_server.py::TestLiteModeAdapter::test_flag_off_plus_lite_still_loads_live` —
    switched to explicit `=0`.

**Scope deferred (cross-team work, per ticket 7)**

- Frontend jest snapshot regeneration. The new graph IDs will differ from the snapshots the
  frontend pins today; those snapshots need a coordinated update before a PR can land.
- Frontend degradation UX for lite mode (hide vs blank vs "unavailable"). 6.6 leaves the
  lite-mode payloads with live-only keys **absent** (not null); the frontend team chooses how
  to render absent keys.

Both items are flagged in `inspection-adapter-tickets/07-lite-mode-and-flip-default.md`.

**Decisions made**

- D16 (2026-05-28): flip the existing env var (default ON, ``=0`` to opt out) rather than
  introducing a new opt-in name; the opt-out is a temporary safety net until Phase 7.

**Files added** — none.

**Files updated**
- `package/kedro_viz/api/data_provider.py`
- `package/tests/test_api/test_data_provider.py`
- `package/tests/test_server.py`
- `RELEASE.md`
- `progress.md` (Status Dashboard, Decision Log D16, this Changelog entry)

**Files deleted** — none.

**Tests run**
- `ruff check` on every touched file — clean.
- `make lint` — `Success: no issues found in 77 source files`.
- Full suite in `viz-3-14`: **570 passed** (was 569 before the flip; net +1 test from
  `test_env_var_unset_installs_adapter_by_default`). No regressions.
- Caveat from this run: three CLI/Jupyter-launcher tests initially failed because a leftover
  `kedro viz run` process was squatting on port 4141 (the auto-bumped port mismatch threw
  three port-equality assertions). Killing that process fixed all three — confirmed by the
  green full-suite run above. **Not a 6.7 regression.**

**Anti-drift review**

- Goal met: the inspection adapter is now the default; an explicit opt-out exists. All seven
  Phase-6 hard gates were already green before this sub-step (extra_params auto-fallback,
  cross-endpoint ID consistency, `--pipeline` honoured, invalid-pipeline 404). The flip is
  the small switch we'd held back until everything around it was ready.
- Production impact (large): every `kedro viz run` now serves graph + node metadata from the
  adapter unless explicitly opted out.
- Test impact (small): the existing tests don't go through `load_and_populate_data`, so the
  adapter is never installed in test contexts, and `get_runtime_data_provider()` still falls
  back to ``LiveDataProvider`` for the routes those tests hit. No fixture regeneration was
  needed for the backend.
- No scope creep into Phase 7 (deleting the legacy path). The legacy code is dead at default
  but still runtime-reachable via the opt-out, which is intentional — kill it in Phase 7.
- KISS / DRY / SOLID: one default value flipped; no new abstractions, no new flags, no new
  configuration mechanism. The opt-out lives on the same env var name users may already know
  from the experimental period.

**Next steps**

- **Frontend coordination (out of band):** regenerate jest snapshots; agree on the
  lite-mode degradation UX. Until both land, downstream releases that bump kedro-viz will
  surface stale frontend fixtures.
- **Phase 7** — remove the legacy graph path entirely (`data_access_manager.add_pipelines`,
  `modular_pipelines.py:205,291` `_hash(str(node))` callsites, `LiveDataProvider`, the opt-out
  env var, etc.). Gated on the full parity matrix being green on real (non-demo) projects.

---

### 2026-05-27 — Phase 6.6: lite mode + snapshot-backed node metadata

**What was done**
- `package/kedro_viz/api/inspection_adapter_provider.py`:
  - New `self._snapshot = snapshot` and `self._snapshot_lookup` (built once at construction).
    The lookup walks every node and io-ref in the snapshot and records the thin metadata
    payload keyed by new-scheme id:
    - task → `{"inputs": [...], "outputs": [...]}`
    - data (catalog-registered) → `{"type": "pandas.CSVDataset", "filepath": "data/..."}`
    - data (in-memory, no catalog entry) → `{"type": "kedro.io.MemoryDataset"}`
    - parameter → `{"parameters": {}}`  (snapshot carries only names, not values)
  - `get_node_metadata_response(node_id)` is now two-stage: bridge first (full mode, byte-identical
    to 6.4), then snapshot lookup (lite mode), then 404. Extracted the live-mode wrapping into a
    `_live_metadata_response` helper to keep the entry point readable.
  - `get_node_ids()` returns bridge keys when populated, else snapshot lookup keys — so the export
    in lite mode still writes a file per snapshot-known node.
  - Empty-bridge `INFO` log line updated: no longer says "/api/nodes/{id} will 404", says
    "will return lite-mode payloads".
- `package/kedro_viz/server.py` — `load_and_populate_data` short-circuits when the experimental
  flag is ON **and** `is_lite=True` **and** `extra_params` is empty: it skips `load_data` and
  `populate_data` entirely and builds the adapter provider directly. The fall-through path (every
  other combination) is byte-identical to before, so today's `--lite` behaviour with the flag OFF
  is unchanged. `--params` always forces the live path (D14).
- Shape decisions for lite payloads:
  - The payload keys match the live `*APIResponse` schemas, but **live-only keys are absent
    (not null)** so the frontend can treat "key present = value available, key absent =
    unavailable" uniformly. This is the contract we'll surface to the frontend team during the
    UX coordination.
  - `is_dataset_param` (the existing `kedro_viz.utils` helper) classifies io-refs as parameter
    vs. data — reused so the criterion stays in one place.
  - Transcoded variants collapse to one entry via `_strip_transcoding` (same canonicalisation
    `dataset_node_id` performs); first-seen wins.

**Test additions**

- `package/tests/test_inspection_adapter/test_lite_metadata.py` (new, 8 tests):
  - Hermetic snapshot-lookup checks: bridge is empty when no live nodes are injected; task
    payloads carry only `inputs`/`outputs` (no live-only keys); data payload carries
    `type` + `filepath`; parameter refs resolve to `{"parameters": {}}`; `get_node_ids` falls
    back to snapshot-lookup keys when the bridge is empty; the JSON body returned for a task
    contains *only* `inputs` and `outputs`.
  - End-to-end via `TestClient`: every task/data/parameters id from `/api/main` resolves under
    `/api/nodes/{id}` with HTTP 200; unknown ids still 404.
- `package/tests/test_server.py` — new `TestLiteModeAdapter` class, 3 tests:
  - Flag ON + `--lite`: neither `kedro_data_loader.load_data` nor `populate_data` is called;
    the adapter provider is constructed; an INFO log line announces "skipping the live project
    load".
  - Flag OFF + `--lite`: today's `--lite` behaviour is preserved (`load_data` is still called).
  - Flag ON + `--lite` + `--params`: live load still runs (D14 overrides lite short-circuit).

**Decisions made** — none new; this realises D13 ("lite mode = snapshot graph + degraded
snapshot metadata, live-only fields null/absent consistently") and uses the existing `--lite`
CLI flag as the trigger.

**Files added**
- `package/tests/test_inspection_adapter/test_lite_metadata.py`.

**Files updated**
- `package/kedro_viz/api/inspection_adapter_provider.py` (snapshot lookup + lite metadata path
  + extracted live-response helper + updated empty-bridge log).
- `package/kedro_viz/server.py` (`load_and_populate_data` short-circuit for flag ON + `--lite`).
- `package/tests/test_server.py` (`TestLiteModeAdapter`).
- `progress.md` (Status Dashboard, Changelog).

**Files deleted** — none.

**Tests run**
- `ruff check` on every touched file — clean (one auto-fix for import sort).
- `make lint` — `Success: no issues found in 77 source files` (+1 over 6.5).
- Full suite in `viz-3-14`: **569 passed** (was 558; +11 net new tests). No regressions; no new
  warnings.

**Anti-drift review**
- Goal met: in adapter-mode lite (no live project loaded), `/api/main` and `/api/nodes/{id}`
  both serve coherent payloads from the snapshot alone; the static export still produces a
  complete file set (each `nodes/{id}` carries the thin payload).
- Flag OFF: completely untouched. Today's `kedro viz run --lite` still runs the partial live
  load (`is_lite=True` flows into `kedro_data_loader.load_data` as before).
- Adapter mode full (flag ON, no `--lite`): completely untouched. The bridge is populated and
  the live-mode response branch is taken (extracted into `_live_metadata_response`, same
  pydantic models, same payload).
- Frontend coordination: the lite payload **omits** live-only keys (it doesn't return them as
  `null`). The frontend team's job is to render absent keys as "unavailable" or hide them. This
  contract is now testable from the backend side; the visual UX still needs to be settled with
  the frontend team — flagged in ticket 7's docs.
- Minor scope expansion (defensible): for the lite metadata payload to be reachable, the
  provider also had to expose snapshot-lookup keys via `get_node_ids()` when the bridge is
  empty — otherwise the lite-mode export would silently drop node files. This is purely a
  consequence of 6.6's stated goal, not new scope.
- No scope creep into 6.7 (flag flip).
- KISS / DRY / SOLID: the lite payload builder is one short method (`_record_io_lite_metadata`);
  the parameter classifier reuses the existing `is_dataset_param`; the transcoding strip reuses
  the existing `_strip_transcoding`. Two parallel lookups (`_metadata_bridge` and
  `_snapshot_lookup`) but each has a single clear responsibility.

**Next steps**
- Phase 6.7 — flip the experimental flag to ON by default, regenerate every ID-bearing fixture
  (backend pytest + frontend jest snapshots), and ship the release notes calling out the
  breaking ID change, the deep-link impact, and the re-export step for already-deployed sites.
  Gate: full suite green after fixture regeneration; cross-endpoint ID-consistency test green.
  This is the **breaking release**.

---

### 2026-05-27 — Phase 6.5: static export goes through the provider

**What was done**
- `package/kedro_viz/api/data_provider.py`: extended the `RuntimeDataProvider` protocol with
  `get_pipeline_ids() -> list[str]` and `get_node_ids() -> list[str]`. These are the two read
  surfaces the static-export path needed beyond what 6.2a already covered. `LiveDataProvider`
  implements them by reading the same `data_access_manager.registered_pipelines` and
  `data_access_manager.nodes` repositories the export used to touch directly. Its
  `save_api_responses_to_fs` now passes `self` so the export uses its own surface.
- `package/kedro_viz/api/inspection_adapter_provider.py`: implements the two new methods.
  `get_pipeline_ids()` defers to a new public `GraphBuilder.pipeline_ids()` helper (preserves
  declaration order; honours `--pipeline` scope). `get_node_ids()` is the keys of the metadata
  bridge — i.e. every metadata-bearing live viz node visible to the adapter. The provider's
  `save_api_responses_to_fs` likewise passes `self`.
- `package/kedro_viz/api/rest/responses/save_responses.py`: rewritten to use a
  `RuntimeDataProvider` for **every read** — no more direct `data_access_manager` access, no more
  imports of the response helpers from `pipelines.py`/`nodes.py`/`run_events.py`. Every sub-helper
  (`save_api_main_response_to_fs`, `save_api_pipeline_response_to_fs`,
  `save_api_node_response_to_fs`, `save_api_run_status_response_to_fs`) now takes a `provider`
  argument and calls `provider.get_*` instead of the free response functions. The umbrella
  `save_api_responses_to_fs` resolves the active provider via a small `_resolve_provider`
  helper (lazy-imports `get_runtime_data_provider` to break the circular `save_responses` ⇄
  `data_provider` dependency) when callers don't pass one explicitly.
- `package/kedro_viz/integrations/kedro/inspection/graph_builder.py`: small public helper
  `pipeline_ids()` returning `list(self._pipelines)` so the provider can expose registered
  pipeline IDs without poking at the internal field.
- Backward compatible at every existing call site: `server.py:174` and
  `base_deployer.py:38` still call `save_api_responses_to_fs(path, fs, previews)` with three
  positional args; the new `provider` argument defaults to `None`, in which case the function
  resolves the active provider via `get_runtime_data_provider()`. So in live mode (flag OFF) the
  export still walks the same `data_access_manager` repositories — byte-identical to before.

**Test additions**
- `package/tests/test_inspection_adapter/test_export.py` (new, 4 tests) — populates the live
  `data_access_manager` from the demo project, builds the adapter provider, exports the API
  file set into `tmp_path`, and asserts:
  1. `api/main` exists; one `api/pipelines/{id}` file per registered pipeline.
  2. Every metadata-bearing id (task / data / parameters) from `api/main` has a matching
     `api/nodes/{id}` file.
  3. `api/run-status` is written.
  4. The exported `api/main` carries the same IDs as a live call to the provider — proving the
     exported file set uses adapter (new-scheme) IDs end-to-end.
- `package/tests/test_api/test_rest/test_responses/test_save_responses.py` — rewritten. The
  existing tests heavily patched module-level names (`get_pipeline_response`,
  `data_access_manager.registered_pipelines.get_pipeline_ids`, …). Those reads now go through
  the provider; the test file now passes a small `Mock`-based stub provider and asserts that the
  provider's methods are called with the right arguments. Coverage of the sub-functions and the
  umbrella stays the same, plus a new test confirms `save_api_responses_to_fs` falls back to
  `get_runtime_data_provider()` when no provider is passed.
- `package/tests/test_api/test_data_provider.py` — the 6.2a delegate test was asserting the old
  `(path, fs, previews)` call; renamed to `test_save_api_responses_to_fs_passes_self_as_provider`
  and updated to assert the new `(path, fs, previews, provider=self)` shape.

**Decisions made** — none new; this realises D11's "static export uses the same surface".

**Files added**
- `package/tests/test_inspection_adapter/test_export.py`.

**Files updated**
- `package/kedro_viz/api/data_provider.py` (Protocol + Live implementations of the two new
  read methods; live `save_api_responses_to_fs` passes `self`).
- `package/kedro_viz/api/inspection_adapter_provider.py` (two new read methods; export passes
  `self`; updated module + class docstrings).
- `package/kedro_viz/api/rest/responses/save_responses.py` (provider-driven reads end-to-end).
- `package/kedro_viz/integrations/kedro/inspection/graph_builder.py` (`pipeline_ids()` helper).
- `package/tests/test_api/test_rest/test_responses/test_save_responses.py` (rewritten).
- `package/tests/test_api/test_data_provider.py` (the 6.2a delegate test).
- `progress.md` (Status Dashboard, Changelog).

**Files deleted** — none.

**Tests run**
- `ruff check` on every touched file — clean.
- `make lint` — `Success: no issues found in 76 source files` (+1 over 6.4).
- Full suite in `viz-3-14`: **558 passed** (was 553; +5 net new tests after the test rewrite
  consolidation). No regressions; no new warnings.

**Anti-drift review**
- Goal met: under adapter mode, the exported file set walks the snapshot+bridge, so the IDs in
  every exported file are the new-scheme IDs the live adapter graph emits. The new end-to-end
  test asserts equality between the live `get_pipeline_response().nodes[*].id` set and the
  exported `api/main` `nodes[*].id` set.
- Live mode (flag OFF) is byte-identical: `LiveDataProvider.get_pipeline_ids` /
  `get_node_ids` reach into the same repositories the old code did, the response builders are
  the same module-level functions, and `save_api_responses_to_fs(path, fs, previews)` with the
  default `provider=None` still ends up calling the same code paths.
- Minor deviation: live-mode export writes empty `{}` files at `api/nodes/{modular_pipeline_id}`
  for every modular pipeline node (the live `nodes` repo includes them, and
  `get_node_metadata_response` returns `{}` because `kedro_obj is None`). Adapter mode skips
  them because the bridge skips them (`_new_id_for` returns `None` for `ModularPipelineNode`).
  This is a smaller exported file set, not a different one — every file the frontend actually
  needs is still present. Documented in `test_export.py` and the bridge helper.
- No scope creep: lite mode metadata (6.6) and the flag-flip (6.7) are deliberately untouched.
- KISS / DRY / SOLID: one export implementation; two providers feed it; the
  `save_responses` ↔ `data_provider` circular import is broken with a single localised lazy
  import in `_resolve_provider` (the rationale is captured in a one-line docstring).

**Next steps**
- Phase 6.6 — lite mode + the deferred D10 metadata. When no project is loaded, the bridge is
  empty, so `/api/nodes/{id}` 404s and the export skips node files. 6.6 builds a thin
  snapshot-backed metadata path so lite-mode users get a degraded-but-coherent detail panel.
  The frontend degradation UX (hide vs blank vs "unavailable") needs to be settled with the
  frontend team during this ticket.

---

### 2026-05-27 — Phase 6.4: node-metadata bridge — `/api/nodes/{id}` resolves for adapter IDs

**What was done**
- `package/kedro_viz/api/inspection_adapter_provider.py`:
  - New private map: `self._metadata_bridge: dict[new_id, GraphNode]`, built once at construction
    via `_build_metadata_bridge(live_nodes)`. Reads from the populated module-singleton
    `data_access_manager.nodes` by default; tests inject a fresh `GraphNodesRepository` through a
    keyword-only `live_nodes=` constructor arg, so no monkeypatching is required.
  - `_new_id_for(viz_node)` computes the new-scheme ID per viz-model type:
    `TaskNode → node_ids.task_node_id(kedro_obj.name, inputs, outputs)`;
    `DataNode / TranscodedDataNode / ParametersNode → node_ids.dataset_node_id(name)`;
    anything else (e.g. `ModularPipelineNode`) is skipped because it is not metadata-addressable.
  - `get_node_metadata_response(node_id)` now does the bridge lookup and wraps the result in the
    same pydantic domain models the live response builder uses (`TaskNodeMetadata`,
    `DataNodeMetadata`, `TranscodedDataNodeMetadata`, `ParametersNodeMetadata`). Unknown ID
    returns 404; node with no metadata returns `{}` — both match the live behaviour.
- `package/kedro_viz/api/rest/router.py`: `/api/nodes/{node_id}` is now
  `get_runtime_data_provider().get_node_metadata_response(node_id)` instead of calling the live
  helper directly. Flag-OFF still routes through `LiveDataProvider`, which delegates to the same
  live helper as before — byte-identical for live mode.
- Empty-bridge case (lite mode, deferred to 6.6) logs a clear `INFO` line so a 404 from
  `/api/nodes/{id}` doesn't look like a bug.
- Transcoded variants collapse to a single bridge entry (the first one wins, deterministic via
  `as_list` insertion order); both the dataset-name strip in `_strip_transcoding` and
  `dataset_node_id` agree on the canonical ID. Documented in the helper.

**Test additions** — `package/tests/test_inspection_adapter/test_metadata_bridge.py`, 9 tests:

- *Hermetic (6 tests)* — feeds a synthetic `GraphNodesRepository` with each viz-model type
  (`TaskNode`, `DataNode`, `ParametersNode`, two `TranscodedDataNode` variants) and asserts the
  bridge maps the right new-scheme IDs to the right live nodes. Includes the transcoded-collapse
  case (first variant wins) and the empty-bridge case. Plus a 404 test for unknown IDs.
- *End-to-end (3 tests)* — populates the live `data_access_manager` from the demo project, builds
  the adapter provider (so the bridge picks up the populated repo), and via FastAPI's `TestClient`
  asserts that `/api/main`'s task IDs resolve under `/api/nodes/{id}` with live content (`inputs`
  and `outputs` populated), data IDs resolve with 200, and unknown IDs return 404. The
  `_populated_demo` fixture cleans up by reinitialising the `DataAccessManager` singleton so other
  test modules don't see this state.

**Decisions made** — none new; this realises D11 + D13's "full mode = snapshot graph + live
metadata via bridge".

**Files added**
- `package/tests/test_inspection_adapter/test_metadata_bridge.py`.

**Files updated**
- `package/kedro_viz/api/inspection_adapter_provider.py`
- `package/kedro_viz/api/rest/router.py`
- `progress.md` (Status Dashboard, Changelog)

**Files deleted** — none.

**Tests run**
- `ruff check` on every touched file — clean.
- `make lint` — `Success: no issues found in 75 source files` (+1 over 6.3; the new test file
  type-checks clean too). Two narrow `cast` calls in the provider handle: the metadata branches
  returning domain models (FastAPI serialises them against `response_model=NodeMetadataAPIResponse`
  at the route — same trick the live untyped helper relies on); and the `TaskNode.kedro_obj` field
  whose declared union type widens at the `GraphNode` base.
- Full suite in `viz-3-14`: **553 passed** (+9 over 6.3's 544). No regressions, no new warnings.

**Anti-drift review**
- Goal met: `/api/nodes/{id}` resolves for new-scheme adapter IDs, and the content returned is
  byte-identical to what the live path returns (same `TaskNodeMetadata` / `DataNodeMetadata` /
  ... model instances).
- Flag-OFF (live mode) is unchanged: `LiveDataProvider.get_node_metadata_response` still calls the
  same live helper directly, and the live helper still reads `data_access_manager.nodes` by
  old-scheme ID. All existing route tests pass without modification.
- No scope creep: `/api/run-status` (already aligned at 6.3 via `hash_node`), `save_responses`
  (6.5), lite-mode metadata (6.6), and the flag flip (6.7) are deliberately untouched.
- KISS / DRY / SOLID: the bridge is one dict; the metadata-wrapping branches mirror the live
  helper exactly (same isinstance ladder, same model classes); no new abstractions.

**Next steps**
- Phase 6.5 — static export through the provider. `save_api_responses_to_fs` will be routed
  through `RuntimeDataProvider.save_api_responses_to_fs`, so the exported API file set in adapter
  mode comes from the snapshot+bridge instead of `data_access_manager` directly. Gate: exported
  file set parity between flag-OFF and flag-ON modes.

---

### 2026-05-26 — Phase 6.3: run-status hook lockstep (graph ID == hook ID)

**What was done**
- `package/kedro_viz/integrations/kedro/hooks_utils.py`: `hash_node` rewritten to call the shared
  `node_ids.task_node_id(name, inputs, outputs)` for `KedroNode` and `node_ids.dataset_node_id(name)`
  for everything else. The two stale imports from `kedro_viz.utils` (`_hash`, `_hash_input_output`)
  are gone; the only ID-generation dependency is now `node_ids`, which is the single source of
  truth per D3/D9.
- `package/kedro_viz/integrations/kedro/run_hooks.py`: `create_dataset_event` switched from
  `_hash_input_output(dataset_name)` to `node_ids.dataset_node_id(dataset_name)`. Closes the last
  ID-generation site outside the shared module; the leftover re-export crutch in `hooks_utils.py`
  is no longer needed.
- New test file `package/tests/test_inspection_adapter/test_id_lockstep.py`. Two layers:
  - **Hermetic** — synthetic `kedro.pipeline.node(...)` instance: `hash_node(node)` equals
    `node_ids.task_node_id(name, inputs, outputs)`; `hash_node("companies")` equals
    `node_ids.dataset_node_id("companies")`; re-tagging the same node doesn't change the ID.
  - **End-to-end on `demo-project`** — hit `/api/main` through the adapter, then for every task
    in the response, find the matching live `KedroNode` and assert `hash_node(live_node)` equals
    the response's `id`. **This is the gate from the plan** — proven across all 21 demo task nodes.
- Empirical pre-check (probe script): for the demo project, `list(live_node.inputs)` /
  `list(live_node.outputs)` are byte-identical to `NodeSnapshot.inputs` / `.outputs` for every node.
  So the lockstep at the hash level holds without any normalisation.
- Documentation sweep for the old `_hash(str(node))` references:
  - `package/tests/test_inspection_adapter/capture_baseline.py:74` now computes `graph_id` via
    `node_ids.task_node_id(...)` instead of `_hash(str(node))`, so a re-run produces consistent
    data under the new scheme.
  - `package/tests/test_inspection_adapter/README.md` updated to say "both come from the shared
    `node_ids` scheme" (was "both are `_hash(str(node))`").
  - `package/kedro_viz/api/inspection_adapter_provider.py`: docstring + `get_run_status_response`
    comment updated to reflect that the hook switch in 6.3 already aligns run-status IDs with
    adapter graph IDs (no longer "deferred").
  - `progress.md`: Status Dashboard row updated; "Phase 6 lockstep task" entry in Open Asks
    closed and explained.
- Verified no run-status fixtures held literal hash values: `test_run_events.py` uses string
  literals like `"load_customers_node"` (test sentinels, not real hashes); `test_run_hooks.py` /
  `test_hooks.py` don't assert on `node_id` literals. So no fixture regeneration was needed.

**Decisions made** — none new; this realises D9 + D3.

**Files added**
- `package/tests/test_inspection_adapter/test_id_lockstep.py`.

**Files updated**
- `package/kedro_viz/integrations/kedro/hooks_utils.py`
- `package/kedro_viz/integrations/kedro/run_hooks.py`
- `package/kedro_viz/api/inspection_adapter_provider.py`
- `package/tests/test_inspection_adapter/capture_baseline.py`
- `package/tests/test_inspection_adapter/README.md`
- `progress.md` (Status Dashboard, Open Asks, Changelog)

**Files deleted** — none.

**Tests run**
- `ruff check` on every touched file — clean.
- `make lint` — `Success: no issues found in 74 source files` (+1 over 6.2b; one more file now
  type-checks clean).
- Full suite in `viz-3-14`: **544 passed** (was 540; +4 new lockstep tests). No regressions.

**Anti-drift review**
- Goal met: the run-status hook now emits the exact IDs the adapter graph emits. The cross-endpoint
  test proves it against the demo project end-to-end.
- Live mode (flag OFF) graph still uses `_hash(str(node))` in
  `data_access/repositories/modular_pipelines.py:205,291` — that's the deprecated path, removed
  in Phase 7. The accepted consequence: in live mode, after 6.3, `kedro run` events for
  `name != func` nodes (demo: `company_agg`, `combine_step`) won't correlate with the live graph's
  IDs. Plan and D9 accept this cost; the cure is flipping the default to adapter mode (6.7).
- No scope creep into 6.4 (metadata bridge), 6.5 (export through provider), 6.6 (lite mode), or
  6.7 (flip default).
- KISS / DRY / SOLID: `hash_node` is three lines + docstring; ID generation now has a single source
  of truth (`node_ids`); `hooks_utils` no longer depends on `kedro_viz.utils` for hashing.

**Next steps**
- Phase 6.4 — node-metadata bridge (full mode). In `InspectionAdapterProvider`, build a
  `{new_id → live KedroNode / AbstractDataset}` map at construction time; route
  `/api/nodes/{id}` through this provider; for the looked-up live object, return today's live
  metadata content. Gate: `/api/nodes/{id}` resolves for adapter IDs and matches live content.

---

### 2026-05-26 — Phase 6.2b: experimental flag + `InspectionAdapterProvider` wiring graph routes

**What was done**
- New: `package/kedro_viz/api/inspection_adapter_provider.py` — `InspectionAdapterProvider` that
  loads the inspection snapshot + layer mapping **once** at construction, builds a `GraphBuilder`,
  and implements the `RuntimeDataProvider` graph surface:
  - `get_pipeline_response(pipeline_id)` — defaults via `GraphBuilder.default_pipeline_id`; returns
    a 404 `JSONResponse` for unknown pipeline IDs (preserves the live path's behaviour).
  - `pipeline_name=` constructor arg implements `kedro viz run --pipeline X` by filtering the
    snapshot's `pipelines` list at startup via `dataclasses.replace` (so only that one pipeline is
    visible; the `pipelines` field in responses also lists only that one — mirrors live).
  - `get_node_metadata_response` / `get_run_status_response` / `save_api_responses_to_fs` delegate
    to the live path for now (those move onto the provider in 6.3 / 6.4 / 6.5 respectively).
- Extended `package/kedro_viz/api/data_provider.py`:
  - `INSPECTION_ADAPTER_ENV_VAR = "KEDRO_VIZ_INSPECTION_ADAPTER"` (truthy: `1`/`true`/`yes`/`on`).
  - `is_inspection_adapter_enabled()` — per-request env-var read (tests can `monkeypatch.setenv`).
  - `_AdapterProviderHolder` + `_adapter_holder` singleton — avoids module-level reassignment
    (`global`/`PLW0603`); mirrors the `data_access_manager` pattern.
  - `set_inspection_adapter_provider(...)` and `get_runtime_data_provider()` — the install hook
    used by startup and the per-request factory used by the routes. Falls back to `LiveDataProvider`
    whenever the flag is OFF or no adapter is installed.
- Added `has_pipeline(pipeline_id)` on `GraphBuilder` so the provider can do membership checks
  without poking at `_pipelines`.
- `package/kedro_viz/server.py`: new private `_configure_inspection_adapter_provider(...)` called
  at the end of `load_and_populate_data`. When the flag is OFF it clears any installed adapter;
  when ON with `extra_params` non-empty it logs and falls back (D14); when ON it constructs the
  adapter and installs it. Any construction failure is logged and the live path is used.
- `package/kedro_viz/api/rest/router.py`: `/api/main` and `/api/pipelines/{registered_pipeline_id}`
  now call `get_runtime_data_provider().get_pipeline_response(...)` instead of the live function
  directly. `/api/nodes/{id}` and `/api/run-status` are intentionally left on their existing
  direct calls — they move onto the provider in 6.3 / 6.4.

**Decisions made**
- D15 (2026-05-26): experimental flag is exposed as the env var `KEDRO_VIZ_INSPECTION_ADAPTER`;
  adapter provider loads the snapshot **once at construction** and reuses it per request.

**Files added**
- `package/kedro_viz/api/inspection_adapter_provider.py`
- `package/tests/test_inspection_adapter/test_inspection_adapter_provider.py` — direct unit tests
  on the provider against the demo project (default behaviour, named pipeline, 404 branch, the
  `--pipeline` filter + its ValueError for unknown names).
- `package/tests/test_inspection_adapter/test_router_flag_on.py` — end-to-end via FastAPI
  `TestClient`: `/api/main`, `/api/pipelines/{id}`, the 404 branch, and the `--pipeline` scope
  test, all under flag-ON with the adapter installed.

**Files updated**
- `package/kedro_viz/api/data_provider.py` (env-var flag + adapter holder + factory).
- `package/kedro_viz/api/rest/router.py` (graph routes go through the provider).
- `package/kedro_viz/server.py` (`_configure_inspection_adapter_provider` at startup).
- `package/kedro_viz/integrations/kedro/inspection/graph_builder.py` (new `has_pipeline`).
- `package/tests/test_api/test_data_provider.py` (flag + factory tests — parametrized truthy
  values, default OFF, install/clear cycle, flag gates use even when an adapter is installed).
- `package/tests/test_server.py` (`TestInspectionAdapterStartup` — flag OFF / flag ON + extras /
  flag ON + success / flag ON + ctor raises).
- `progress.md`, this changelog + Status Dashboard row + Decision Log D15.

**Files deleted** — none.

**Tests run**
- `ruff check` clean on every touched file.
- New targeted run (`test_data_provider` + `test_inspection_adapter_provider` + `test_router_flag_on`
  + `TestInspectionAdapterStartup`): **36 passed**.
- Full suite in `viz-3-14`: **540 passed** (was 504 at the end of 6.2a — 36 net new tests), no
  regressions, 7 pre-existing warnings unchanged.

**Anti-drift review**
- `GraphAPIResponse` contract is unchanged; the adapter returns the same Pydantic model the
  frontend already consumes.
- Flag-OFF behaviour is byte-identical: every existing test still passes; routes go through
  `LiveDataProvider`, which delegates to the existing `get_pipeline_response`.
- No scope creep: `/api/nodes/{id}`, `/api/run-status`, and `save_responses` are deliberately
  untouched in 6.2b and remain on the live path until their respective sub-steps.
- KISS: one env-var flag, one provider class, one holder. No new abstractions beyond what was
  approved in D11.

**Next steps**
- Phase 6.3 — run-status hook lockstep: change `integrations/kedro/hooks_utils.hash_node` to use
  `node_ids.task_node_id` / `dataset_node_id`, regenerate run-status fixtures, and add a
  cross-endpoint test asserting `/api/main` graph IDs equal their run-status hook IDs (ticket 6 in
  the sub-tickets folder).

---

### 2026-05-26 — Phase 6.2a: `RuntimeDataProvider` interface + `LiveDataProvider`
**What was done**
- Added `package/kedro_viz/api/data_provider.py` with:
  - `RuntimeDataProvider` (`@runtime_checkable` `Protocol`) — the single seam every read endpoint and
    the static-export path will share.
  - `LiveDataProvider` — concrete impl that **delegates byte-identically** to today's response
    builders (`get_pipeline_response`, `get_node_metadata_response`, `get_run_status_response`,
    `save_api_responses_to_fs`).
- Tests in `package/tests/test_api/test_data_provider.py`: protocol satisfaction + delegation for
  each method (hermetic, mock-based).
- No routes wired through it yet, no flag exists yet — behaviour unchanged.

**Anti-drift review:** pure scaffolding; `LiveDataProvider` mirrors the existing functions; provider
surface aligned with D11 (omitting `get_pipeline_ids`/`get_node_ids` because they turned out to be
internal helpers of `save_responses`, not top-level read surface — KISS; revisit in 6.5 if needed).

**Quality pass:** ruff + mypy clean; **full suite: 509 passed** in `viz-3-14` (504 prior + 5 new).

**Files added**
- `package/kedro_viz/api/data_provider.py`
- `package/tests/test_api/test_data_provider.py`

**Files updated**
- `progress.md` (dashboard, this entry).

**Files deleted**
- None.

**Tests run**
- Full suite (`pytest tests/`) → 509 passed in `viz-3-14`.

**Next steps**
- 6.2b: introduce the experimental flag (default OFF), and route `/api/main`, `/api/pipelines`,
  `/api/pipelines/{id}` through the provider. When OFF → `LiveDataProvider` (byte-identical to today);
  when ON → `InspectionAdapterProvider` (new). Parity test asserts flag-OFF unchanged; flag-ON
  structural parity vs Phase 0 baseline. `--pipeline` honoured + invalid-pipeline 404 preserved.

### 2026-05-26 — Phase 6 plan refined + 6.1: shared `node_ids` module
**What was done**
- Folded the approved Phase 6 sub-plan into `INSPECTION_ADAPTER_PLAN.md` §Phase 6, with decisions
  **D11** (Option Y via a `RuntimeDataProvider` abstraction — no scattered route conditionals),
  **D12** (experimental flag, default OFF; promoted only after 6.3+6.4 land), **D13** (full = snapshot
  graph + bridged live metadata; lite = snapshot graph + degraded metadata), **D14**
  (`extra_params` → auto-fallback to live, documented), and sub-steps 6.1 → 6.7 with explicit gates.
- **6.1 executed:** moved `task_node_id` / `dataset_node_id` to
  `package/kedro_viz/integrations/kedro/node_ids.py` (neutral location both the adapter and the
  run-status hook can import from in 6.3). Updated all imports in
  `inspection/{__init__,graph_builder,modular_pipelines}.py` and `tests/test_inspection_adapter/test_ids.py`;
  deleted `inspection/ids.py`. Pure relocation; the inspection package still re-exports the two
  functions for its public API.

**Anti-drift review:** behaviour unchanged (the test asserting the adapter ID matches `_hash` of the
JSON signature still passes); no runtime path touched; `ids.py` deletion removes the duplicate path.

**Quality pass:** ruff + mypy clean; **full suite 504 passed** in `viz-3-14` (unchanged from before).

**Files added**
- `package/kedro_viz/integrations/kedro/node_ids.py`

**Files updated**
- `INSPECTION_ADAPTER_PLAN.md` (Phase 6 detailed sub-plan with D11–D14).
- `inspection/__init__.py`, `inspection/graph_builder.py`, `inspection/modular_pipelines.py`
  (imports point at `node_ids`; usages renamed `ids.` → `node_ids.`).
- `tests/test_inspection_adapter/test_ids.py` (import via `as ids` alias to keep test body unchanged).
- `progress.md` (dashboard, this entry).

**Files deleted**
- `package/kedro_viz/integrations/kedro/inspection/ids.py`

**Tests run**
- Full suite (`pytest tests/`) → 504 passed in `viz-3-14`.

**Next steps**
- 6.2a: build the `RuntimeDataProvider` interface + `LiveDataProvider` (wraps today's
  `data_access_manager` reads byte-identically). No flag yet, no routes wired yet.

### 2026-05-25 — Phase 5: decision — keep node metadata live (no code)
**What was done**
- Reviewed the `/api/nodes/{id}` metadata surface and confirmed it is **mostly live-only**: snapshot
  backs only task `inputs`/`outputs`, dataset `type`/`filepath`, and `run_command`; the rest (`code`,
  `preview`/`preview_type`, parameter values, `stats`) needs the live project.
- **Decision (D10):** keep node metadata on the existing live path for now; **defer** the
  snapshot-backed metadata builder to **Phase 6**, where it's built alongside its actual consumer
  (the lite/snapshot-only mode) and the full-vs-lite contract is decided once. No speculative code now.
- The frontend degradation UX (hide vs blank vs "unavailable" for live-only fields in lite mode) is a
  separate decision to make when lite mode is wired.

**Anti-drift review:** consistent with the plan (metadata stays Viz/live-side); no scope creep; no
runtime change. No code added, so no new tests — the suite remains at **504 passed**.

**Files updated**
- `INSPECTION_ADAPTER_PLAN.md` (Phase 5 marked decided/deferred), `progress.md` (dashboard, D10, this entry).

**Next steps**
- Phase 6 (the big one): wire `load_and_populate_data()` to build the main graph from the adapter
  (gated — see Gate A). This is the breaking release: new node IDs go live, run-status hook switches
  to the same scheme in lockstep, fixtures regenerate, and lite-mode node metadata is built here.

### 2026-05-25 — Fix: test isolation (global Kedro state leak) — full suite green
**What was done**
- Found (via review) that `load_snapshot`/`load_catalog_config` call `bootstrap_project`, mutating
  process-global Kedro state (`PACKAGE_NAME`, `pipelines`/`settings` singletons, `sys.path`). It leaked
  into later tests — e.g. CLI `test_run.py`/`test_jupyter.py` then saw `package_name='demo_project'`
  instead of `None`. Reproduced: an inspection test before `test_run.py` caused **8 failures**.
- Fix (tests only, no production change): added `tests/test_inspection_adapter/conftest.py` with a
  module-scoped autouse fixture that snapshots and restores that global state; made the `builder`
  fixture depend on it so the snapshot is taken before the demo project is bootstrapped.
- **Process fix:** the per-phase gate now mandates running the **FULL** suite (not just the adapter
  tests) — this leak was invisible when running `tests/test_inspection_adapter/` in isolation.

**Result:** reproduction now passes (16/16); **full suite: 504 passed** (exit 0) in `viz-3-14`;
ruff + mypy clean.

**Files added:** `package/tests/test_inspection_adapter/conftest.py`.
**Files updated:** `test_graph_builder.py` (`builder` depends on the restore fixture); `progress.md`.

### 2026-05-25 — Phase 4: layers
**What was done**
- The snapshot drops layer metadata, so added a **config-based** extractor:
  - `snapshot_source.load_catalog_config()` — reads the raw catalog config (no `DataCatalog`
    materialised; mirrors how the snapshot loads config internally);
  - `layers.extract_layers()` — maps dataset → layer from `metadata.kedro-viz.layer` (transcoding
    stripped), the same field the live backend reads.
- `GraphBuilder` now takes an optional `layer_mapping`: sets each data node's `layer`, and builds the
  sorted `layers` list by **reusing `services.layers.sort_layers`**.
- Matched the live behaviour that the `layers` list is **global presence + per-view ordering**: seeded
  the sort with all layered datasets project-wide (`_global_layer_nodes`) while using the rendered
  pipeline's edges for ordering — so e.g. `reporting_stage` lists all 6 layers in the right order.
- Tests: per-node `layer` matches baseline exactly; `layers` list matches for `__default__` and
  `reporting_stage`; hermetic `test_layers.py` for the extractor (metadata form, transcoding, non-dict).

**Anti-drift review:** layers (per-node + list) match the live baseline; reused `sort_layers`;
config-based extractor per plan; `GraphBuilder` stays decoupled from config loading; no runtime path
touched. **Layer stays a Viz concern** — it lives under the Viz-owned `metadata.kedro-viz.layer` key
(Kedro doesn't interpret it), so we do NOT ask Kedro to expose "layer"; we read catalog config Viz-side.
**Known minor gap (Viz-side to fix):** layered *factory-pattern* datasets aren't resolved for layer
(the demo has none) because `extract_layers` keys by the raw config (pattern) name — resolvable Viz-side
later using the snapshot's concrete names; no Kedro change needed.

**Quality pass:** ruff + mypy clean; **61/61 adapter tests pass** in `viz-3-14`.

**Files added**
- `package/kedro_viz/integrations/kedro/inspection/layers.py`
- `package/tests/test_inspection_adapter/test_layers.py`

**Files updated**
- `snapshot_source.py` (`load_catalog_config`), `graph_builder.py` (layer wiring + `sort_layers` reuse
  + `_global_layer_nodes`), `test_graph_builder.py` (layer parity tests + fixture loads layers),
  `progress.md`.

**Files deleted**
- None.

**Tests run**
- `pytest tests/test_inspection_adapter/` → 61 passed (`viz-3-14`).

**Next steps**
- Phase 5: node metadata (`/api/nodes/{id}`) — split snapshot-backed fields (inputs/outputs, dataset
  type/filepath, run commands) from live-only fields (source code, previews, parameter values), and
  decide the snapshot-only degradation behaviour.

### 2026-05-25 — Review follow-ups: ID serialization hardening + doc drift
**What was done** (from a re-review; only the genuinely valid items)
- `ids.py`: `task_node_id` now serializes the identity via `json.dumps([name, inputs, outputs])`
  instead of a comma-joined string, removing a latent ambiguity (a single input `"a,b"` vs two
  inputs `"a"`,`"b"` previously hashed the same). New IDs differ again, but no external consumer
  exists yet and parity tests compare by name, so all 56 stay green. Verified the two cases are now
  distinct.
- Doc drift fixed: `graph_builder.py` module docstring no longer lists the modular tree/nodes/edges as
  out-of-scope (3b/3c implemented them); `progress.md` Phase -1 dashboard row updated to ✅ Resolved
  (was still "in progress / ask drafted", inconsistent with D9).
- Reviewed but NOT changed (valid-but-by-design): layers/`node_extras`/task `parameters`/`dataset_type`
  remain deferred to Phase 4/5; the "65 vs 110 edges" and "tests drop modular edges" review points were
  stale (already addressed in Phase 3c).

**Quality pass:** ruff + mypy clean; 56/56 tests pass in `viz-3-14`.

### 2026-05-25 — Phase 3c: modular graph edges + cycle removal (Phase 3 complete)
**What was done**
- `GraphBuilder._add_modular_edges`: for each modular pipeline, add `input -> mp` and `mp -> output`
  edges (boundary datasets), for every modular pipeline incl. nested ones.
- `GraphBuilder._remove_cyclic_modular_edges`: drop any `input -> mp` edge whose input is also
  reachable *from* the mp (would form a cycle), mirroring the live backend. Uses a small
  dependency-free reachability BFS (`_reachable_from`) rather than pulling in networkx.
- Broadened the edge parity test to compare **all** edges (modular included) across **all 6 pipelines**
  — the 45 modular edges in `__default__` and each sub-pipeline's subset match the baseline exactly.
- Added a synthetic unit test for cycle removal (the clean demo doesn't exercise it).

**Anti-drift review:** modular edges match the live baseline across all pipelines; cycle removal
matches live behaviour (no-op on the demo, validated separately); no runtime path touched; reused the
`ids` seam + `ROOT_MODULAR_PIPELINE_ID`; KISS (BFS, no networkx).

**Quality pass:** ruff + mypy clean; **56/56 adapter tests pass** in `viz-3-14`.

**Files updated**
- `package/kedro_viz/integrations/kedro/inspection/graph_builder.py` (modular edges + cycle removal
  + `_reachable_from`).
- `package/tests/test_inspection_adapter/test_graph_builder.py` (edge test now includes modular edges;
  cycle-removal unit test; docstring).
- `progress.md` (dashboard → Phase 3 complete, this entry).

**Files added / deleted**
- None.

**Tests run**
- `pytest tests/test_inspection_adapter/` → 56 passed (`viz-3-14`).

**Phase 3 is now complete** — the snapshot adapter reproduces the full main-graph structure
(nodes, edges, tags, pipelines, modular membership, modular tree + nodes + edges) with parity proven
across all 6 demo pipelines.

**Next steps**
- Phase 4: layers — keep Viz layer extraction (snapshot has no catalog metadata); populate
  `GraphAPIResponse.layers` + per-node `layer`, reusing `services/layers.sort_layers`.

### 2026-05-25 — Phase 3b: modular-pipeline tree + modularPipeline nodes
**What was done**
- Added `ModularTreeBuilder` to `modular_pipelines.py` — reproduces the live
  `ModularPipelinesRepository` algorithm on snapshot data (no live `Pipeline` objects):
  - per-modular-pipeline `inputs`/`outputs` via set-algebra, including the rest-term
    `outputs = (produced - consumed) | (rest_inputs & produced)` (the `prm_spine_table` case);
  - children: direct task nodes + internal datasets (io minus boundary minus params); parent links
    (mp as child of parent + parent gets the mp's non-param boundary datasets);
  - `__root__` children: standalone root tasks/datasets/params (resolved against **this pipeline's**
    membership, which can differ from global) + top-level mps + their boundary datasets;
  - modular-pipeline node tags = the union of the subtree's tags.
- Wired into `GraphBuilder`: emits `modularPipeline` nodes (`pipelines=[selected]`, tags = subtree
  tags) and populates `GraphAPIResponse.modular_pipelines` (was `{}`).
- Parity tests (by name, since IDs differ — D9):
  - modular tree entries (inputs/outputs/children) match baseline **exactly** by name+type for all
    6 modular pipelines;
  - `modularPipeline` node sets match across **all 6 pipelines**; tags/pipelines/modular_pipelines exact;
  - `__root__` children match by name for `__default__` and `modelling_stage`.

**Anti-drift review:** tree + mp nodes match the live baseline; no runtime path touched; reused
`GraphNodeType`, `ROOT_MODULAR_PIPELINE_ID`, the `ids` seam; `ModularTreeBuilder` is a separate
single-responsibility class. **Documented non-replication:** the live root-children "param shown as
both `data` and `parameters`" duplicate (a benign artifact) is not reproduced — root children are
validated by name. **Deferred:** modular graph edges (input→mp, mp→output) + cycle removal → Phase 3c.

**Quality pass:** ruff + mypy clean; **55/55 adapter tests pass** in `viz-3-14`.

**Files updated**
- `package/kedro_viz/integrations/kedro/inspection/modular_pipelines.py` (added `ModularTreeBuilder`,
  `ModularTreeEntry`, shared `_in_subtree`).
- `package/kedro_viz/integrations/kedro/inspection/graph_builder.py` (emit modularPipeline nodes +
  modular tree response).
- `package/tests/test_inspection_adapter/test_graph_builder.py` (tree/mp-node parity tests; broadened
  node-set coverage to `modularPipeline`).
- `progress.md` (dashboard, this entry).

**Files added / deleted**
- None.

**Tests run**
- `pytest tests/test_inspection_adapter/` → 55 passed (`viz-3-14`).

**Next steps**
- Phase 3c: modular graph edges (input→mp, mp→output, for I/O belonging to the registered pipeline)
  + cycle removal (drop bad input→mp edges), into `GraphAPIResponse.edges`; extend edge parity to
  include modular edges.

### 2026-05-25 — Deep review checkpoint (Phase 1 → 3a)
**What was done**
- Full review of the adapter against the original requirements (issue #2265 + plan §1 Goal/Scope/DoD)
  and the code-quality bar (reuse / quality / efficiency; KISS-YAGNI-DRY-SOLID; ruff/mypy/conventions).
  Review agents were unavailable (session limit), so the pass was done inline and verified against the
  live codebase.
- **Fixes applied (4):**
  1. DRY — `graph_builder` now reuses `constants.DEFAULT_REGISTERED_PIPELINE_ID` instead of a local
     `DEFAULT_PIPELINE_ID`.
  2. Dead code — removed unused `AUTO_NAME_RE` + `import re` from `capture_baseline.py`.
  3. Efficiency — hoisted the invariant global tag list to `__init__` (`self._tags`); no longer rebuilt
     on every `build()`.
  4. YAGNI — removed the unused module `logger` from `snapshot_source.py`.
- **Test coverage broadened:** structural parity (node sets, edges, modular membership) now runs across
  **all 6 registered pipelines** (was 2–4) — no hidden mismatch found in `pre_modelling`/`reporting_stage`.
- Verified non-issues: importing private `utils` helpers is established repo convention; `_AUTO_NAME_RE`
  exists in one module only; `GraphNodeType` enum used (no stringly-typed types).

**Result:** ruff + mypy clean; **45/45 adapter tests pass** in `viz-3-14`; existing code untouched
(only new untracked files). Requirements alignment confirmed; approved to proceed to Phase 3b.

### 2026-05-25 — Phase 3a: modular-pipeline membership + data-node tags
**What was done**
- Added `integrations/kedro/inspection/modular_pipelines.py` — `ModularMembership` computes each
  node's `modular_pipelines` membership from namespaces + Kedro set-algebra:
  - **task** → its own (deepest) namespace only;
  - **dataset** → every modular pipeline where it's an I/O of a *direct* node (`namespace == P`) **or**
    a boundary I/O of `P`'s subtree (`inputs = consumed-produced`, `outputs = produced-consumed`).
- Wired it into `GraphBuilder`: per-node `modular_pipelines` now populated; **data-node tags** (deferred
  from Phase 2) now propagated from connected tasks.
- Two rule corrections found via baseline tests (not assumptions):
  1. membership is **global** (computed once across all pipelines), so a node shows the same membership
     in every pipeline view (e.g. `model_input_table` keeps `feature_engineering` in the `modelling_stage`
     view) — `GraphBuilder` now builds `ModularMembership` once over all pipelines' nodes;
  2. the **dual** rule (direct-IO ∪ boundary) is needed so an internal-but-escaping dataset like
     `prm_spine_table` belongs to both `ingestion` and `feature_engineering`.
- Added parity tests: `modular_pipelines` membership matches baseline **exactly** for `__default__`
  and `modelling_stage`; data-node tags match baseline exactly.

**Anti-drift review:** membership + data-tags match the live baseline exactly; no runtime path touched;
reused existing helpers; scope held — modularPipeline tree nodes/children (3b) and modular edges +
cycle removal (3c) still deferred; layers (P4), node_extras/params (P5) untouched.

**Quality pass:** ruff + mypy clean; **31/31 adapter tests pass** in `viz-3-14`.

**Files added**
- `package/kedro_viz/integrations/kedro/inspection/modular_pipelines.py`

**Files updated**
- `package/kedro_viz/integrations/kedro/inspection/graph_builder.py` (global modular membership,
  data-node tags, `_register_dataset` helper).
- `package/tests/test_inspection_adapter/test_graph_builder.py` (membership + data-tag parity tests).
- `progress.md` (dashboard, this entry).

**Files deleted**
- None.

**Tests run**
- `pytest tests/test_inspection_adapter/` → 31 passed (`viz-3-14`).

**Next steps**
- Phase 3b: build the modular-pipeline *tree* — `modularPipeline` nodes with `children`, hashed
  `inputs`/`outputs`, and parent/child nesting — into `GraphAPIResponse.modular_pipelines`; extend
  parity tests to the tree. Then Phase 3c: modular graph edges + cycle removal.

### 2026-05-25 — Phase 2: core graph builder (snapshot → GraphAPIResponse)
**What was done**
- Added `integrations/kedro/inspection/graph_builder.py` — `GraphBuilder(snapshot).build(pipeline_id)`
  returns a real `GraphAPIResponse` built directly from the snapshot (reuses the existing response
  models, so the output shape matches by construction; no changes to existing code).
- Builds: **task** nodes (id via `ids.py`, display name = namespace+`__hash` stripped, `full_name` =
  snapshot name), **data**/**parameter** nodes derived from node inputs/outputs (transcoding collapsed),
  **edges** (dataset→task, task→dataset), global **tags** + **pipelines**, per-node pipeline membership,
  and `selected_pipeline` (default `__default__`, else first). `dataset_type` set best-effort from the
  snapshot's raw config string.
- Added `test_graph_builder.py` — **structural** parity vs the baseline (IDs deliberately differ, D9):
  node sets by name/type across 4 pipelines, edge connectivity (ID→name translated, modular edges
  excluded), tags, pipelines, task display names, default selection.
- Added an ID edge-case test: source (no inputs) and sink (no outputs) nodes get valid, distinct IDs.

**Anti-drift review:** builds the real `GraphAPIResponse` (shape matches); structural parity proven
(IDs new per D9, matching the updated DoD); no runtime path touched; reused existing helpers; scope
held — modular tree (P3), layers (P4), node_extras + resolved params (P5) returned empty by design.

**Quality pass:** ruff + mypy clean; **28/28 adapter tests pass** in `viz-3-14`.

**Deferred within Phase 2 (tracked):**
- Per-node tags on **data** nodes (live backend copies task tags onto connected datasets) — currently `[]`.
- `dataset_type` is the raw snapshot string (e.g. `pandas.CSVDataset`), not the live class path
  (`pandas.csv_dataset.CSVDataset`) — known format gap (D9-adjacent), revisit in P5 or via a small mapper.
- `node_extras` (stats/styles) and resolved task `parameters` — live-only, Phase 5.

**Files added**
- `package/kedro_viz/integrations/kedro/inspection/graph_builder.py`
- `package/tests/test_inspection_adapter/test_graph_builder.py`

**Files updated**
- `package/kedro_viz/integrations/kedro/inspection/__init__.py` (export `GraphBuilder`).
- `package/tests/test_inspection_adapter/test_ids.py` (source/sink edge-case test).
- `progress.md` (dashboard, this entry).

**Files deleted**
- None.

**Tests run**
- `pytest tests/test_inspection_adapter/` → 28 passed (`viz-3-14`).

**Next steps**
- Phase 3: `modular_pipelines.py` — build the modular-pipeline tree + per-node `modular_pipelines`
  membership from `NodeSnapshot.namespace` (with the set-algebra), and add modular nodes/edges to the
  graph; extend parity tests to the tree. Fold in data-node tags while touching node membership.

### 2026-05-25 — Node-ID decision (D9): viz-side scheme, breaking release
**What was done**
- Kedro + Viz teams agreed: node ID stays a **Viz concern** — no Kedro API change. The adapter
  generates IDs from identity fields (namespaced name + inputs/outputs), **excluding tags**. Accepted
  as a **breaking release**. This closes the Phase -1 node-id gate.
- Simplified `ids.py` to the new scheme: removed the obsolete `_hash(str(node))` reconstruction
  (func-name heuristic, auto/explicit branching) — now a single `_hash("<name>|inputs=..|outputs=..")`.
  `task_node_id` signature dropped the now-unused `namespace` arg.
- Rewrote `test_ids.py` to verify the new scheme's **properties** (deterministic, every node resolves,
  unique, tag-independent, io-sensitive, no task/dataset ID collisions) instead of equality with old IDs.
- **Anti-drift correction:** updated the plan so parity is **structural** (same nodes/edges/tags/layers
  by name & connectivity), with IDs deliberately new — not byte-identical to today. Updated §4.6
  (resolution) and §12 (Definition of Done).

**Decisions made**
- D9: viz-side identity-based node IDs, breaking release; run-hook switches in lockstep at Phase 6.

**Files updated**
- `package/kedro_viz/integrations/kedro/inspection/ids.py` (rewritten to new scheme, simpler).
- `package/tests/test_inspection_adapter/test_ids.py` (rewritten for new-scheme properties).
- `INSPECTION_ADAPTER_PLAN.md` (§4.6 resolution, §12 DoD), `progress.md` (D9, open asks, this entry).

**Files added / deleted**
- None.

**Quality pass:** ruff + mypy clean; **10/10 tests pass** in `viz-3-14`.

**Next steps**
- Phase 2: `graph_builder.py` — build task/data/parameter nodes + edges + tags into a
  `GraphAPIResponse`; validate **structurally** against `baseline/main.json` + `baseline/pipelines/*`.

### 2026-05-22 — Phase 1: adapter scaffolding (snapshot source + ID seam)
**What was done**
- Created the adapter subpackage at `package/kedro_viz/integrations/kedro/inspection/` (D6) with the
  two foundational, testable seams:
  - `snapshot_source.py` — `load_snapshot()` (wraps `kedro.inspection.get_project_snapshot`, local
    Python API only, D1) + `is_inspection_available()` feature-detect (works on kedro<1.4 without error).
  - `ids.py` — the single ID seam (D3): `task_node_id()` reconstructs `_hash(str(node))` from snapshot
    fields; `dataset_node_id()` wraps `_hash_input_output`. Documents the func-name limitation and the
    one-line extension point for when Kedro exposes it.
- Added hermetic tests under `package/tests/test_inspection_adapter/`:
  - `test_ids.py` — proves `task_node_id` reproduces the backend ID for all `auto`/`explicit_eq_func`
    nodes in the baseline, and that `explicit_diff_func` nodes cannot be reconstructed (documents the gap).
  - `test_snapshot_source.py` — `load_snapshot` returns the demo pipelines (skips if kedro<1.4).
- Enhanced the Phase 0 report to include per-node `inputs`/`outputs` so the ID tests are hermetic.

**Quality pass:** `ruff format` + `ruff check` clean; `mypy --config-file=package/mypy.ini` clean on
the adapter package; **6/6 tests pass** in `viz-3-14`. Also refactored the harness `normalize_graph`
(removed dead `_sort_lists`, extracted `_sort_in_place`) to clear a ruff complexity warning.

**Anti-drift review:** still targets the same `GraphAPIResponse` contract; no runtime path changed;
ID logic isolated in one module; correct location; local API only. Deliberately deferred
`graph_builder`/`modular_pipelines`/`layers` to their phases (D8, YAGNI).

**Decisions made**
- D8: create adapter modules per-phase (YAGNI), not all upfront.

**Files added**
- `package/kedro_viz/integrations/kedro/inspection/{__init__,snapshot_source,ids}.py`
- `package/tests/test_inspection_adapter/{test_ids,test_snapshot_source}.py`

**Files updated**
- `package/tests/test_inspection_adapter/capture_baseline.py` (report now includes inputs/outputs;
  `normalize_graph` tidied) + regenerated `baseline/` (node counts unchanged: main 63 nodes/110 edges).
- `progress.md` (dashboard, decision log D8, this entry).

**Files deleted**
- None.

**Tests run**
- `pytest tests/test_inspection_adapter/test_ids.py test_snapshot_source.py` → 6 passed (`viz-3-14`).

**Next steps**
- Phase 2: add `graph_builder.py` — build task/data/parameter nodes + edges + tags from the snapshot
  into a `GraphAPIResponse`, and diff against `baseline/main.json` + `baseline/pipelines/*.json`.

### 2026-05-22 — Phase 0 baseline captured + Phase -1 min-version pinned
**What was done**
- **Phase -1:** pinned the minimum kedro version. kedro RELEASE.md lists the inspection API under
  `# Release 1.4.0` (released 2026-05-22); 1.1.1/1.2.0/1.3.x predate it → adapter floor `kedro>=1.4.0`
  (Decision D5). Confirmed the node-id ask draft (`INSPECTION_NODE_ID_ASK.md`) is ready; not filed yet.
- **Phase 0:** built a golden-file parity harness under
  `package/tests/test_inspection_adapter/` and ran it in `viz-3-14`. Captured the current live-object
  backend output for `demo-project` as the baseline the adapter will be diffed against:
  - `baseline/main.json` (63 graph nodes incl. data/param/modular, 110 edges)
  - `baseline/pipelines/<id>.json` for all 6 registered pipelines
  - `baseline/node_id_report.json` — per task-node ID classification
- **Node-ID report (real numbers):** 21 task nodes — 19 reconstructable, 2 not. Breakdown:
  `auto`=16, `explicit_eq_func`=3 (reconstructable by convention only), `explicit_diff_func`=2
  (NOT reconstructable: `ingestion.company_agg`, `ingestion.combine_step`). Also verified
  **graph ids == run-status hook ids** for all nodes (both are `_hash(str(node))`), confirming the
  Finding-2 coupling holds today.

**Decisions made**
- D5: minimum kedro for the adapter path = 1.4.0.

**Files added**
- `package/tests/test_inspection_adapter/__init__.py`
- `package/tests/test_inspection_adapter/README.md`
- `package/tests/test_inspection_adapter/capture_baseline.py`
- `package/tests/test_inspection_adapter/baseline/main.json`
- `package/tests/test_inspection_adapter/baseline/pipelines/{__default__,data_ingestion,feature_engineering,modelling_stage,pre_modelling,reporting_stage}.json`
- `package/tests/test_inspection_adapter/baseline/node_id_report.json`

**Files updated**
- `progress.md` (status dashboard, decision log D5, open asks, this entry).

**Files deleted**
- None.

**Tests run**
- `capture_baseline.py` in `viz-3-14` — succeeded; baseline + report written and verified.

**Next steps**
- Decide whether to file the node-id ask on kedro#5266 (awaiting go-ahead; outward-facing).
- Phase 1: scaffold `package/kedro_viz/integrations/kedro/inspection/` (snapshot_source, models,
  ids seam, graph_builder, modular_pipelines, layers), then Phase 2 to diff adapter output vs this baseline.

### 2026-05-22 — Dev environment fixed to `viz-3-14`
**What was done**
- Verified `viz-3-14`: Python 3.14.4, kedro 1.4.0 (ships `kedro.inspection.get_project_snapshot`),
  kedro-viz 12.x.
- Confirmed the **real** `get_project_snapshot()` runs on `demo-project` in this env with no shims
  (21 default nodes, 19 datasets, 4 params).
- Caught that the env's editable kedro-viz pointed at the `kedro-viz-5` checkout; **reinstalled
  editable from this repo** (`pip install -e package/ --no-deps`) so `import kedro_viz` resolves here.

**Decisions made**
- D4: use `viz-3-14` for all dev/testing.

**Files updated**
- `progress.md` (Decision Log, Open Asks, new Development Environment section).

**Files added / deleted**
- None (source unchanged).

**Tests run**
- Smoke checks only: `import kedro_viz` path verification; real snapshot on demo-project.

**Next steps**
- Phase -1: file the Kedro node-id ask. Phase 0: build the golden-file parity harness in `viz-3-14`.

### 2026-05-22 — Planning & investigation complete
**What was done**
- Studied kedro-viz issue #2265 (modularisation) and the decided direction (Kedro owns inspection,
  Viz adapts the snapshot into the existing graph JSON).
- Verified the merged Kedro inspection layer against `kedro-org/kedro` source: dataclass models,
  entry point `get_project_snapshot(project_path, env=None)`.
- Confirmed the HTTP `/snapshot` endpoint was **reverted** (kedro#5570) → local Python API only.
- Proved the node-id parity problem empirically on `demo-project`: 19/21 default-pipeline nodes
  reconstructable; the 2 failures are exactly the `name != func.__name__` nodes
  (`company_agg`, `combine_step`). Confirmed viz id `8de402c1 = _hash(str(node))`.
- Confirmed secondary parity gaps: `dataset_type` string mismatch (`pandas.CSVDataset` vs
  `pandas.csv_dataset.CSVDataset`), credential-redacted filepaths, transcoded datasets, no runtime-params path.
- Noted env reality: local kedro 1.1.1 lacks inspection; `demo-project` targets a newer kedro
  (`preview_fn`/`preview_contract`).

**Decisions made**
- D1, D2, D3 (see Decision Log).

**Files added**
- `INSPECTION_ADAPTER_PLAN.md` (final plan), `INSPECTION_NODE_ID_ASK.md`, `progress.md`.

**Files updated / deleted**
- None (no source code changed yet).

**Tests run**
- Ad-hoc verification scripts only (vendored inspection run against demo-project; live-vs-snapshot
  id comparison). No repo tests changed.

**Next steps**
- Phase -1: file the Kedro node-id ask; begin pinning the min kedro version.
- Phase 0: set up a kedro environment that has `kedro.inspection`; build the golden-file parity harness.

<!-- ============================================================
TEMPLATE — copy for each new phase/work entry:

### YYYY-MM-DD — <Phase N: short title>
**What was done**
- ...

**Decisions made**
- ...

**Files added**
- ...

**Files updated**
- ...

**Files deleted**
- ...

**Tests run**
- ...

**Next steps**
- ...
============================================================ -->
