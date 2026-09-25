# Kedro-Viz Modularity v1: progress, benefit, and what's left

*Retrospective/analysis companion for PR [#2782](https://github.com/kedro-org/kedro-viz/pull/2782), grounded in the original proposal on issue [#2265](https://github.com/kedro-org/kedro-viz/issues/2265) ([the detailed plan](https://github.com/kedro-org/kedro-viz/issues/2265#issuecomment-4510070959)) and the post-v1 follow-up tracker [#2760](https://github.com/kedro-org/kedro-viz/issues/2760).*

*For the current backend component reference (what `VizProjectContext`, `GraphService`, `GraphBuilder` and the inspection snapshot actually do, and the data-flow diagram), see [`ARCHITECTURE.md`'s Backend Architecture section](/ARCHITECTURE.md#backend-architecture) — that's the canonical, maintained reference. This doc is the "how much did we actually achieve, and is it worth it" analysis that doesn't belong in permanent reference docs.*

---

## 1. So what — what's the actual benefit?

- **The common case got cheaper and safer.** Just opening the graph — `/api/main`, switching pipelines, run status — no longer requires running the project's hooks or resolving every dataset's factory pattern. That's the request 95% of users make 95% of the time, and it no longer touches anything live.
- **Startup no longer blocks on a full live load.** Because of `DeferredDataLoader`, a session that never asks for node metadata or `--save-file` never pays for the live `KedroSession`/`DataCatalog` bootstrap at all.
- **Kedro-Viz stops duplicating Kedro's own introspection.** The plan's stated end-state is "Kedro owns inspection, Kedro-Viz owns visualisation" — this PR is the first real step in Viz no longer having its own from-scratch logic for "walk this pipeline and catalog and figure out what's in it."
- **It unlocked Lite mode improvements and cleaner param handling in the same pass** — e.g. [#2777](https://github.com/kedro-org/kedro-viz/pull/2777) (lite mode against the inspection snapshot) and [#2778](https://github.com/kedro-org/kedro-viz/pull/2778) (`--params` overrides forwarded cleanly into the snapshot at one context boundary, [#2763](https://github.com/kedro-org/kedro-viz/pull/2763)) — both easier to get right against one snapshot-shaped input than against ad-hoc live traversal.
- **It's been parity-tested, not just rewritten.** `package/tests/test_inspection_adapter/` carries recorded baseline JSON for `/api/main` and every pipeline, plus a dedicated 775-line edge-case suite (`test_graph_builder_edge_cases.py`) and a parity harness (`test_inspection_adapter_parity.py`) that diffs old vs. new output. This is why the switch could happen behind an unchanged `GraphAPIResponse` contract with low regression risk to the frontend.

The catch, covered honestly in §4: none of this is realised yet as *less code* — it's realised as *safer code on the common path, running alongside the old code*, which still fully exists.

---

## 2. How much of the original plan did we actually achieve?

The [detailed proposal](https://github.com/kedro-org/kedro-viz/issues/2265#issuecomment-4510070959) laid out a 4-phase plan. Checking it against what's actually in the repo on this branch:

| Phase | Proposed | Delivered |
|---|---|---|
| **1 — Adapter in parallel** | New package `adapters/inspection/` with `snapshot_source.py`, `graph_builder.py`, `ids.py`, `modular_pipelines.py`, `layers.py` | ✅ Done, at `integrations/kedro/inspection/` (different path, same shape) — `modular_pipelines.py` grew into its own sub-package (`boundaries.py`, `index.py`, `tree.py`, `view.py`) because the modular-pipeline set-algebra turned out to need more structure than one file |
| **2 — Parity tests** | Compare old vs. new output for `/api/main`, `/api/pipelines/{id}`, namespaces, transcoded datasets, parameter nodes, factory patterns, layer ordering | ✅ Done, and more thorough than scoped: recorded baseline snapshots + a dedicated edge-case suite |
| **3 — Switch main graph to snapshot** | Use the snapshot for `/api/main` and `/api/pipelines/{id}`, keep live session for metadata/previews | ✅ Done for both — **plus `/api/run-status`**, which wasn't explicitly in this phase's scope. Run status moving to the snapshot too is scope the team added beyond the original ask |
| **4 — Reduce old backend code** | Stop live `Pipeline` traversal for the main graph, reduce `DataAccessManager` responsibilities, remove duplicate dataset-factory resolution | ⏳ **Not started.** `DataAccessManager` is untouched and fully alive — see §3 for exactly who still depends on it |

Looking at the plan's "what Kedro-Viz still needs to add" table item by item, essentially all of it landed: graph node IDs, edges, data/parameter nodes, the modular pipeline tree, layer values and ordering, tags, node extras (stats/styles via `enrichment.py`), and the selected-pipeline fallback rule — all present, all behind the unchanged `GraphAPIResponse` contract the plan asked to preserve.

**Bottom line: the adapter itself (phases 1–3) is essentially fully delivered, arguably slightly ahead of scope. Phase 4 — the actual size/complexity reduction the whole effort was justified by — hasn't started.**

---

## 3. What's left, and how v2/v3 should go

Issue [#2760](https://github.com/kedro-org/kedro-viz/issues/2760) (documenting the architecture after v1) is explicit about this being intentional: *"the dual-path design is an intentional safe stopping point, not the final legacy-removal architecture."* It also names the remaining legacy consumers and links four concrete follow-ups:

| Issue | What it covers | Currently depends on live objects because... |
|---|---|---|
| [#2723](https://github.com/kedro-org/kedro-viz/issues/2723) | Serve task source metadata from the inspection snapshot | `/api/nodes/{id}` (`get_node_metadata_response` in `nodes.py`) still calls `DeferredDataLoader` → `DataAccessManager` for source code, previews, run commands — the snapshot doesn't carry this yet |
| [#2757](https://github.com/kedro-org/kedro-viz/issues/2757) | Migrate NotebookVisualizer and VSCode off live objects | `integrations/notebook/data_loader.py` calls `populate_data`/`DataAccessManager` directly; `pipelines.py::get_kedro_project_json_data` (used by the VSCode extension) does the same via the **legacy** `get_pipeline_response()`, not the new `GraphService` |
| [#2724](https://github.com/kedro-org/kedro-viz/issues/2724) | Remove the legacy graph-building backend | `DataAccessManager`, its repositories, and `pipelines.py::get_pipeline_response()` (the pre-v1 implementation) are still fully intact and reachable |
| [#2688](https://github.com/kedro-org/kedro-viz/issues/2688) | Remove flowchart models once the legacy backend is gone | `models/flowchart/nodes.py` / `node_metadata.py` still import `kedro.pipeline.node.Node` directly — can't go until #2724 lands |

**A gap worth flagging that isn't explicitly named in any of the four:** static export (`--save-file`, `kedro viz deploy`, in `save_responses.py`) currently calls the *legacy* `get_pipeline_response()` and `data_access_manager.nodes.get_node_ids()` directly — it isn't routed through `VizProjectContext`/`GraphService` at all yet. #2724's title ("remove legacy graph-building backend") probably intends to cover this, but since export writes a static, on-disk API surface for shared/embedded Viz, it's easy for it to quietly get missed unless someone explicitly scopes it in. Worth confirming this is in #2724's scope before starting it.

**Two things also aren't purely Viz's to fix.** The plan's own "Limitations" section says the snapshot doesn't yet carry parameter *values* (only keys), layer metadata, task source/preview payloads, dataset previews, or stable Viz IDs. That means #2723 in particular is gated on how much of this Kedro core's inspection API exposes going forward — v2/v3 pace depends partly on the upstream Kedro roadmap, not only on Kedro-Viz engineering time.

**Suggested sequencing:**
- **v2**: land #2723 (node metadata from the snapshot) — this is the last thing gating `/api/nodes/{id}` itself, and closes the biggest remaining REST-API-facing gap. Confirm and fold in the static-export gap above at the same time, since it's the same underlying data.
- **v3**: #2757 (notebook + VSCode) and #2724 (delete `DataAccessManager`/legacy `pipelines.py::get_pipeline_response`) together, followed by #2688 (delete the now-dead flowchart Pydantic models). Re-evaluate `LiteParser` removal only once Kedro ships a dependency-free inspection path, per the plan's own instruction.
- ~~Land #2760's `ARCHITECTURE.md` update now, at the v1 checkpoint~~ — done: `ARCHITECTURE.md`'s Backend Architecture section now documents `VizProjectContext`, `GraphService`, `GraphBuilder`, the inspection snapshot lifecycle, the retained legacy consumers, and a current-state data-flow diagram, with the same "intentional checkpoint, not final" framing.

---

## 4. Is this all worth it?

**Directionally, yes — but the payoff is still owed, not banked.**

The case for "yes": 115 files, +17,263/-1,212 lines and 19 stacked PRs is a large bill, but it bought a properly parity-tested, contract-preserving replacement for the highest-traffic read path in Kedro-Viz, removed a whole class of "why did opening the graph run my hooks" risk, and did it without breaking the frontend contract. It also matches where Kedro itself is heading (a first-party inspection layer), so Viz is now consuming a capability rather than continuing to maintain a shadow copy of it — which is exactly the "second half of 2025 Pipeline Editor" alignment the original spike ([#2265](https://github.com/kedro-org/kedro-viz/issues/2265)) was asked to consider.

The honest caveat: **none of the complexity has actually been removed yet.** Today, Kedro-Viz runs *two* full graph-building systems side by side — the new snapshot-based one for the common path, and the entire old live-object one, unshrunk, for node metadata, static export, notebooks and VSCode. That's strictly more surface area than before this PR, not less, until #2723/#2724/#2757/#2688 land. If those stall — and they depend partly on Kedro core shipping more inspection coverage — Kedro-Viz is left permanently maintaining both systems, which would make this a net complexity *increase* rather than the simplification it's meant to be.

So: worth it *conditionally* on the follow-through actually happening. The most useful thing to do right after merging #2782 isn't declaring victory — it's making sure #2723/#2724/#2757/#2688 stay funded and get a rough timeline.
