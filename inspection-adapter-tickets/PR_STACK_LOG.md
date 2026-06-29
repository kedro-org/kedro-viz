# Backend v2 — PR Stack Log

> Durable source-of-truth for the **phased-PR rollout** of the inspection-adapter backend (issue #2265).
> Tracks: how we split the work, which branches exist, what's shipped vs pending, and every decision /
> adjustment made along the way. **Update this as each PR lands.**
>
> _Last updated: 2026-06-29._

## 1. Goal

Replace Kedro-Viz's live graph-building backend with a thin adapter over Kedro's inspection snapshot
(`kedro>=1.4.0`), without losing UI functionality (graph, detail panel, run-status, `--params`, lite,
export). Parent issue: **#2265**. Teammate's re-architecture plan: branch `chore/backend_v2_strat` →
`backend_v2_rearchitecture_plan.md`.

The full work was built end-to-end on `feature/snapshot-adapter`; we are now **splitting that one big
diff (~76 files) into a stack of small, reviewable phase-PRs**, each targeting an integration branch.

## 2. Branches

| Branch | Role |
|---|---|
| `main` | Upstream. Untouched until the entire v2 stack is green. |
| `feature/snapshot-adapter` | The full WIP branch — **all** the work + planning docs (this log lives here). We *extract* phase slices from it; it is not merged anywhere directly. |
| `feat/backend_v2` | **Integration base.** Created off `main` (at `5a762183`), empty. **Every phase PR targets this.** Merges to `main` once, at the very end. |
| `snapshot/foundation` | Phase-1 branch → **PR #2689** → `feat/backend_v2`. Delete after merge. |
| `snapshot/<phase>` | Future phase branches — one per phase, each cut from `feat/backend_v2`. |

## 3. Branching strategy (sequential PRs into the integration branch)

1. Cut each phase branch **from `feat/backend_v2`** — **never** from `feature/snapshot-adapter` (that would drag in the whole diff).
2. Populate it with **only that phase's files** (extracted from `feature/snapshot-adapter`), open a PR into `feat/backend_v2`.
3. Review on that PR; reviewer feedback → more commits on the phase branch.
4. Merge phase → `feat/backend_v2`; delete the phase branch.
5. Cut the **next** phase branch from `feat/backend_v2` (now contains the prior phases, so the new PR's diff shows only the new phase).
6. After all phases land and are green → one final `feat/backend_v2` → `main`.

Each PR must be **green on its own**: `ruff check` + `ruff format --check` + `mypy` (prod + tests) + full `pytest package/tests/`.

### 3a. Source of truth & keeping the draft from going stale

Once phase PRs start merging, **`feat/backend_v2` is the canonical, reviewed code — not `feature/snapshot-adapter`.** The work branch is a **frozen draft / design reference** we extract from; we do **not** keep editing it to "stay in sync." Trying to keep both branches identical fights git and creates drift.

**Why a stale draft is safe:** each file lives in exactly one phase, so a review change to a file lands in that file's phase PR → `feat/backend_v2`, and no later phase re-introduces it. The only drift risk is a review change to an *earlier* file's public API that a *later* (not-yet-extracted) file calls — and that is **caught by the gate**: when the later file is extracted onto `feat/backend_v2`, its tests fail and you adapt it in that phase's PR. Nothing breaks silently.

### 3b. Per-phase extraction checklist

1. `git checkout feat/backend_v2 && git pull` — get the latest reviewed truth (incl. merged prior phases).
2. `git checkout -b snapshot/<phase>` — cut **from `feat/backend_v2`**, never from the draft.
3. `git checkout feature/snapshot-adapter -- <this phase's new files>` — first-draft of just those files.
4. Run the gate (ruff + mypy + pytest); adapt to any upstream review changes (the gate shows you what).
5. PR → `feat/backend_v2`; review; merge; delete the phase branch.
6. Update this log (§4 table + §6): mark the phase done, record the extraction commit and any adaptations.

### 3c. Back-port rule (the only time you edit the draft)

For **design-level** review changes that ripple across many later phases (e.g. rename a module, change the ID scheme), back-port into the draft so future extractions start from the corrected design:

```bash
git checkout feature/snapshot-adapter
git checkout feat/backend_v2 -- <reviewed files>   # pull the reviewed version back into the draft
git commit
```

For small, localized review tweaks, skip this — adapt-on-extract (step 4) is enough.

### 3d. Nothing-is-lost guarantees

- The draft (`feature/snapshot-adapter`) is **never deleted** — the full original work is preserved.
- `feat/backend_v2`'s **git history** records every merge (what went in, when, with which review changes).
- This log is the **human map**; per phase, record *"extracted from `feature/snapshot-adapter` @ `<commit>`; review adaptations: …"* so you can always `git diff` the draft vs. the merged version.

## 4. The PR stack (plan)

~8 backend PRs + a frontend handoff + Kedro asks. Order follows build dependency. Branch names for phases 2+ are TBD.

| # | Phase | Issue | Contents | Status |
|---|---|---|---|---|
| 1 | Foundations | #2655 | `snapshot_source`, `node_ids`, parity harness | **PR #2689 — open** |
| 2 | Snapshot → main graph | #2656 | `graph_builder.py` + `test_graph_builder` | pending |
| 3 | Modular pipelines | #2657 | `inspection/modular_pipelines.py` | pending |
| 4 | Layers | #2658 | `inspection/layers.py` + `load_catalog_config` + reuse `sort_layers` | pending |
| 5 | `--params` via adapter | **NEW** (params-overlay) | `load_parameters` / `_merge_runtime_params`, server wiring | pending (prereq for #6) |
| 6 | Runtime + delete live engine | #2659 (rewritten) | adapter-only `data_provider`, router/server wiring; **DELETE** `managers`/repos/`LiveDataProvider`/module response builders | pending |
| 7 | ID lockstep | #2660 | `hooks_utils`, `run_hooks`, `save_responses`, metadata bridge | pending |
| 8 | Lite mode + release | #2661 | lite import stubs, `_snapshot_lookup`, `RELEASE.md` | pending |
| 9 | Slim models | **NEW** (slim-models) | remove dead domain models (`edge`, `RegisteredPipeline`, `belongs_to_pipeline`, `Tag`/`TagsRepository`) | pending |
| — | Tier 1: delete `data_access/` | (decision) | replace the slim `data_access` bridge with a raw-object / small-builder bridge | **DEFERRED — revisit after Foundation** |
| — | Frontend handoff | — | jest snapshots + lite-mode UX | frontend team (`FRONTEND_HANDOFF.md`) |
| — | Kedro asks | — | `func_source` + in-memory snapshot helper | upstream Kedro |

Notes: the #2659 rewrite folds in the live-engine deletion (teammate-plan "Phase 2"). The params-overlay
(phase 5) is a prerequisite for the deletion — keep as its own small PR or fold into #2659. #2659 was
closed by us because its original two-engine framing was reversed (see updated drafts in §9).

## 5. PR #2689 — Foundation (what's in it)

Base: `feat/backend_v2`. **Additive** on top of `main`; the live backend is untouched.

- `package/kedro_viz/integrations/kedro/node_ids.py`
- `package/kedro_viz/integrations/kedro/inspection/__init__.py`
- `package/kedro_viz/integrations/kedro/inspection/snapshot_source.py`
- `package/tests/test_inspection_adapter/`: `__init__.py`, `conftest.py`, `test_snapshot_source.py`,
  `test_ids.py`, `capture_baseline.py`, `baseline/` (`main.json`, `pipelines/*.json`, `node_id_report.json`)

Gate: ruff + ruff format + mypy (prod + tests) clean; full `pytest` **462 passed** (conda `viz-3-14`,
kedro 1.4.0). Commit **authored solely by Jitendra** (no AI attribution — `trailers: []`).

## 6. Adjustments made to extract the Foundation PR (do not lose track)

1. **`inspection/__init__.py` trimmed to Foundation scope.** The final version (on `feature/snapshot-adapter`)
   eagerly re-exports `GraphBuilder` (a later phase) → it cannot import on the Foundation base. On
   `snapshot/foundation` it was replaced with a package marker that re-exports only the snapshot loader +
   node-ID helpers. **Later phases must re-add `GraphBuilder` (and friends) to this `__init__`.**
2. **`capture_baseline.py` shipped in its original live-capturing form** (from commit `5b4523c4`), not the
   current adapter-repointed form — the adapter doesn't exist in Foundation, and capturing the *live*
   output is its Phase-0 purpose.
3. **`feat/backend_v2` created off `main`** (at `5a762183`) and pushed — it did not exist before.
4. **`baseline/node_id_report.json` kept** because `test_ids.py` is hermetic on it.

## 7. Why the baseline / parity harness belongs in Foundation

- **Required:** `test_ids.py` reads `baseline/node_id_report.json` (hermetic) — removing it breaks Foundation's tests.
- **By design (#2655):** Foundation stands up the golden answer key that every later phase is diffed against.
- **Generated together:** `capture_baseline.py` produces both the node-id report (used now) and the graph
  baseline `main.json` / `pipelines/*` (used by #2656+).
- Cost: ~8,200 lines of graph-baseline JSON in the diff (generated data, collapsible in review). The only
  movable piece is the graph baseline → could defer to #2656; `node_id_report.json` + `capture_baseline.py` must stay.

## 8. Hard rules / conventions

- **No Claude/AI co-author or attribution on ANY commit** — author = Jitendra. (Verified per commit: `trailers: []`.)
- Dev/test env: **conda `viz-3-14`** (Python 3.14, kedro 1.4.0 — has the inspection API).
- **Per-PR gate:** ruff + ruff format + mypy (prod + tests) + full `pytest` green.
- Each phase branch is **cut from `feat/backend_v2`**, never from the work branch.

## 9. Deferred decisions / open items

- **Tier 1 — delete `data_access/` entirely:** revisit after Foundation lands. Two variants:
  (a) keep `GraphNode` wrappers + a small bridge builder ≈ **−550 net lines, low risk, no detail-panel parity risk**;
  (b) full raw-object rewrite of `node_metadata.py` ≈ **−1,000 lines but parity-risky**. Both converge once
  Kedro exposes `func_source` (the whole live bridge dies then). Recommendation: (a), as a follow-up.
- **Divergence from the teammate plan:** our impl kept a slimmed `data_access/managers.py` (`add_metadata_nodes`)
  + `GraphNode` wrappers for the metadata bridge; the plan wants `data_access/` gone and the bridge built from
  raw Kedro objects. Reconcile during review. (`data_access/` is verified **bridge-only** now — nothing else uses it.)
- **Issue-text updates — NOT yet applied to GitHub.** Updated bodies for #2655 / #2659 / #2660 / #2661 + two new
  tickets (params-overlay, slim-models) are persisted in `inspection-adapter-tickets/issue-updates/`. Apply
  these to the GitHub issues when ready (single-line prose, copy-paste safe).

## 10. References

- Parent: #2265 · Sub-tasks: #2655–#2661 · Foundation PR: **#2689**
- Teammate plan: branch `chore/backend_v2_strat` → `backend_v2_rearchitecture_plan.md`
- Internal docs: `inspection-adapter-tickets/` — `ARCHITECTURE.md`, `backend_v2_adoption_plan.md`,
  `phase4_deletion_decisions.md`, `FRONTEND_HANDOFF.md`, `phase1_params_test_plan.md`, `issue-updates/`
