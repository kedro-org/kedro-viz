# Frontend handoff — inspection adapter

**Parent issue:** #2265
**Companion tickets:** [01](01-foundations.md) – [07](07-lite-mode-and-flip-default.md)
**Backend status:** Done

## What changed on the backend (one minute)

Kedro-Viz no longer rebuilds the graph from a fully-loaded Kedro project. It now reads a lightweight **inspection snapshot** (a feature shipped in `kedro>=1.4.0`) and serves the same `GraphAPIResponse` JSON the frontend already consumes. The contract is the same; **the node IDs are different**.

Two new modes:

- **Full mode** (`kedro viz run`) — graph from the snapshot, detail panel from the loaded project (rich, same as today).
- **Lite mode** (`kedro viz run --lite`) — graph from the snapshot, detail panel from the snapshot too. No project load. Most live-only fields (source code, parameter values, previews, stats) are absent from the response.

Both modes serve the same response shapes — fields just go missing in lite. The API contract is unchanged.

## Backend status

- `/api/main`, `/api/pipelines/{id}` — new-scheme IDs in both modes.
- `/api/nodes/{id}` — rich in full mode (byte-identical to today's response); sparse in lite mode (see shapes below).
- `/api/run-status` — uses the same new-scheme IDs (after the user re-runs `kedro run`).
- Static export (`kedro viz build` / `--save-file`) — carries new-scheme IDs end-to-end.
- The adapter is installed at server startup whenever it can be built. The legacy `data_access_manager`-backed path stays in place as an automatic fallback for the cases the adapter can't cover (`--params`, Kedro too old, snapshot build failure). No user-facing opt-out switch.

## What's owed from the frontend

Three buckets — first two are required, third is optional polish.

### Bucket A — Regenerate jest snapshots + any pinned mock data

**Why:** snapshots that include node IDs will fail. So will any tests that hard-code IDs.

**Steps:**

1. Pull the backend branch.
2. Run the demo project locally with the new backend (see "How to test locally" below) and copy the new `/api/main` / `/api/pipelines/{id}` / `/api/nodes/{id}` responses into the frontend's mock-data files (`*.mock.json` or wherever fixtures live).
3. Run the jest suite. Snapshots will mismatch.
4. Regenerate (`npm test -- -u`).
5. Eyeball the diff. The expected pattern: every changed snapshot shows only an ID swap — same DOM structure, same component tree. **If a snapshot changed in a structural way, that's a regression to investigate**, not just ID drift.
6. Look for `expect(...).toBe("<some hash>")` assertions outside snapshots — `-u` doesn't fix these. Search-and-replace by hand using the new mock data.

**Watch out for:**

- TypeScript types for `/api/nodes/{id}` responses. Several fields that were required (`code: string`, `parameters: object`, `filepath: string`, etc.) need to become optional (`code?: string`) so lite-mode responses type-check. See Bucket B.
- Hand-rolled mock data in component tests that pin specific IDs.

**Order:** do this **after Bucket B**, because Bucket B changes the detail-panel components and you'll otherwise have to regenerate snapshots twice.

### Bucket B — Lite-mode degradation UX

**Why:** in lite mode, `/api/nodes/{id}` returns a sparse payload. Today's detail-panel components probably assume the full set of fields and will render oddly (or crash) when fields are missing. We need to decide how to render the gap.

#### The contract (exact response shapes)

In **lite mode**, the backend omits live-only keys (it does **not** return them as `null`):

```
Task node:
  {
    "inputs": ["x", "y"],
    "outputs": ["z"]
  }
  // gone: code, filepath, parameters, run_command, preview

Data node (catalog-registered):
  {
    "type": "pandas.CSVDataset",
    "filepath": "data/01_raw/companies.csv"
  }
  // gone: run_command, preview, preview_type, stats

Data node (in-memory, no catalog entry):
  {
    "type": "kedro.io.MemoryDataset"
  }

Parameter node:
  {
    "parameters": {}
  }
  // values are not available in lite mode
```

In **full mode** (`kedro viz run` without `--lite`), the responses are identical to today's — no changes.

#### The UX decision the team owns

Three reasonable options. **No code, no UI exists yet — pick one.**

| Option | Pros | Cons |
|---|---|---|
| **Hide missing sections silently** | Cleanest UI; looks intentional | User doesn't know they're missing a feature |
| **Show each section with an "Unavailable in lite mode" label** | Most informative | Visually noisy when many fields are missing |
| **Hybrid: hide sections + persistent mode indicator** (recommended) | User informed once, UI stays clean | One small extra component (the indicator) |

The hybrid pattern: silently hide the missing fields, but show a small persistent indicator somewhere in the app chrome (top bar, sidebar, status corner) that says "Lite mode" and on hover/click explains "Source code, parameter values, previews, and stats aren't available in lite mode."

#### Implementation tasks

- Update detail-panel components to handle missing fields without rendering empty sections:
  - `TaskNodeDetails` (or equivalent) — conditional render on `code`, `parameters`, `filepath`, `run_command`.
  - `DataNodeDetails` — conditional render on `preview`, `stats`, `run_command`.
  - `ParametersNodeDetails` — handle `parameters: {}` (today probably assumes non-empty).
- Update TypeScript types — required → optional for live-only fields.
- Add the mode indicator if going with the hybrid option.
- Add tests covering the lite-mode rendering for each detail-panel type.

#### Open question for the team to answer back

**Do you want the backend to add `mode: "lite" | "full"` to `/api/metadata`?**

- Without it: you infer lite mode from "is the `code` key missing on a task response?"
- With it: explicit signal up-front (the indicator and any branching logic can rely on it from page load).

If yes, we add it — ~10 minutes of backend work, one bullet in the next release notes. Recommend yes if you go with the hybrid mode-indicator approach.

### Bucket C — Optional polish

Three minor things that aren't required but improve the upgrade experience.

1. **Stale deep-link toast.** Pre-upgrade bookmarks like `?selected=<old_id>` won't resolve. Today the frontend probably silently shows no selection; consider a one-time toast on first visit with `?selected=<id_not_in_graph>` explaining the ID scheme changed in this release.
2. **Stale run-status events toast.** If `/api/run-status` returns events whose `node_id`s don't overlap with any node in `/api/main`, that signals a stale `.viz/kedro_pipeline_events.json` file from before the upgrade. The user will see "task nodes appear gray as if skipped." A short toast — "Run status references older node IDs; re-run `kedro run` to refresh" — would save debugging time.
3. **`localStorage` audit.** If the frontend stores any node IDs in localStorage (expanded modular pipelines, last selected node, etc.), pre-upgrade entries reference old IDs. The likely behavior is "silently ignored on next render," which is fine. Worth a 30-minute grep to confirm.

## How to test locally

You need the demo project plus our backend branch.

### Set up a test env

```bash
# 1. New conda env (or use your existing one — just make sure kedro >= 1.4.0)
conda create -n viz-fe-test python=3.11 -y
conda activate viz-fe-test

# 2. Install our kedro-viz checkout
cd <kedro-viz repo>
pip install -e package/

# 3. Build the frontend once so the backend can serve it
npm install
npm run build
```

### Run the two scenarios

```bash
cd demo-project

# Full mode (adapter on top of live load — rich detail panel)
kedro viz run

# Lite mode (adapter only, no live project load — sparse detail panel)
kedro viz run --lite
```

Open `http://127.0.0.1:4141` for each. Click nodes, switch pipelines, observe the detail panel.

### Verify what the backend sends

```bash
# Pretty-print /api/main
curl -s http://127.0.0.1:4141/api/main | python -m json.tool | head -40

# Pretty-print a node's metadata (pick an ID from the previous output)
curl -s http://127.0.0.1:4141/api/nodes/<id> | python -m json.tool
```

## Suggested order of work

1. Pull the backend branch + read this doc + the `RELEASE.md` entry.
2. Confirm the demo flow works locally (full mode + lite mode).
3. Decide on the lite-mode UX (Bucket B); decide whether to ask for `mode` in `/api/metadata`.
4. Implement Bucket B (detail panel + types + tests + optional mode indicator).
5. Implement Bucket A (refresh mock data, regenerate snapshots, eyeball diff).
6. (Optional) implement any of Bucket C you want.
7. Run e2e (Cypress) against the new backend if your e2e suite asserts on specific IDs.
8. Update user-facing docs (URL examples, screenshots) if any include node IDs.

## What backend can do for you on request

- **Add `mode: "lite" | "full"` to `/api/metadata`** — small, ~10 min.
- **A response payload spec doc** — one MD file with the exact shape per node type per mode, if useful for reference while coding.
- **Pair on the integration step** — willing to sit with whoever does the snapshot regen for the first hour, in case anything surprises them.

Ping us on the relevant thread; we'll turn either of these around the same day.

## Checklist for done

- [ ] Jest snapshots regenerated and reviewed.
- [ ] TypeScript types updated for optional live-only fields.
- [ ] Lite-mode UX implemented in detail-panel components.
- [ ] Lite-mode UX decision documented (which option, who decided).
- [ ] Mode indicator added if applicable.
- [ ] Optional toasts decided yes/no.
- [ ] E2E tests updated if they pin IDs.
- [ ] User docs updated for any references to URL formats / node IDs.
- [ ] `kedro viz run` (full mode) and `kedro viz run --lite` both look right end-to-end against the demo project.
