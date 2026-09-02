# Backend v2 — Adoption Plan

Replace the hand-rolled graph backend with the snapshot adapter, **without losing any UI
functionality** (graph, detail panel, run-status, lite, export, `--params`).

> **Status (2026-06-24).** Done through the engine deletion (Phase 4 / D21): the live backend is
> **deleted**, the adapter is the only graph engine, and `--params` runs through it. We kept the
> slim metadata-bridge load (and `sort_layers`) as recommended below — but the deletion went ahead
> now, and two consumers were **deliberately left behind** rather than migrated: the notebook
> visualizer and the VSCode JSON path (so this dropped one piece of UI functionality on purpose,
> to be restored next). Remaining: restore those two consumers, the frontend handoff, slim the
> models, and the Kedro asks. See [`phase4_deletion_decisions.md`](phase4_deletion_decisions.md).

## Governing rule

> **Parity drives deletion — not the other way around.**
> Prove `--params` parity first, replace the metadata bridge next, and delete the old backend
> **only after** both are green. Never delete code to hit a line-count target.

## The one idea that makes the phases fit

The old live load does **two separable jobs**:

1. **Build the graph structure** (nodes / edges / modular tree / layers) → the adapter already
   replaces this → **safe to delete.**
2. **Build the node index** — live `TaskNode` / `DataNode` objects holding `kedro_obj`, used by the
   **metadata bridge** for the detail panel's **source code, preview, stats, resolved
   `dataset_type`** → the snapshot **cannot** provide this → **keep a slim version** until Kedro
   exposes node source (Phase 6).

So "delete the old backend" really means "delete the **structure** engine, keep a slim **metadata**
path until the bridge has a snapshot-based replacement."

## Gate findings — verified empirically (Phase 1)

Both `--params` gates were run (see `blind_spots_demo.py` and `test_runtime_params*.py`):

- **Spot 1 — catalog templating: REAL.** A dataset path templated on `${runtime_params:...}` is
  param-blind in the snapshot (resolves the default) but param-aware in the live `context.catalog`.
  Proven: adapter `data/01`, live `data/02`. So the **pure-snapshot / lite** path can't reflect it;
  **full mode's live bridge covers it** (the bridge is filled by a live load that ran with
  `--params`). Lite + catalog-templating is a documented degradation.
- **Spot 2 — dynamic topology: CLEARED on kedro >= 1.4.** `get_current_session()` (the old way for
  `register_pipelines` to read `--params`) was removed, and the live loader builds the graph from
  the same param-blind global `pipelines`. So `--params` changes *values*, never the node/edge set —
  for both engines. Proven: node counts unchanged with/without `--params`. **Not a blocker.**

**Refined "bridge" scope.** The bridge's irreducible job is **source code + dataset preview** — the
only things that fundamentally need live Python objects. Everything else has a non-bridge source:
names + inputs/outputs from the snapshot; dataset type/filepath/layer from the catalog config
(runtime-param-aware when read with `runtime_params`); parameter values from the config loader; stats
from `stats.json`. So the "slim live load" we keep is small, and shrinks to nothing once Kedro exposes
node source (`func_source`).

**Consequence for deletion.** The big **graph-building engine** (~700–840 lines: the `managers.py`
traversal, the structure repositories, the legacy response bodies) can go now — the adapter replaces
it. What stays is a **slim live load + bridge** (~300 lines: load catalog + build the live node
objects + the metadata extractors), which serves code/preview **and** covers the `--params` catalog
case. The live load disappears entirely only with the Kedro `func_source` change (Phase 6).

---

## Phase 0 — Reconcile the plan with the branch

**Goal:** make the strategy match what already exists, and get everyone on one base.

**Already done (mark as done in the doc):**
- Snapshot adapter, `GraphBuilder`, `InspectionAdapterProvider` exist.
- Adapter is the default for normal (non-`--params`) runs.
- Lite mode works via `LiteParser` stubbing (our Path B).
- Full-mode `dataset_type` parity is fixed (our D20 — currently **uncommitted**).
- Live backend retained for `--params` (D18); metadata bridge retained for full-mode detail-panel
  parity.

**Branch mechanics:**
1. Commit D20 (the 9 uncommitted files) on `feature/snapshot-adapter`.
2. Get one base: rebase/merge so the v2 branch carries the latest adapter **+ Path B + D20** (the
   `chore/backend_v2_strat` branch currently predates them).
3. Re-run `make lint` + `pytest` on the unified branch.

**Reframe the doc language** from *"delete old backend after a direct param overlay"* to
*"prove runtime-param parity first, then delete the old graph backend only after a metadata-bridge
replacement exists."*

**Gate:** unified branch builds; full suite green. No behaviour change.

---

## Phase 1 — Runtime-params **spike** (no deletion)

**Goal:** test whether `--params` can be served by *snapshot + config-loader values* instead of the
live backend. This is a **proof spike that is allowed to fail.**

**Why it's plausible (confirmed in Kedro source):** `get_project_snapshot` builds catalog +
parameters from a **config loader** (`_make_config_loader` → `config_loader["catalog"]`,
`_get_parameter_keys`) — no `KedroSession`, no `DataCatalog` instantiation. And `OmegaConfigLoader`
already accepts `runtime_params` (the channel `--params` uses).

**Implementation shape:**
- Add a parameter-loading helper in `snapshot_source.py` (alongside `lite_import_stubs`, so Path B
  is untouched): load base parameter **values** via the config loader, then apply the CLI runtime
  params.
- **Prefer threading `runtime_params` into the config loader** (`OmegaConfigLoader(runtime_params=…)`,
  let Kedro resolve) over a hand-rolled dotted-key overlay — Kedro handles type coercion and
  `${runtime_params:…}` catalog templating, matching a real `kedro run`. (If a manual overlay is
  used instead, a coercion-parity test is mandatory.)
- Pass resolved values into `InspectionAdapterProvider`; teach the provider/enrichment to populate
  task-node `parameters` in `/api/main` and parameter-node metadata in `/api/nodes/{id}`.
- **Do NOT delete** `LiveDataProvider`, `data_loader.py`, or `data_access/` yet.

**Test matrix (these are the gate, not extras):**
- `--params test_size=0.3`; nested dotted `model_options.test_size=0.3`; root parameters node;
  single `params:x` node; missing parameter key; repeated `--params`; env-specific parameters.
- **Type preservation:** int, float, bool, list, dict.
- **The two divergence risks — must be tested explicitly:**
  - catalog entries that use runtime params (`${runtime_params:…}`),
  - a pipeline registry that reads session/runtime params (dynamic topology).
- Run the matrix on the **demo and at least one realistic non-demo project**.

**Exit gate (can fail):** adapter output for `--params` must match the live backend for **graph and
node metadata**. **If catalog resolution or pipeline registration can diverge → stop and keep the
live backend for `--params`** (fall back to the Kedro ask in Phase 6).

---

## Phase 2 — Route `--params` through the adapter, behind a parity gate

**Only if Phase 1 passes.** Keep the live backend available for comparison/fallback during dev.

**Steps:**
- Change `server.py::_configure_inspection_adapter_provider` so `extra_params` no longer
  auto-disables the adapter.
- Rename internal `extra_params` → `runtime_params` **carefully** (tests + launchers still expect
  `extra_params`; `data_loader.py:187` already translates at the boundary; `run.py:182`,
  `jupyter.py:124`).
- Add `test_server.py` coverage proving `--params` installs the adapter.
- Parity tests comparing adapter vs live for: `/api/main`, `/api/nodes/{id}`, static export,
  run-status ID compatibility.

**Exit gate:** `kedro viz run --params …` behaves identically to the live backend on the demo **and**
at least one realistic non-demo project. (Live backend still present — not deleted yet.)

---

## Phase 3 — Replace the metadata bridge **before** deleting data access

This is where the original target plan is too optimistic. Full-mode metadata still depends on live
objects from `data_access_manager.nodes`. Build a smaller **metadata-only** path before deleting
anything.

**Goal:** stop using the old *graph engine* for metadata, while keeping detail-panel behaviour.

**The new minimal metadata source must still provide:** task source code; task inputs/outputs;
resolved task parameters; dataset filepath; dataset preview; dataset stats; dataset type; parameter
values; transcoded-dataset metadata. It may still need live objects / a session, **but it must not
build the whole graph** (job #2, not job #1).

**Exit gate:** `/api/nodes/{id}` parity for task / data / parameters / transcoded; preview unchanged;
static export writes identical node-metadata files.

---

## Phase 4 — Delete the old graph-building stack

**Only after Phases 2 and 3 are green.** Then delete or simplify:
- `data_access/managers.py` — the graph-traversal half (`add_pipelines` edges/tree/registered).
- `data_access/repositories/*` — the structure repos.
- graph-building bodies inside the response builders.
- `LiveDataProvider` + the dual-engine routing in `data_provider.py`.
- the old `populate_data()` graph-population path; old tests that only cover deleted internals.

**Do NOT delete `services/layers.py` yet** — `graph_builder.py` imports `sort_layers` from it
(`inspection/layers.py` is `extract_layers`, a *different* function). Either move `sort_layers` into
the inspection code first, or keep the service.

**Keep** the slim metadata path from Phase 3 (job #2) and the repos the bridge reads
(`catalog`, `GraphNodesRepository`).

**Exit gate:** adapter-only backend serves normal / `--params` / lite / export / run-status; full
suite green; **line-count removal is real (~700–900 lines now), not moved elsewhere.** The full
~1,200–1,500 is gated on Phase 6.

---

## Phase 5 — Slim the flowchart models (after deletion, not before)

Doing this earlier fights the bridge and complicates debugging. Once the old data access is gone:
- remove factory methods **only** where no production code uses them;
- remove `kedro_obj` from graph-only models **only** once the metadata path no longer needs it;
- keep metadata-specific models, or introduce explicit metadata DTOs.

---

## Phase 6 — Longer-term snapshot metadata (Kedro-dependent)

Push the remaining gaps upstream; each unlocks more Viz-side deletion:
- `runtime_params` support in `get_project_snapshot()` (closes the Phase-1 fallback, if it was hit),
- import-free snapshot (would replace our `LiteParser` stubbing),
- optional node **source / `func_source`** metadata (the last thing forcing live objects for the
  detail panel — unblocks removing the slim metadata load entirely),
- richer dataset metadata if needed.

When `func_source` (+ a snapshot preview story) lands: move code/preview to the snapshot, drop the
slim metadata load, remove `kedro_obj`, and the full ~1,200–1,500-line removal becomes real.

---

## Recommended order

1. Reconcile the doc + branches (Phase 0).
2. Runtime-params **spike** in `snapshot_source.py`, **no deletion** (Phase 1).
3. Prove or disprove `--params` parity (Phase 1 gate).
4. If proven, route `--params` through the adapter behind a parity gate (Phase 2).
5. Build the metadata-only replacement for the bridge (Phase 3).
6. Delete the old graph backend (Phase 4).
7. Slim the models (Phase 5).
8. Push remaining gaps to Kedro (Phase 6).

## The one decision for the team

**How aggressive on deletion (Phase 4)?**
- **Recommended — keep the slim metadata load.** No feature loss; deletes ~700–900 lines now; the
  rest follows Phase 6.
- **Aggressive — go pure-snapshot now.** Deletes ~1,200–1,500 immediately but **loses source code +
  preview** in the detail panel until Kedro exposes `func_source`. A visible regression in the
  default mode. Not recommended.

## Verification (whole programme)

1. **Parity** — adapter JSON == live baseline for all node types, **including D20 `dataset_type`**.
2. **`--params`** — full Phase-1 matrix (nested, types, env, catalog templating, dynamic pipelines,
   missing key) on demo **and** a non-demo project; matches a real `kedro run`.
3. **Detail panel** — code, filepath, preview, stats render (full mode) for
   task/data/transcoded/params.
4. **Run-status** — durations + errors via the hook (IDs correlate via `node_ids`).
5. **Lite mode** — renders with no project deps (Path B); thin payload as documented.
6. **Static export** — `kedro viz build` writes all node files with new-scheme IDs.
7. **Line count** — the structure engine (~700–900) is gone, not moved; the rest tracked to Phase 6.

## One-line summary

Same target as the teammate's plan, safer path: **prove `--params` (spike, can fail) → route it
through the adapter behind a parity gate → replace the metadata bridge → only then delete the graph
engine → slim models last.** Keep the slim metadata load (and `sort_layers`) until Kedro exposes node
source.
