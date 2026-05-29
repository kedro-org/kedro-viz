# Kedro Inspection Adapter Plan (Final)

## 1. Goal & Scope

Use Kedro's inspection snapshot (`kedro.inspection.get_project_snapshot()`) as the source of project
structure for Kedro-Viz, then add a Viz-specific **adapter / enrichment layer** that preserves the
current Kedro-Viz JSON/API contract.

This is **not** a frontend rewrite. The target output remains the data shape currently served by:

- `/api/main`
- `/api/pipelines/{registered_pipeline_id}`
- `/api/nodes/{node_id}`
- saved API files under `api/main`, `api/pipelines/*`, `api/nodes/*`, and `api/run-status`

**In scope:** building the main graph (`/api/main`, `/api/pipelines/{id}`) from the snapshot.
**Out of scope (kept on the live path):** node metadata/previews, parameter values, source code,
run status, notebook visualisation, deployment/export internals (other than the API file set).

---

## Working Agreement — Engineering Standards & Per-Phase Exit Gate (read first)

**Adapter location.** All adapter/middleware code lives under
`package/kedro_viz/integrations/kedro/inspection/` — a subpackage of the existing Kedro integration,
consistent with how `integrations/deployment/` is structured. (Earlier drafts said
`adapters/inspection/`; that is superseded.)

**Engineering standards for all new code.**
- Match kedro / kedro-viz conventions: full type hints, Google-style docstrings, module-level
  `logger`, existing import ordering. Code must pass `make lint` (ruff check + ruff format, mypy via
  `package/mypy.ini`) and the test suite, run in the `viz-3-14` env.
- Keep it **lean and clean**. Apply **KISS, YAGNI, DRY, SOLID**: build only what the current phase
  needs (no speculative abstractions), reuse existing helpers instead of duplicating, and keep each
  module single-responsibility.

**Per-phase exit gate — run at the END of every phase, before starting the next.**
1. Update `progress.md` (changelog entry + status dashboard + decision log).
2. **Anti-drift review:** re-read §1 Goal & Scope and the issue #2265 direction; confirm the completed
   work still (a) targets the same `GraphAPIResponse` contract, (b) has not crept in scope, and
   (c) matches what we set out to build. Call out any drift explicitly and correct it before continuing.
3. **Quality pass:** confirm new code meets the standards above; run lint + tests in `viz-3-14`.
4. Only then begin the next phase.

---

## 2. Dependency Status — verified facts (read before planning effort)

These were verified directly against `kedro-org/kedro` and the local environment. They materially
change the sequencing, so they are stated up front.

- **The inspection layer is merged** in kedro main: `kedro/inspection/{__init__,models,snapshot,helper}.py`
  (PRs #5447, #5449, #5451, #5458, #5459, #5500). Models are **dataclasses**, not Pydantic.
- **The public entry point is `get_project_snapshot(project_path, env=None)`** — exactly two
  arguments. There is **no** `conf_source`, no reusable `metadata`, and no runtime-params argument.
  It calls `bootstrap_project(project_path)` internally on every call.
- **Remote / HTTP snapshot is NOT available.** The `GET /snapshot` HTTP server endpoint
  (#5546, docs #5558) was **reverted in #5570 (2026-05-20)**. The only safe assumption is the
  **local Python API**. Do not design against, or assume, any REST snapshot envelope.
- **Inspection is not in the currently installed/floor Kedro.** kedro-viz requires `kedro>=1.0.0`
  (`package/requirements.txt`), and the local env is kedro 1.1.1 — **neither has `kedro.inspection`**.
  The adapter path therefore requires a **newer kedro than the current floor**.
- **The bundled `demo-project` already targets a newer kedro** than 1.1.1 (it uses `node(..., preview_fn=...)`
  and `kedro.pipeline.preview_contract`). Running the snapshot or the adapter against it requires that
  newer kedro (or temporary shims). Settle the toolchain before relying on the demo for parity.

**Consequence:** for a long time the adapter must be **version-gated**, and the existing live-object
path must remain fully maintained as the fallback. In the short term the backend **grows** (two paths);
the simplification (Phase 7 removals) only lands once kedro-viz raises its kedro floor to an
inspection-bearing release.

---

## 3. Source Contracts

### 3.1 Kedro inspection snapshot (verified)

`kedro.inspection.get_project_snapshot(project_path, env=None) -> ProjectSnapshot`

```python
ProjectSnapshot(
    metadata=ProjectMetadataSnapshot(
        project_name=str,
        package_name=str,
        kedro_version=str,        # from pyproject.toml (kedro_init_version)
    ),
    pipelines=[
        PipelineSnapshot(
            name=str,             # registry key, e.g. "__default__"
            nodes=[
                NodeSnapshot(
                    name=str,         # == Kedro node.name (see Section 4) — namespaced
                    namespace=str | None,
                    tags=list[str],   # sorted
                    inputs=list[str], # ordered as Kedro returns them
                    outputs=list[str],
                )
            ],
            inputs=list[str],     # sorted free inputs
            outputs=list[str],    # sorted final outputs
        )
    ],
    datasets={
        "dataset_name": DatasetSnapshot(
            name=str,
            type=str,             # RAW catalog config string, e.g. "pandas.CSVDataset" (may be "")
            filepath=str | None,  # credentials in URIs are REDACTED ("://<redacted>@")
        )
    },
    parameters=list[str],         # sorted parameter KEYS only (no values)
)
```

Verified snapshot behavior:

- Bootstraps the project and reads pipelines/config. **Does not** run nodes or load datasets.
- `datasets` is built from raw catalog config; entries whose name starts with `_` and non-dict
  entries (YAML anchors) are skipped.
- Factory patterns are resolved **only for dataset names referenced by pipeline nodes**; unused
  patterns do not appear, and the pattern entries themselves are dropped (only concrete names remain).
- Returns parameter **keys**, not values.
- `NodeSnapshot.namespace` is present.

Verified omissions relative to the Viz contract:

- No graph node IDs. No edges. No Viz `modular_pipelines` tree.
- No layer information (`metadata["kedro-viz"]["layer"]`).
- No resolved dataset class type (only the raw config string), no dataset metadata beyond
  `type`/`filepath`, no dataset for memory/unregistered outputs.
- No parameter values, no node source code/filepath/preview, no dataset previews.
- No Viz node extras (stats/styles). No run status.
- **No function name and no stable node id** — see Section 4.

### 3.2 Kedro-Viz graph JSON (target output)

`GraphAPIResponse` (`package/kedro_viz/api/rest/responses/pipelines.py`):

```python
GraphAPIResponse(
    nodes=list[NodeAPIResponse],            # task | data | parameters | modularPipeline
    edges=list[GraphEdgeAPIResponse],
    layers=list[str],
    tags=list[NamedEntityAPIResponse],
    pipelines=list[NamedEntityAPIResponse],
    modular_pipelines=ModularPipelinesTreeAPIResponse,
    selected_pipeline=str,
)
```

Key node fields (verified against a real `/api/main` for the demo project):

- Common: `id`, `name`, `tags`, `pipelines`, `type`, `modular_pipelines`, `node_extras`
- Task: `parameters`, `full_name`
- Data-like: `layer`, `dataset_type`

Node metadata endpoint (`/api/nodes/{id}`) additionally returns live information: task `code`,
`filepath`, `parameters`, `inputs`, `outputs`, `run_command`, `preview`; dataset `filepath`, `type`,
`preview`, `preview_type`, `stats`; transcoded `original_type`/`transcoded_types`; parameter values.

---

## 4. The Node-ID Problem (the crux — read carefully)

This is the single hard dependency in the whole migration.

### 4.1 Three different "names" on a Kedro node

| | meaning |
|---|---|
| `_name` | the string passed as `name=` in `node(...)`, or `None` |
| `_func_name` | the function's `__name__` (always exists) |
| `node.name` | computed property: `namespace + "." + (_name or auto "{func}__{8hex}")` |

The snapshot only exposes **`node.name`** (as `NodeSnapshot.name`). It never carries `_name` and
`_func_name` separately.

### 4.2 How Viz derives its fields today

```
id        = _hash(str(node))      # _hash = sha1(value)[:8]
                                  # str(node) = "[_name: ]_func_name([inputs]) -> [outputs]"
name      = _name or _func_name   # display label
full_name = node.name             # == snapshot.name
```

`str(node)` **always contains `_func_name`**. Since the snapshot has no function name, the **`id`** is
the only field that cannot be reproduced directly. (`full_name` maps 1:1 from `snapshot.name`;
the display `name` is recoverable in all cases.)

### 4.3 Precise reconstructability rule

Reconstructing a task node's `id` from the snapshot alone is:

- **Reliable for auto-named nodes** (no `name=`): Kedro stores the name as `"{func}__{8hex}"`, so the
  function name is embedded in `snapshot.name` and can be recovered (`name.rsplit("__", 1)[0]`).
- **Impossible when `name=` is given AND `name != func.__name__`**: the function name is absent from
  the snapshot, so `str(node)` cannot be rebuilt.
- **Works only by convention when `name == func.__name__`**: the guess `func = name` happens to be
  correct, but this is a coincidence of naming, **not a reliable contract**. Critically, the adapter
  **cannot distinguish this case from the impossible case** by inspecting the snapshot — both appear as
  a plain `name` with no `__{8hex}` suffix.

Additional fragility: detecting the auto-named case relies on pattern-matching the internal
`"{func}__{8hex}"` format, which is a Kedro implementation detail and could change.

### 4.4 Evidence (spaceflights `demo-project`, `__default__` pipeline)

Computed by comparing live `_hash(str(node))` against snapshot-only reconstruction:

```
reconstructable: 19/21   FAILED: 2
ingestion.company_agg    name="company_agg"   func=aggregate_company_data            viz=8de402c1  rebuilt=03bb7bd1  FAIL
ingestion.combine_step   name="combine_step"  func=combine_shuttle_level_information viz=cb5166f3  rebuilt=be681102  FAIL
```

The 2 failures are exactly the `name != func` nodes. The 3 explicitly-named nodes that "pass"
(`apply_types_*`) only pass because the demo named them identically to their function. The 19/21 ratio
is **project-specific** — it is driven entirely by how many nodes use `name=` and whether those names
match the function name. A project that uses descriptive node names will fail for every such node.

### 4.5 Why this cascades (not just an external-API concern)

The node `id` is the **join key** across three subsystems that must agree:

1. The graph (`/api/main`, `/api/pipelines/{id}`).
2. **Run-status / Workflow view:** the run hook computes `node_id = _hash(str(node))` from **live**
   nodes (`integrations/kedro/hooks_utils.py`). If the adapter graph uses a different id, run events no
   longer join to graph nodes. The hook can keep the old scheme (it has live nodes); the adapter
   cannot produce it — so any id change forces a coordinated change of both, to a scheme the snapshot
   adapter can compute.
3. **Saved/exported API files and shared URLs** that embed node ids.

The modular-pipeline tree also references these same task ids internally
(`data_access/repositories/modular_pipelines.py`), so it inherits the same dependency.

### 4.6 Resolution — viz-side IDs, breaking release (Decision D9, agreed with Kedro + Viz teams)

The node ID is a Viz concern, so we will **not** ask Kedro to change `NodeSnapshot`. Instead the
adapter generates IDs Viz-side from identity-defining snapshot fields (the namespaced node name +
inputs/outputs), **excluding tags** so re-tagging never changes an ID. This works for *all* nodes
(including `name != func`) and removes the function-name dependency entirely.

Consequences (accepted as a **breaking release**):
- **Parity is now structural, not byte-identical.** New IDs differ from today's, so the adapter is
  validated on structure (same nodes by name/type, same connectivity, tags, layers, pipelines), not
  on literal ID strings.
- **No internal break:** edges, the modular tree, and `/api/nodes/{id}` stay consistent because all
  IDs come from one place — `integrations/kedro/inspection/ids.py`.
- **Lockstep change required:** the run-status hook (`hooks_utils.hash_node`) must switch to the same
  scheme **when the runtime starts using the adapter (Phase 6)** — not before, or it would break the
  current live backend's run-status. Until then the live path keeps `_hash(str(node))`.
- **One-time losses:** old shared/bookmarked deep-links (`?selected=<id>`), previously exported/
  deployed `api/nodes/<old-id>` files, and committed ID-bearing fixtures — all regenerated/accepted.

---

## 5. Field Mapping (snapshot → Viz) with parity notes

| Kedro-Viz output | Snapshot source | Adapter responsibility / parity note |
| --- | --- | --- |
| Registered pipelines | `ProjectSnapshot.pipelines[*].name` | Direct transform. |
| Task nodes | `PipelineSnapshot.nodes` | Build task nodes; `full_name = snapshot.name`; display name recoverable. |
| Task node **id** | **not derivable** (Section 4) | **Gated on Phase -1 decision.** Isolate in `ids.py`. |
| Data nodes | node `inputs`/`outputs` | Derive unique dataset nodes incl. free inputs and memory outputs. |
| Parameter nodes | inputs named `parameters` / `params:*` | Keep current classification (`is_dataset_param`). |
| Tags | `NodeSnapshot.tags` | Aggregate into Viz tag entities; attach to nodes. |
| `dataset_type` | `DatasetSnapshot.type` (raw string) | **Mismatch:** snapshot `pandas.CSVDataset` vs Viz `pandas.csv_dataset.CSVDataset`. Needs class resolution or an accepted string change. Memory datasets have no snapshot entry → synthesize. |
| Dataset filepath | `DatasetSnapshot.filepath` | **Credentials are redacted** in the snapshot — expect a diff vs current output for credential-bearing URIs. |
| Transcoded datasets | both `name@a`/`name@b` present in snapshot.datasets | Viz collapses to one transcoded node (`dataset_type=None` today). Cover explicitly in parity tests. |
| Edges | not present | Derive `dataset -> task` (inputs) and `task -> dataset` (outputs); add modular edges later. |
| `selected_pipeline` | not present | Keep rule: `__default__` if present, else first pipeline. |
| `layers` + ordering | not present | Keep Viz layer extraction; reuse `services/layers.sort_layers`. |
| `modular_pipelines` tree | `namespace` only | Rebuild tree + set-algebra (Phase 3). |
| Node extras | not present | Keep Viz stats/styles loading + `NodeExtras`. |
| Parameter values / code / previews | not present | Keep live path (Phase 5). |
| Run status | not an inspection concern | Keep run hooks + `/api/run-status`; verify ids match graph ids. |
| Runtime params (`extra_params`) | **no API path** | `get_project_snapshot` cannot accept them; projects whose catalog/params depend on runtime params may diverge from the live graph. Flag + Phase -1 ask. |

---

## 6. Reuse / Remove / Keep

### Reuse or refactor (move behind/inside the adapter)
- `GraphAPIResponse`, `TaskNodeAPIResponse`, `DataNodeAPIResponse`, and related API response models.
- `GraphEdge`, `GraphNodeType`.
- Hash helpers in `kedro_viz.utils`: `_hash`, `_hash_input_output`, `_strip_transcoding`, `is_dataset_param`.
- `NodeExtras` (in `models/metadata.py`) and the stats/styles JSON loading logic (currently split
  across `integrations/kedro/data_loader.py`, `server.py`, and `DataAccessManager.get_extras_for_node`).
- `services/layers.sort_layers()`.
- Most `ModularPipelinesRepository` rules — but this is a **partial rewrite**, not a drop-in: it
  currently imports live `kedro.pipeline.Pipeline`/`Node` and relies on Kedro pipeline set-algebra.
- `save_responses.py` — export/build/deploy still need the same API files.

### Remove or de-emphasize (only after parity)
- Live `Pipeline` traversal as the primary graph source in `DataAccessManager.add_pipelines()`.
- `DataAccessManager.resolve_dataset_factory_patterns()` (note: this lives on **DataAccessManager**,
  not `CatalogRepository`) — the snapshot already resolves referenced factory datasets.
- Direct catalog traversal for dataset type/filepath where the snapshot supplies them.
- Graph construction requiring `KedroNode`/`AbstractDataset` instances for the main graph.
- The global `data_access_manager` singleton as the only state carrier — prefer a per-snapshot
  adapter result (cleaner notebook/reload behavior; aligns with the modularisation "remove singleton" step).

### Keep (Viz-specific; do not push into Kedro inspection)
- React frontend; FastAPI routes serving the Viz app and API.
- Dataset preview endpoints; task preview rendering; node source-code metadata.
- Parameter value metadata (unless Kedro later exposes safe resolved values).
- Layer resolution from `metadata["kedro-viz"]["layer"]`.
- Modular pipeline expand/collapse tree.
- Run-status hooks and `/api/run-status`.
- Deployment and static export flows.
- `LiteParser` — current inspection still needs project dependencies; remove only when Kedro's
  dependency-free inspection lands in the supported range (currently a draft, #5533).
- Notebook visualisation on the live ingest path, until inspection supports in-memory
  `Pipeline`/`DataCatalog` objects (it is project-path only today).

---

## 7. Implementation Phases

### Phase -1 — Kedro asks & decisions (GATING; start immediately, longest lead time)

These must be resolved before Phase 6 (the switch). Open them now, in parallel with Phases 0–1.

1. **Node identity (blocking).** Ask Kedro inspection to add to `NodeSnapshot` either:
   - **Option A (preferred):** `func_name` — Viz keeps its exact existing hash → zero id change.
   - **Option B:** a ready-made stable `id` adopted as canonical by Viz (and other consumers).
   Kedro already holds the live `Node` when building the snapshot (`_node_to_snapshot`), so this is a
   one-line add. (Draft ask: `INSPECTION_NODE_ID_ASK.md`.)
   - **Fallback if declined/slow:** either (a) accept a documented **id break** and migrate graph +
     run hook + saved fixtures in lockstep, or (b) **bridge** — compute ids from live nodes during a
     transition while sourcing structure from the snapshot.
2. **Dataset type.** Decide: ask Kedro to expose the resolved class type, or accept a changed
   `dataset_type` string, or resolve it in Viz (requires importing dataset classes).
3. **Runtime params / conf-source.** Decide whether Viz needs them through inspection; if so, raise it.
4. **Minimum Kedro version.** Pin the first release that ships inspection as the hard prerequisite for
   the adapter path; everything below that floor uses the existing path.

**Exit criteria:** a written decision on item 1 (at minimum), and a pinned min-kedro version.

### Phase 0 — Environment + parity harness

1. **Fix the toolchain:** install a kedro that has `kedro.inspection`; confirm `demo-project` loads and
   `get_project_snapshot()` runs end-to-end (or document the required shims).
2. Build a golden-file parity harness comparing **current backend output** vs **adapter output** for
   the cases in Section 8. Capture current `/api/main` and `/api/pipelines/{id}` as fixtures first.
3. For ids specifically: compare against live-backend ids **and** run-status event ids, and classify
   each node as auto-named / `name==func` / `name!=func` so failures are attributable.

Do not change any production route in this phase.

### Phase 1 — Adapter scaffolding (in parallel, no runtime change)

Create `package/kedro_viz/integrations/kedro/inspection/`:

- `snapshot_source.py` — calls `get_project_snapshot()`. **Local Python API only.** Keep the source
  isolated so a future option could be added, but **do not** implement or assume any remote/REST
  envelope (the HTTP endpoint was reverted, #5570).
- `models.py` — small adapter DTOs/protocols, independent of Kedro internals (isolates version drift).
- `graph_builder.py` — snapshot → Viz repositories / `GraphAPIResponse`.
- `ids.py` — **the single seam** that owns id generation/compatibility. Everything that needs an id
  goes through here, so the Phase -1 outcome changes exactly one module.
- `modular_pipelines.py` — snapshot-based modular tree builder.
- `layers.py` — temporary Viz layer extractor/mapper.

### Phase 2 — Build main graph from snapshot

Implement `/api/main` and `/api/pipelines/{id}` construction from the snapshot: task nodes, data/param
nodes, edges, pipeline membership, tags, dataset type/filepath, node extras. Keep current response
models. Run parity on **everything except the final id commitment** (normalize ids in tests until
Phase -1 lands). Add a feature flag so live-object and snapshot construction can run side by side.

### Phase 3 — Refactor modular-pipeline logic

Refactor `ModularPipelinesRepository` to operate on small protocols:

```python
class NodeLike:      name: str; namespace: str | None; tags: list[str]; inputs: list[str]; outputs: list[str]
class PipelineLike:  name: str; nodes: list[NodeLike]; inputs: list[str]; outputs: list[str]
```

Reproduce the current tree rules: explode namespaces into parent ids; compute modular inputs/outputs by
reproducing Kedro `Pipeline` set-algebra (`sub_pipeline.inputs()/outputs()/all_outputs()`,
`pipeline - sub_pipeline`); add task/data children; add parent-child links; add modular edges; remove
cycle-causing modular edges. **This needs snapshot-side set-algebra helpers** — the protocols alone are
not enough. Tree child ids reuse task ids → depends on Phase -1.

### Phase 4 — Layers

Short term: keep layer extraction in Viz (snapshot has no catalog metadata); prefer a config-based
extractor over materializing `DataCatalog`; reuse `sort_layers()` after dependencies are built.
Medium term: ask Kedro to expose `metadata["kedro-viz"]["layer"]` / catalog metadata, then drop the
live-catalog layer dependency.

### Phase 5 — Node metadata split (`/api/nodes/{id}`) — DECIDED: keep live, defer (D10)

Split conceptually:
- **Snapshot-backed:** inputs, outputs, dataset type, dataset filepath, run commands.
- **Live-object:** task source code, task preview, dataset preview, parameter values, stats.

**Decision (D10):** node metadata stays on the existing **live path** for now; the snapshot-backed
metadata builder is **deferred to Phase 6**, built together with its consumer (lite/snapshot-only mode).
The endpoint is mostly live-only, the snapshot subset is small, and there is no consumer until lite
mode exists — so building it now would be speculative (YAGNI).

When built (Phase 6): snapshot-only mode returns snapshot-backed fields and degrades live-only fields.
The degradation **UX is a product/API decision** — whether the frontend hides missing data, renders
empty values, or shows an explicit "unavailable" state — to settle when lite mode is wired. Full mode
keeps current behavior.

### Phase 6 — Switch runtime path (GATED on Phase -1 item 1 + version pin)

The big "make it real" step: actually wire the adapter into the running server. This is the breaking
release — every node-ID consumer (graph, edges, modular tree, node metadata, run-status, exported
files, deep-link URLs) moves to the new D9 scheme **in lockstep**. Approved as Decisions D11–D14.

#### Design decisions (D11–D14)

- **D11 (D-A) — Integration shape: Option Y via a single `RuntimeDataProvider` abstraction.** The
  adapter already emits `GraphAPIResponse`; serve that directly rather than rebuilding domain
  `GraphNode` objects to refill `data_access_manager`. To avoid spreading flag-conditionals across
  routes, introduce one provider interface with two implementations and have every read path go
  through it. Provider surface (the set of read paths that touch `data_access_manager` today):

  ```
  RuntimeDataProvider:
      get_pipeline_response(pipeline_id) -> GraphAPIResponse | 404
      get_pipeline_ids() -> list[str]
      get_node_ids() -> list[str]
      get_node_metadata(node_id) -> NodeMetadataAPIResponse | 404
      get_run_status() -> RunStatusAPIResponse
      save_responses(out_dir) -> None  # static export uses the same surface
  ```

  - `LiveDataProvider` wraps today's `data_access_manager`-based reads (byte-identical to today).
  - `InspectionAdapterProvider` wraps the adapter (`InspectionGraphBuilder`) + a metadata bridge.
  - Routes, `save_responses`, and the run-status endpoint depend only on the interface.

- **D12 (D-C) — Rollout: behind a feature flag, default OFF.** The flag is **experimental / dev-only**
  until 6.3 (run-status hook) **and** 6.4 (metadata bridge) land; promoted to a user-facing setting
  only after parity is signed off. Old (live) path stays untouched until Phase 7.

- **D13 (D-D) — Mode boundary.**
  - **Full mode** (default; project loaded): snapshot graph + **live** node metadata, bridged to the
    new IDs via an `{new_id → live KedroNode/AbstractDataset}` map.
  - **Lite (snapshot-only) mode** (no live load): snapshot graph + **degraded** snapshot metadata
    (live-only fields null/absent consistently — the deferred D10 metadata is built here).

- **D14 — `extra_params` (runtime params) handling.** `get_project_snapshot(project_path, env)` has
  no runtime-params path, so adapter mode would silently diverge from live behaviour for projects
  whose catalog/parameters depend on runtime params. Until Kedro inspection supports it, the adapter
  is **auto-disabled (transparent fallback to the live path with a clear log line) when
  `extra_params` is non-empty**, and the constraint is documented.

#### Sub-steps (each must keep default behaviour unchanged + full suite green)

- **6.1 — Relocate the ID scheme to a shared module.** Move `task_node_id` / `dataset_node_id` to
  `kedro_viz/integrations/kedro/node_ids.py` so both the adapter and the run-status hook import the
  same implementation. Pure relocation, no behaviour change.
- **6.2a — Build the `RuntimeDataProvider` abstraction + `LiveDataProvider`.** Define the interface;
  implement the live-backed provider that wraps today's `data_access_manager` reads byte-identically.
  No routes wired yet, no flag yet. *(Gate: full suite green; new tests exercise the live provider.)*
- **6.2b — Route diagram endpoints through the provider when the flag is ON.** Add the experimental
  flag (default OFF). When OFF, routes call `LiveDataProvider` (= today's behaviour, byte-identical).
  When ON, routes call `InspectionAdapterProvider` for `/api/main`, `/api/pipelines/{id}`,
  `/api/pipelines` listing, and the 404 branch. *(Gate: flag-OFF byte-identical; flag-ON structural
  parity vs Phase 0 baseline; `--pipeline` honoured; invalid-pipeline 404 preserved. Flag remains
  experimental/internal — not yet user-facing.)*
- **6.3 — Run-status hook lockstep.** Change `hooks_utils.hash_node` to use the shared ID function
  (new scheme), regenerate run-status fixtures. Add a cross-endpoint test: a `/api/main` graph ID
  equals its run-status hook ID. *(Gate: run-status correlates with the new graph IDs.)*
- **6.4 — Node-metadata bridge (full mode).** In `InspectionAdapterProvider.get_node_metadata`,
  resolve the new ID to its live `KedroNode` / `AbstractDataset` (via the precomputed
  `{new_id → live object}` map) and return live metadata. *(Gate: `/api/nodes/{id}` resolves for
  adapter IDs and matches live metadata content.)*
- **6.5 — Static export via the same provider.** `save_responses.py` uses
  `provider.get_node_ids()` + `provider.get_node_metadata()` — no separate export branch. *(Gate:
  exported API file set parity in both modes.)*
- **6.6 — Lite (snapshot-only) mode + the deferred D10 metadata.** Add the "no live load" path,
  build the snapshot-degraded metadata, and settle the frontend degradation UX (hide vs blank vs
  "unavailable"). *(Gate: lite mode serves a coherent graph + degraded metadata.)*
- **6.7 — Regenerate all ID-bearing fixtures, flip default, document the breaking release.** Backend
  (pytest) and frontend (jest snapshot) fixtures; release notes call out: shared/bookmarked deep
  links (`?selected=<old_id>`) become stale; previously-exported sites need re-export; node-ID
  scheme changed. *(Gate: full suite green; cross-endpoint ID-consistency test green.)*

#### Hard gates before flipping the default
- `extra_params` auto-fallback (D14) implemented and documented.
- Cross-endpoint ID-consistency test green (graph ID == metadata key == run-status hook ID).
- `--pipeline` honoured and invalid-pipeline 404 preserved.
- Frontend fixture regeneration coordinated with the frontend team.

#### Out of scope
- Notebook visualisation stays on the live ingest path (it receives in-memory objects).
- Removing the old live-graph path (`DataAccessManager.add_pipelines` etc.) — that's Phase 7,
  after parity is signed off and the flag is flipped.

### Phase 7 — Remove old code (GATED on parity + raised kedro floor)

After parity holds and the kedro floor is raised: remove live pipeline traversal from the main graph
path; remove duplicate factory resolution; reduce `DataAccessManager` to an adapter-owned wrapper or an
immutable adapter result; remove `LiteParser` only once dependency-free inspection is available in range.

---

## 8. Parity Test Matrix

Compare current backend vs adapter output for:

- default pipeline; a selected registered pipeline
- nested namespaces; edge-case modular pipeline tree
- transcoded datasets (`name@a`/`name@b`)
- dataset factory patterns (referenced and unused)
- parameter nodes; unregistered memory outputs
- datasets with no `type` in config; credential-bearing filepaths (redaction)
- `dataset_type` string format
- layers and layer sorting
- node extras from stats/styles files
- **node id classification:** auto-named / `name==func` / `name!=func`
- run-status node id matching; static export + deployer file-set parity

---

## 9. Decision Gates / Go-No-Go

- **Gate A (before Phase 6):** Phase -1 item 1 resolved (func_name/id added, OR break accepted &
  scheduled, OR bridge chosen) **and** min-kedro version pinned.
- **Gate B (before Phase 7):** full parity matrix green on real projects (not just the demo), and the
  kedro floor raised to an inspection-bearing release.
- Phases 0–5 may proceed in parallel **provided** id generation stays isolated in `ids.py` and is not
  hardened around reconstruction assumptions.

---

## 10. Risks & Mitigations

| Risk | Likelihood | Mitigation |
| --- | --- | --- |
| Node ids can't be reconstructed for `name!=func` nodes | **Certain** | Phase -1 ask; `ids.py` seam; do not gate other work on it. |
| Silent wrong ids (heuristic passes on demo, fails on real projects) | High | Classify nodes in parity tests; test real projects, not just the demo. |
| `dataset_type` / filepath / transcoding diffs | Medium | Explicit parity cases; decide normalization vs accepted change. |
| Backend grows before it shrinks (dual path) | Certain | Accept consciously; keep fallback; defer removals to Phase 7. |
| Kedro inspection API drifts across versions | Medium | Pin min version; isolate in `snapshot_source.py` + adapter DTOs. |
| Runtime-params-dependent projects diverge | Low/Medium | Flag limitation; Phase -1 ask. |

---

## 11. Open Questions

1. Will Kedro expose `func_name` or a stable node id on `NodeSnapshot`? (Blocking — Phase -1.)
2. Will Kedro expose resolved dataset class type and/or catalog layer metadata?
3. Should parameter values stay Viz live-only, or be exposed by inspection behind an opt-in?
4. What is the minimum Kedro version that ships inspection (the adapter floor)?
5. Snapshot-only mode UX: hide, blank, or "unavailable" for live-only metadata?

(Remote `/snapshot` is intentionally **not** an open question: it was reverted in #5570 and is out of scope.)

---

## 12. Definition of Done

- `/api/main` matches the baseline **structurally** (same nodes by name/type, connectivity, tags,
  layers, pipelines); node IDs are deliberately new (D9), not byte-identical to today.
- `/api/pipelines/{id}` matches the baseline structurally (same caveat on IDs).
- modular pipeline tree parity covered by tests.
- layer ordering parity covered by tests.
- node IDs use the new viz-side scheme (D9), the change is documented, and graph + run hook + saved
  fixtures are migrated in lockstep (the breaking release).
- static export writes the same API file set; deployer flows upload the same API file set.
- `/api/run-status` node ids still match `/api/main` graph node ids (run hook on the same scheme).
- notebook visualisation keeps working through the existing live ingest path.
- full mode still supports previews, source-code metadata, parameter values, and run status.
- lite/snapshot-only mode has explicit, documented degradation for live-only metadata.
