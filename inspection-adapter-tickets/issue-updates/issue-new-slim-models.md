**Parent issue:** #2265
**Depends on:** #2659

## Summary

Remove the internal flowchart-model code that the deleted live graph engine left behind, keeping only what the metadata bridge and the graph builder still use. This is internal cleanup with **no API-contract change** — `/api/main` and `/api/nodes/{id}` come out byte-identical (the parity baseline, graph-shape and export tests stay green).

## Why this exists

After the live graph engine is deleted (#2659), several domain models and helpers are no longer referenced by any live code path. Leaving them in place is confusing dead weight.

## What's removed (verified dead)

- `models/flowchart/edge.py` — the domain `GraphEdge`; the graph now emits `GraphEdgeAPIResponse` (a response model), and the edges repository that used `GraphEdge` is gone.
- `RegisteredPipeline` (`models/flowchart/named_entities.py`) — only the deleted registered-pipelines repository / default-pipeline selection used it.
- `GraphNode.belongs_to_pipeline()` — only the deleted modular-tree traversal used it.
- `Tag` + `TagsRepository` (and the now-orphaned `NamedEntity` base) — the repository was write-only after the deletion (populated during the bridge build but never read; the adapter builds tags from the snapshot).

## What's kept (still needed for the full-mode detail panel)

- `GraphNode` + `TaskNode` / `DataNode` / `TranscodedDataNode` / `ParametersNode`, their `create_*` factory methods, and the `kedro_obj` field — the metadata bridge builds these live node objects so `/api/nodes/{id}` can serve source code, previews, parameter values and stats.
- The four node-metadata models (`TaskNodeMetadata` etc.) and the preview helpers.
- `ModularPipelineNode` / `create_modular_pipeline_node` / `ModularPipelineChild` — plumbing the `ModularPipelinesRepository` uses to give bridge nodes an id + membership.
- `GraphNodeType`, and all API response models.

## Note on scope (vs the re-architecture plan)

The re-architecture plan's "slim models" phase also removes the `GraphNode` factory methods and the `kedro_obj` field, on the assumption that the metadata bridge can be built straight from raw Kedro objects without the `data_access` layer. We did **not** go that far here: we kept a slimmed `data_access/managers.py` (`add_metadata_nodes`) plus the factories to power the bridge, because it reuses already-tested node-building code and let us prove the bridge byte-identical with minimal new code. Going further (delete `data_access` entirely, build the bridge from raw objects) is a separate follow-up — and the whole live bridge disappears anyway once the snapshot exposes node source code (the longer-term Kedro ask).

## Files

- `package/kedro_viz/models/flowchart/edge.py` — deleted.
- `package/kedro_viz/models/flowchart/named_entities.py` — deleted (`Tag` + `NamedEntity` removed; `RegisteredPipeline` already gone).
- `package/kedro_viz/models/flowchart/nodes.py` — `belongs_to_pipeline()` removed.
- `package/kedro_viz/data_access/repositories/tags.py` — deleted.
- `package/kedro_viz/data_access/managers.py` — drop the `TagsRepository` wiring (field + `add_tags` call).
- `package/kedro_viz/data_access/repositories/__init__.py` — drop the `TagsRepository` export.
- Tests: `package/tests/test_data_access/test_managers.py`, `package/tests/test_models/test_flowchart/test_pipeline.py` updated for the removed helpers.

## Acceptance

- `/api/main` and `/api/nodes/{id}` are byte-identical before/after (parity baseline, graph-shape and export tests green).
- `ruff` + `mypy` clean; full test suite green.
- No remaining references to the removed symbols anywhere in the codebase.
