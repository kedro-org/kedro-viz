# AI Python Code Review Report

Commit reviewed: `5b4523c48e05b10c4a565c5ee68d04a6bbc6c6eb`

## Verdict

BLOCK

## Summary

This commit adds a snapshot-backed inspection adapter for Kedro-Viz, a runtime provider seam, adapter routing for graph/node/export responses, a new shared node ID scheme, lite-mode snapshot metadata, and a large test/baseline package. The architecture direction is reasonable, but the commit is not mergeable as-is.

Confidence is medium-high. I reviewed the changed production code, tests, fixtures, docs, and generated artifacts. Several adapter tests could not execute in this environment because the installed Kedro is `1.1.1` and the inspection API requires newer Kedro, but that skip behavior is itself an important finding.

Verification performed:

- `git diff --check 187ba433 5b4523c4`: passed.
- `ruff check .` and `ruff format --check .` from `package/`: blocked because installed `ruff 0.7.0` cannot parse repo rule `PLC0415`; `package/test_requirements.txt` pins `ruff==0.13.3`.
- `mypy .` from `package/`: failed on existing/unrelated files (`utils.py`, `data_loader.py`, `launchers/cli/utils.py`, `integrations/notebook/visualizer.py` depending on scope).
- Targeted `mypy` on changed production files still reports pre-existing dependency errors through imports (`utils.py`, `data_loader.py`).
- `pytest tests/test_inspection_adapter tests/test_api/test_data_provider.py tests/test_api/test_rest/test_responses/test_save_responses.py tests/test_server.py`: 54 passed, 85 skipped. The adapter integration tests skipped because `kedro.inspection` is unavailable.
- `pytest tests/test_integrations tests/test_api/test_rest/test_responses`: 194 passed.

## Blocking issues

### 1. Default-on adapter drops existing graph payload fields

- File: `package/kedro_viz/integrations/kedro/inspection/graph_builder.py:166`, `package/kedro_viz/integrations/kedro/inspection/graph_builder.py:173`, `package/kedro_viz/integrations/kedro/inspection/graph_builder.py:185`, `package/kedro_viz/integrations/kedro/inspection/graph_builder.py:215`
- Problem: The adapter graph hardcodes task `parameters={}` and does not attach `node_extras` to task, data, parameter, or modular-pipeline nodes. The live graph path currently enriches nodes with stats/styles via `DataAccessManager.get_extras_for_node()` and resolves task parameters through `add_parameters_to_task_node()`.
- Why it matters: `KEDRO_VIZ_INSPECTION_ADAPTER` is now default-on, so existing graph fields disappear for normal `kedro viz run` users. This is a user-visible regression, not just a lite-mode limitation.
- Suggested fix: In full mode, enrich adapter graph nodes from the existing live repositories/metadata bridge or equivalent live data. Only omit these fields in true snapshot-only lite mode, and add tests that compare representative `node_extras` and task `parameters` against the live graph.

### 2. Run-status IDs no longer match the fallback/live graph path

- File: `package/kedro_viz/integrations/kedro/hooks_utils.py:28`, `package/kedro_viz/api/data_provider.py:160`, `package/kedro_viz/data_access/repositories/modular_pipelines.py:205`, `package/kedro_viz/data_access/repositories/modular_pipelines.py:291`
- Problem: `hash_node()` now emits the new `node_ids.task_node_id()` scheme, but the explicit opt-out path and adapter-build-failure fallback still serve the legacy live graph, whose task IDs are still derived from `_hash(str(node))`.
- Why it matters: Run-status overlays will not correlate with graph nodes whenever users set `KEDRO_VIZ_INSPECTION_ADAPTER=0`, run with `--params`, or hit an adapter construction failure. This breaks the documented fallback path.
- Suggested fix: Either migrate the live graph task IDs to the same shared `node_ids.task_node_id()` scheme before changing `hash_node()`, or keep run-status hashing aligned with the active graph provider. Add an end-to-end test that writes run events and verifies event node IDs overlap the served graph IDs for both adapter and fallback paths.

### 3. Lite-mode adapter failure returns with no populated data

- File: `package/kedro_viz/server.py:62`, `package/kedro_viz/server.py:67`, `package/kedro_viz/server.py:117`
- Problem: In `is_inspection_adapter_enabled() and is_lite and not extra_params`, the live load is skipped before confirming the adapter provider was built. `_configure_inspection_adapter_provider()` catches construction failures, clears the provider, and returns. `load_and_populate_data()` then returns with an empty `data_access_manager`.
- Why it matters: On old Kedro versions, missing inspection support, or any snapshot build error, lite mode silently falls back to an empty live provider instead of a working visualization or a clear error.
- Suggested fix: Build the adapter first and only skip live loading after success. If adapter construction fails, fall through to the existing lite live-load path or raise a clear startup error. Add a unit test for this failure branch.

### 4. Accidental demo-project run artifacts are committed

- File: `demo-project/.viz/kedro_pipeline_events copy.json`, `demo-project/.viz/kedro_pipeline_events.json`, `demo-project/.viz/stats.json`, `demo-project/data/08_reporting/*`, `demo-project/pyproject.toml`
- Problem: The commit adds/modifies generated run outputs, timestamped reporting artifacts, a manual backup file named `kedro_pipeline_events copy.json`, and a generated telemetry `project_id`. `inspection-adapter-tickets/ARCHITECTURE.md:149` explicitly labels these demo outputs as noise.
- Why it matters: These files bloat and obscure the review, create churn from local runs, and make it unclear which JSON files are intended fixtures versus accidental output.
- Suggested fix: Remove accidental demo outputs and the telemetry hunk from the commit. If any generated data is intentional, move it under a test fixture directory with deterministic generation and document it.

### 5. Adapter coverage can silently disappear in the supported test environment

- File: `package/requirements.txt:6`, `package/test_requirements.txt:3`, `package/tests/test_inspection_adapter/test_graph_builder.py:23`, `package/tests/test_inspection_adapter/test_id_lockstep.py:35`
- Problem: Package/test requirements allow `kedro>=1.0.0`, but most adapter tests skip when `kedro.inspection` is unavailable. In this environment with Kedro `1.1.1`, 85 selected adapter tests skipped, including graph parity, metadata bridge, router, export, lite metadata, and ID-lockstep tests.
- Why it matters: CI can report green without testing the new feature. The default-on adapter depends on a newer Kedro API, but the test dependency does not guarantee that API exists.
- Suggested fix: Add a CI job or test extra that installs a Kedro version with `kedro.inspection`; alternatively raise the relevant test dependency for adapter tests. Split hermetic ID tests that do not need inspection into always-running tests.

## Important issues

### 1. Task pipeline membership is keyed too weakly

- File: `package/kedro_viz/integrations/kedro/inspection/graph_builder.py:97`, `package/kedro_viz/integrations/kedro/inspection/graph_builder.py:128`, `package/kedro_viz/integrations/kedro/inspection/graph_builder.py:171`
- Problem: `_task_pipelines` is keyed by `node.name`, while task node identity is now `node.name + inputs + outputs`.
- Why it matters: Two registered pipeline nodes with the same name but different I/O will incorrectly share pipeline membership even though they produce different graph IDs.
- Suggested fix: Key task membership by `node_ids.task_node_id(node.name, node.inputs, node.outputs)`.

### 2. Transcoded dataset type can be lost in the adapter graph

- File: `package/kedro_viz/integrations/kedro/inspection/graph_builder.py:184`, `package/kedro_viz/api/inspection_adapter_provider.py:291`
- Problem: The graph builder registers transcoded datasets under stripped names, but looks up snapshot dataset metadata with `original_name`. The lite metadata path uses the stripped name for lookup.
- Why it matters: Graph `dataset_type` can be `null` for transcoded datasets even when the snapshot has a catalog entry for the base dataset. The committed baseline shows `ingestion.int_typed_shuttles` with `dataset_type: null`.
- Suggested fix: Look up snapshot datasets by stripped name first, with a fallback to the original name if Kedro snapshots expose transcoded entries differently.

### 3. Baseline ID files are inconsistent with the new ID scheme

- File: `package/tests/test_inspection_adapter/baseline/main.json:1268`, `package/tests/test_inspection_adapter/baseline/node_id_report.json:112`, `demo-project/.viz/kedro_pipeline_events.json:16`, `package/tests/test_inspection_adapter/capture_baseline.py:77`
- Problem: The baseline still contains old IDs such as `69c523b6` for `ingestion.apply_types_to_companies`, while the committed run-status artifact uses the new ID `ddf2cb7b`. `capture_baseline.py` now computes IDs using the new generator, but `node_id_report.json` was not regenerated.
- Why it matters: Reviewers and future tests get contradictory evidence about which ID scheme is canonical.
- Suggested fix: Regenerate or clearly split old live-backend baselines from new adapter ID reports, and add assertions that generated reports match `node_ids.py`.

### 4. Docs reference files and release notes that are not present

- File: `inspection-adapter-tickets/ARCHITECTURE.md:87`, `inspection-adapter-tickets/ARCHITECTURE.md:89`
- Problem: The architecture doc says `RELEASE.md` was modified and lists ticket files `01-foundations.md` through `07-lite-mode-and-flip-default.md`, but this commit does not modify `RELEASE.md` and only three files exist under `inspection-adapter-tickets/`.
- Why it matters: The committed docs describe a different branch state and will mislead reviewers.
- Suggested fix: Add the missing release note/docs or remove the references.

## Test gaps

- No test covers lite-mode adapter construction failure falling back to live lite loading.
- No test verifies run-status event IDs against the served graph for the adapter path and fallback/live path.
- Metadata bridge tests are too weak: `test_task_node_metadata_resolves_for_adapter_id` only checks `inputs`/`outputs`, and `test_data_node_metadata_resolves_for_adapter_id` only checks HTTP 200.
- Export tests check file presence, not representative payload correctness or exported `run-status` correlation with exported `api/main`.
- The important adapter tests skip entirely when Kedro inspection is unavailable.
- `snapshot_source.load_snapshot()`'s user-facing `RuntimeError` branch and `load_catalog_config()`'s empty-config branch are not directly tested.
- `baseline/main.json` and `baseline/pipelines/__default__.json` are byte-identical; `_baseline("__default__")` reads `main.json`, so the duplicate baseline is not useful.

## Python best-practice issues

- `server.py:_configure_inspection_adapter_provider()` catches broad `Exception` and treats every provider-construction failure as a fallback. That is intentional for availability, but it hides real adapter bugs unless the fallback path is fully correct.
- `_AdapterProviderHolder.provider` is declared as a class attribute and mutated as instance state. It works, but an explicit `__init__` instance attribute would be clearer.
- Docstrings in new modules contain many phase/decision references and future-tense notes that are already stale in the same commit.
- The current environment's `ruff` and `mypy` failures indicate local tooling is not reproducible unless contributors use the pinned versions from `package/test_requirements.txt`.

## Design / maintainability concerns

- The runtime provider seam is clean, but the adapter is default-on before it reaches live graph parity for existing graph fields.
- Process-global state is expanded with `_adapter_holder` and relies on tests to clear it. This matches existing patterns but increases leakage risk.
- `ModularMembership` and `ModularTreeBuilder` repeatedly scan the node list per modular pipeline. This is acceptable for small graphs but can become expensive on large projects.
- Large planning artifacts (`INSPECTION_ADAPTER_PLAN.md`, `progress.md`, `inspection-adapter-tickets/*`) read like implementation logs. Decide whether they belong in the repo, a wiki, or PR discussion.

## Security concerns

None found in the production Python changes.

- No unsafe `eval`/`exec`.
- No subprocess usage.
- No unsafe YAML loading introduced.
- The SHA-1 based IDs are non-cryptographic graph identifiers, not security-sensitive hashes.

## Performance concerns

- Modular-pipeline membership and tree building do repeated full-node scans. This is not a blocking issue for the demo project, but should be profiled before making the adapter the only path for large projects.
- Snapshot, catalog config, graph builder, metadata bridge, and lite lookup are built once per provider, which is good for request-time performance.

## AI-generated-code smells

- Heavy phase narration in docstrings and docs makes the code read like generated scaffolding rather than settled production code.
- The commit includes a manual backup file and generated local run artifacts.
- Some tests assert shape/presence rather than behavior, which creates a false sense of completeness.
- The committed docs claim missing files/release notes exist.
- The baseline duplication (`main.json` and `pipelines/__default__.json`) adds bulk without extra coverage.

## Good parts

- The `RuntimeDataProvider` protocol is a useful seam and keeps route changes small.
- `save_responses.py` now accepts an injected provider, which makes export behavior testable.
- The shared `node_ids.py` module is a good direction for keeping graph and run-status IDs in lockstep.
- The lite-mode snapshot lookup provides a clear reduced metadata shape.
- Test isolation around Kedro project globals in `test_inspection_adapter/conftest.py` is a strong choice.
- The graph parity tests compare structural graph behavior instead of only snapshotting raw JSON.

## Final recommendation

Do not merge this commit as-is.

Next steps:

1. Restore graph parity for default-on adapter mode by carrying over live `node_extras`, task `parameters`, and representative metadata fields.
2. Fix run-status ID alignment for both adapter and fallback/live graph paths.
3. Fix lite-mode adapter failure handling so it does not return an empty visualization.
4. Remove accidental demo artifacts and the telemetry `project_id` from the commit.
5. Ensure CI actually runs adapter tests with a Kedro version that provides `kedro.inspection`.
6. Add the missing correlation/failure tests and tighten weak metadata/export assertions.
7. Clean stale docs and oversized/duplicated baselines before requesting another review.
