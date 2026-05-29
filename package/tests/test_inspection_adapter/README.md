# Inspection Adapter — parity harness (Phase 0)

This directory holds the **golden baseline** of the current (live-object) Kedro-Viz backend output
for the bundled `demo-project`, plus a node-ID classification report. Once the inspection adapter
exists (Phase 1+), its output is diffed against these baselines to prove parity.

See `INSPECTION_ADAPTER_PLAN.md` (repo root) §8 "Parity Test Matrix" and §7 "Phase 0".

## Environment

Everything runs in the **`viz-3-14`** conda env (Python 3.14, kedro 1.4.0 — the first release with
`kedro.inspection`). kedro-viz must be installed editable from this repo.

## Regenerate the baseline

```bash
conda run -n viz-3-14 python package/tests/test_inspection_adapter/capture_baseline.py
```

This writes, under `baseline/`:

- `main.json` — current `/api/main` (default pipeline view), normalized for stable diffs.
- `pipelines/<id>.json` — current `/api/pipelines/{id}` for every registered pipeline.
- `node_id_report.json` — per task-node ID classification:
  - `auto` — no `name=`; function name is embedded in the snapshot name → ID reconstructable.
  - `explicit_eq_func` — `name=` equals the function name → reconstructable *by convention only*.
  - `explicit_diff_func` — `name=` differs from the function name → **ID NOT reconstructable**.
  - also asserts `graph_id == run-status hook id` — both now come from the shared `node_ids`
    scheme (Phase 6.3 switched `hash_node` to that function, closing the reconstructability gap).

Baselines are specific to `demo-project` + the installed kedro; regenerate if either changes.
