# Phase 1 — `--params` Test Plan

> **Done / historical (2026-06-24).** Phase 1 is complete and `--params` now runs through the
> adapter. The live backend has since been deleted (Phase 4 / D21), so the "diff against the live
> backend" principle below no longer applies — the adapter is the source of truth. Current
> `--params` tests live in `package/tests/test_inspection_adapter/test_runtime_params.py`.

**Goal:** prove the adapter serves `kedro viz run --params=...` identically to the old backend.
**Principle:** the live backend is the source of truth — the adapter is "correct" when it produces
the **same** output for the same params. (The live backend is still present in Phase 1, so we can
run both engines in one test and diff them.)

---

## Test files

| File | New/modified | Purpose |
|---|---|---|
| `tests/test_inspection_adapter/test_snapshot_source.py` | modify | Layer 1 — hermetic unit tests for the param-resolution helper (value + type). |
| `tests/test_inspection_adapter/test_runtime_params.py` | **new** | Layer 2 + 3 — live-vs-adapter parity + the overlay-is-the-source isolation test. |
| `tests/test_inspection_adapter/conftest.py` | modify | Add a `runtime_params` parity harness fixture + a small templated/dynamic mini-project fixture. |
| `tests/test_server.py` | modify (**Phase 2**) | Adapter installs under `--params`. |
| `tests/test_inspection_adapter/test_router_flag_on.py` | modify (**Phase 2**) | End-to-end `--params` via FastAPI `TestClient`. |

---

## The parity harness (the core helper)

A single fixture/helper that, for a given `runtime_params`, returns **both** results so tests just
diff them. Mirrors the existing `_populated_demo` pattern in `test_export.py`, but with params.

```python
def live_result(project, runtime_params):
    # the trusted answer (old backend)
    catalog, pipelines, extras = load_data(project, extra_params=runtime_params)
    populate_data(data_access_manager, catalog, pipelines, extras)
    return get_pipeline_response(), {nid: get_node_metadata_response(nid) for nid in ...}

def adapter_result(project, runtime_params):
    # the new answer
    provider = InspectionAdapterProvider(project, runtime_params=runtime_params)
    return provider.get_pipeline_response(), {nid: provider.get_node_metadata_response(nid) for nid in ...}
```

Use the existing `conftest.py` `_restore_kedro_project_state` autouse fixture so the live load
doesn't leak between modules.

---

## Layer 1 — hermetic unit tests (no demo) — *does the override even land?*

In `test_snapshot_source.py`, against a tiny temp project (or a mocked config loader). Target the
new helper in `snapshot_source.py`.

| Test | Asserts |
|---|---|
| `test_param_value_defaults_from_config` | no override → returns the `parameters.yml` value (`test_size == 0.2`). |
| `test_simple_override` | `{"test_size": 0.3}` → resolved value is `0.3`. |
| `test_nested_dotted_override` | `{"model_options.test_size": 0.3}` → `parameters["model_options"]["test_size"] == 0.3`. |
| `test_type_preservation` | int / float / bool / list / dict overrides keep their type (CLI `"0.3"` → float `0.3`, not str). |
| `test_missing_key_is_safe` | overriding a key that doesn't exist doesn't crash; behaviour matches live. |
| `test_multiple_params` | several overrides all apply. |

> Recommended: resolve via `OmegaConfigLoader(runtime_params=...)` so Kedro does coercion; then
> `test_type_preservation` mostly validates we didn't stringify. If a manual overlay is used,
> this layer is where coercion bugs surface.

---

## Layer 2 — parity tests (live vs adapter) — *the gate*

In `test_runtime_params.py`. Each test runs the harness for the **demo and one non-demo project**
and asserts adapter == live.

| Test | Asserts (adapter == live) |
|---|---|
| `test_no_params_still_matches` | with no `--params`, `/api/main` param fields unchanged (regression guard). |
| `test_simple_param_in_main` | `/api/main` task `parameters` for the affected task. |
| `test_nested_param_in_main` | dotted-key override reflected in `/api/main`. |
| `test_param_node_metadata` | `/api/nodes/{param_node_id}` (`ParametersNodeMetadata.parameters`). |
| `test_root_parameters_node` | the root `parameters` node value. |
| `test_single_params_x_node` | a `params:x` single-parameter node. |
| `test_list_and_dict_params` | list/dict param values match (shape + type). |
| `test_static_export_params` | exported `/api/main` + node files carry the overridden values. |

**Edge-case parity — these decide whether Phase 1 passes or we keep the live backend:**

| Test | Asserts |
|---|---|
| `test_catalog_templated_on_runtime_params` | a catalog entry like `filepath: data/${runtime_params:version}/x.csv` → adapter's dataset filepath/type **matches live** under `--params version=02`. |
| `test_pipeline_registry_reads_params` | a pipeline whose nodes/topology depend on a runtime param → adapter graph structure **matches live**. |

> **Gate:** if either edge-case test shows the adapter diverging from live, **stop** — keep the live
> backend for `--params` (Phase 1 "fails" its gate) and fall back to the Kedro ask (Phase 6).

---

## Layer 3 — isolation test — *the overlay is the source, not the bridge*

Critical because in **lite mode there's no bridge**, so params must come from the overlay.

| Test | Asserts |
|---|---|
| `test_params_present_with_empty_bridge` | build the adapter with `runtime_params` **and no populated `data_access_manager`** (empty bridge) → the overridden values still appear in `/api/main` + `/api/nodes/{id}`. Proves the values come from the config-loader overlay, not the live nodes. |

---

## Layer 4 — wiring + end-to-end (**Phase 2**, after the gate passes)

| Test | File | Asserts |
|---|---|---|
| `test_params_installs_adapter` | `test_server.py` | `_configure_inspection_adapter_provider(..., extra_params={...})` now **installs** the adapter (no longer auto-falls-back). |
| `test_client_params_reflected` | `test_router_flag_on.py` | via `TestClient`: `/api/main` and `/api/nodes/{id}` show the overridden value end-to-end. |
| Manual smoke | — | `kedro viz run --params model_options.test_size=0.3` → `curl /api/main` shows `0.3`; UI parameters panel shows `0.3`. |

---

## Fixtures to add (in `conftest.py`)

1. **`runtime_params` parity harness** — the `live_result` / `adapter_result` helpers above.
2. **A templated/dynamic mini-project** — the demo likely has neither a runtime-params-templated
   catalog entry nor a param-driven pipeline, so the two edge-case tests need a small synthetic
   Kedro project (or an extra `conf/` overlay on the demo) that exercises:
   - `catalog.yml` entry with `filepath: .../${runtime_params:version,01}/...`,
   - a `create_pipeline()` that branches on a runtime param.

---

## What "Phase 1 passed" means

All green on the **demo and the non-demo project**:

1. **Layer 1** — overrides land with the right **value and type**.
2. **Layer 2** — adapter `/api/main`, `/api/nodes/{id}`, and export **match the live backend** for
   every param shape, **including the two edge cases** (catalog templating, dynamic pipeline).
3. **Layer 3** — values come from the **overlay** (work with an empty bridge → lite-safe).

If Layer 2's edge cases pass → route `--params` through the adapter (Phase 2). If they diverge →
keep the live backend for `--params`; the rest of the plan (delete the graph engine) still proceeds
for the non-`--params` paths.
