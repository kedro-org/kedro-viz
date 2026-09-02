# Phase 4 — deleting the live graph engine (decisions)

_Date: 2026-06-24._

The inspection adapter is now the **only** graph engine for `kedro viz run`. The old live graph
engine was deleted in full, accepting two known consumer regressions that are **deliberately
deferred** (see below).

## What was deleted

- `LiveDataProvider` (the HTTP live fallback). `get_runtime_data_provider()` now returns the
  installed adapter or **raises** — there is no silent live-graph fallback.
- `DataAccessManager` graph engine: `add_pipelines`, `add_pipeline`, `add_node_input/output`,
  `get_*_for_registered_pipeline`, `create_modular_pipelines_tree_for_registered_pipeline`,
  `get_default_selected_pipeline`, and the `registered_pipelines` / `edges` / `node_dependencies`
  fields.
- Repositories: `RegisteredPipelinesRepository` and `GraphEdgesRepository`.
- Module response builders: `get_pipeline_response` and `get_kedro_project_json_data`
  (`responses/pipelines.py`) and `get_node_metadata_response` (`responses/nodes.py`).
- `server.populate_data` now calls the slim `add_metadata_nodes` (not `add_pipelines`); an adapter
  build failure is raised (fail fast), not degraded.

## What was kept

- The slim metadata-bridge path: `add_catalog`, `add_node`, `add_dataset`,
  `add_parameters_to_task_node`, `add_metadata_nodes`, `resolve_dataset_factory_patterns`, and the
  `GraphNodesRepository` / `ModularPipelinesRepository` / `CatalogRepository` / `TagsRepository`.
- All API response **models** (the adapter and `GraphBuilder` use them).
- `sort_layers` (`services/layers.py`).

## The two consumer decisions (deferred on purpose)

These two depend on the deleted live engine and were **not** migrated in this step — by explicit
decision, to land the deletion now and migrate them as follow-ups.

1. **Notebook (`NotebookVisualizer`) — temporarily disabled.** It builds from an **in-memory**
   `pipeline`+`catalog` with no project path / snapshot, so it can't use the adapter. `_load_viz_data`
   now raises a clear "temporarily unavailable, pending snapshot migration" `NotImplementedError`.
   **Fix later (small/moderate):** build a `ProjectSnapshot` from the in-memory pipeline/catalog and
   feed it to the existing `GraphBuilder` (cleanest if Kedro exposes an in-memory snapshot helper).

2. **VSCode extension — breaks externally (out-of-repo).** It calls `load_and_populate_data` then
   the deleted `get_kedro_project_json_data`. **Fix later (easy):** VSCode passes a **project path**,
   so it can use the adapter directly — reroute its JSON call through
   `get_runtime_data_provider().get_pipeline_response()`. Caveat: node IDs change (the new scheme),
   so the extension's ID-based features must consume the new scheme (coordinate with `vscode-kedro`).

Everything else (static export, `kedro viz build`, deploy, run-status) already goes through the
provider seam and needs no change.

## Tests — reused where it kept depth, deleted where dead

- **Ported → adapter:** the deep graph-shape coverage from the retired live `test_pipelines` route
  tests now lives in `tests/test_inspection_adapter/test_graph_shape.py` (referential integrity of
  edges, the modular-pipeline tree, layers, per-node-type fields) on the demo project.
- **Deleted:** `test_nodes.py` (node metadata — already proven byte-identical), the `LiveDataProvider`
  tests, the live `/api/main` + `/api/pipelines` route tests, `test_get_kedro_project_json_data`,
  `test_metadata_node_index.py`, `test_registered_pipelines.py`, and the edges-repo test.
- **Trimmed/updated:** `test_managers.py` (kept the builder tests, dropped the graph-engine tests,
  added an `add_metadata_nodes` test), `test_server.py`, `test_data_provider.py`, `test_apps.py`,
  `conftest.py` (dropped the live `example_api*` fixtures; `client` is now an app-shell fixture for
  the non-graph endpoints), and `test_runtime_params.py` (adapter-only; no more live diff).
- `capture_baseline.py` repointed from the live builder to the adapter.

## Gate

`ruff check`, `ruff format --check`, `mypy` (kedro_viz + features + tests), and the full
`pytest package/tests/` all pass (**551 passed**) in the `viz-3-14` env.
