**Parent issue:** #2265

## Summary

Stand up the adapter package, a thin loader for Kedro's inspection snapshot, the new viz-side node-ID functions, and a harness that captures the current live-backend output as the "answer key" everything else is checked against.

> **Note (updated after the live backend was removed):** the harness captured the live-backend output as the parity oracle *while the adapter was being built*. The live backend has since been deleted (see the runtime-integration ticket #2659), so the captured baseline now serves as the adapter's own regression fixture and `capture_baseline.py` reads from the adapter rather than the live path. `snapshot_source.py` is also extended by later phases (it gains `load_parameters` for `--params` value resolution and lite-mode import stubs). The loader, ID scheme and fixture defined here are otherwise unchanged.

## Why this exists

Everything in tickets 2–7 either builds on or is verified against this work. It's the floor.

## What's in scope

- A new package at `kedro_viz/integrations/kedro/inspection/`.
- `load_snapshot()` and `is_inspection_available()` around `kedro.inspection.get_project_snapshot`.
- `task_node_id()` / `dataset_node_id()` in a shared module both the adapter and the run-status hook can import (the hook switches in ticket 6).
- A capture script that records `/api/main` and `/api/pipelines/{id}` for the demo project as a golden baseline.
- A pytest fixture that restores Kedro's global state after each test module so bootstrapping the demo doesn't leak into other tests.

## Decisions locked in

- Adapter location: `package/kedro_viz/integrations/kedro/inspection/`.
- Minimum Kedro = **1.4.0**. The runtime adapter path will be auto-disabled below that in Phase 6 wiring; today, `load_snapshot()` raises if the inspection API is unavailable.
- Node IDs are a hash of `[name, inputs, outputs]` (JSON-encoded). Tags are deliberately excluded so re-tagging a node never changes its ID.
- ID functions live at `kedro_viz/integrations/kedro/node_ids.py` so the run-status hook can share the same implementation in ticket 6.

## Trade-offs taken

- ID reconstruction from the snapshot is impossible for nodes with an explicit `name=` that differs from the function name (the snapshot doesn't carry the function name). Rather than ask Kedro for a viz-specific field, we chose a new ID scheme and accepted the one-time break.

## Files

```
package/kedro_viz/integrations/kedro/
├── node_ids.py                       (task_node_id, dataset_node_id)
└── inspection/
    ├── __init__.py
    └── snapshot_source.py            (load_snapshot, is_inspection_available,
                                       load_catalog_config)

package/tests/test_inspection_adapter/
├── conftest.py                       (restore Kedro global state)
├── capture_baseline.py               (golden baseline for the demo project)
├── baseline/                         (captured JSON + node-ID report)
├── test_snapshot_source.py
└── test_ids.py
```

## Acceptance

- Full test suite passes.
- The capture script writes a baseline for all six demo pipelines.
- An ad-hoc cross-suite pytest run confirmed the fixture prevents inspection tests from leaking into CLI tests.
