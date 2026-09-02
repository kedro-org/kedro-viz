**Parent issue:** #2265
**Depends on:** #2655, #2656

## Summary

Make `kedro viz run --params=...` work entirely on the snapshot adapter, so the live graph path is no longer needed to serve it. The snapshot stores only parameter *key names* (not values), so after the snapshot loads we make one extra lightweight config-loader call to read the actual parameter values, deep-merge the `--params` runtime overrides on top, and feed those values to the graph builder and the parameter-node metadata.

## Why this exists

`--params` was the one feature that still required the live backend (the inspection snapshot API has no runtime-params route). Resolving parameter values viz-side removes that dependency — it is the critical-path prerequisite for deleting the live graph engine in #2659.

## What `--params` actually affects in kedro-viz

- It does **not** change graph structure — nodes, edges and topology come purely from the pipeline definition and are param-invariant on `kedro>=1.4`.
- It changes only parameter **values**: the `parameters` field on task nodes in `/api/main`, and the parameter values in the detail panel (`/api/nodes/{id}` → `ParametersNodeMetadataAPIResponse.parameters`).

## Approach — config loader for values + runtime overlay

After the snapshot loads, call the same config loader the snapshot uses internally to read `parameters`, then overlay the dotted-key `--params` overrides (e.g. `model_options.test_size=0.3` → `parameters["model_options"]["test_size"] = 0.3`). No `KedroSession`, no hooks, no file I/O, no stale-data risk, and it cannot be disabled. Catalog paths templated on `${runtime_params:...}` are resolved by passing the same `runtime_params` to the catalog-config read.

## Decisions locked in

- **D14 reversed (by D21):** `--params` is served by the adapter, not the live path; the earlier decision to keep the live backend as the runtime-params path no longer applies.
- Parameter values are resolved from the config loader because `ProjectSnapshot.parameters` stores key names only (the docstring is explicit: *values are not stored*).
- A single `params:x` node wraps its value under the param name (`{name: value}`), matching the live `ParametersNodeMetadata` shape; the `parameters` (all) node returns the whole dict.
- Internal naming: Kedro renamed `extra_params` → `runtime_params` at the API level (1.0.0). kedro-viz still uses `extra_params` at the CLI boundary; the adapter stack uses `runtime_params` internally.

## Files

- `package/kedro_viz/integrations/kedro/inspection/snapshot_source.py` — `load_parameters()` (config-loader values) + `_merge_runtime_params()` deep-merge of `--params`; `load_catalog_config()` gains `runtime_params`.
- `package/kedro_viz/integrations/kedro/inspection/graph_builder.py` — task nodes' `parameters` filled from the resolved values.
- `package/kedro_viz/api/inspection_adapter_provider.py` — parameter-node metadata served from the resolved values (param-aware in full and lite mode).
- `package/kedro_viz/server.py` — pass `--params` through to the adapter as `runtime_params`.
- Tests: `package/tests/test_inspection_adapter/test_runtime_params.py`, `package/tests/test_inspection_adapter/test_runtime_params_catalog.py`.

## Acceptance

- `kedro viz run --params model_options.test_size=0.3` reflects the override on the consuming task node in `/api/main` and in that parameter node's `/api/nodes/{id}`.
- The node/edge set is identical with and without `--params` (only values differ).
- A single `params:x` node is keyed by its name (live shape), not a bare value.
- Works in lite mode too (values come from the config loader, not live objects).
