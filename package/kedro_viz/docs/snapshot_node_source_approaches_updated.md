# Node source code with the Kedro inspection snapshot API

Design note for the snapshot-adapter backend ([PR #2689](https://github.com/kedro-org/kedro-viz/pull/2689), parent [#2265](https://github.com/kedro-org/kedro-viz/issues/2265)).

**Question:** Should Kedro inspection expose source metadata (node identity, file path, line range, optionally source text), or should source resolution remain Viz-side?

**Related Kedro docs:** [Inspect a Kedro project](https://docs.kedro.org/en/1.5.0/inspect/inspect-project/)

**Status:** Approach 1 is implemented on Kedro branch `feat/add-fun-src-code`. Approach 2 is prototyped on `feat/add-fun-src-api`. Both add `func_name` at the root of `NodeSnapshot`.

---

## Current state

### Live backend (today)

Source code is **not** in the graph payload. It is resolved lazily when the user opens a task node, via `TaskNodeMetadata`, which requires a live `kedro.pipeline.node.Node` with `func` attached:

```python
# package/kedro_viz/models/flowchart/node_metadata.py
@field_validator("code")
@classmethod
def set_code(cls, code):
    func = cls.kedro_node.func
    if inspect.ismethod(func):
        func = func.__func__
    if inspect.isfunction(func):
        code = inspect.getsource(_extract_wrapped_func(func))
        return code
    return None
```

The same pattern applies to `filepath` via `inspect.getfile()`.

### Snapshot API

[`NodeSnapshot`](https://docs.kedro.org/en/1.5.0/api/inspection/kedro.inspection.models/#kedro.inspection.models.NodeSnapshot) in released Kedro carries:

- `name`
- `namespace`
- `tags`
- `inputs`
- `outputs`

Kedro deliberately drops `func` when building the snapshot (`_node_to_snapshot`: func is not included). That matches the inspection goal: read structure without running nodes or loading data.

### PR #2689 (foundation)

Foundation work (`_InspectionSession`, node IDs, parity harness) does not touch source. A parallel Kedro ask surfaced for node IDs: expose `func_name` on `NodeSnapshot` so Viz can reconstruct `str(node)` and avoid a breaking ID change. That field is now part of Approach 1 below.

### Important detail

Graph baselines in the parity harness have no `"code"` field. Source is a **metadata-endpoint** concern (`/api/nodes/{id}`), so it does not need to be in `GET /snapshot` or the main graph response.

---

## Three approaches

### Approach 1 — Kedro populates node identity and source location on the snapshot (recommended)

**What:** Add `func_name` at the **root** of `NodeSnapshot` (identity), and a nested `source` object that carries **only the source location**.

```python
@dataclass
class NodeSourceSnapshot:
    filepath: str        # project-relative path to the source file
    line_start: int      # 1-based first line of the function definition
    line_end: int        # 1-based last line

@dataclass
class NodeSnapshot:
    name: str
    func_name: str                               # NEW, at the root: identity + label + node-ID
    namespace: str | None = None
    tags: list[str] = field(default_factory=list)
    inputs: list[str] = field(default_factory=list)
    outputs: list[str] = field(default_factory=list)
    source: NodeSourceSnapshot | None = None     # NEW: location only, None when unresolvable
```

**How Viz uses it:** On `/api/nodes/{id}`, read the file from disk and slice lines `[start:end]`. Reuse existing decorator-unwrapping logic only if you still need the live callable for edge cases.

**Why Kedro-side, not Viz-side:** Kedro already has live `Node` objects while building the snapshot. It can call `inspect.getfile()` / `inspect.getsourcelines()` once, at snapshot-build time, with the same semantics as today. Viz would otherwise have to re-derive “which function is this node?” from name/inputs/outputs — fragile for namespaces, explicit names, partials, lambdas, and factory-built nodes (the `node_id_report.json` baseline already shows `<lambda>` and `explicit_diff_func` cases).

**Pros**

- Fixes the node-ID problem (the same `func_name` field).
- The line range is computed from the real function object, so it is exact and unambiguous, and it locates lambdas, nested functions, and factory-built functions that a name search cannot.
- Works for Kedro HTTP `GET /snapshot` consumers, not only Viz.
- Keeps snapshot JSON small (location only, no source text).
- Pure file read on the Viz side (no AST parsing, no import) to fetch the code.

**Cons**

- Requires a Kedro release.
- Source text is not in the snapshot, so Viz reads the file (local) or bakes it at build time (build/deploy). This is by design.
- External-library functions have `source = None`, so Viz needs a live-object fallback for their code.
- Line numbers are captured at snapshot time; if a file is edited mid-session they can drift (covered by autoreload at `viz run`; not an issue at build/deploy, where snapshot and bake happen together).

**Verdict:** Best default. Node identity (`func_name`) and source location are structural inspection data; full source text is not, and stays out of the snapshot.

---

### Approach 2 — Kedro exposes a separate optional source API (lazy, on demand)

Status: prototyped on `feat/add-fun-src-api` as `get_node_source(node_name, ..., include_code=True)`.

**What:** Keep `NodeSnapshot` lean. Add one of:

- `get_node_source(project_path, node_name, *, include_code=True) -> NodeSourceSnapshot`
- `get_project_snapshot(..., include_source=False)` where `include_source` only populates source fields (not necessarily inlined into the main snapshot response)
- Kedro HTTP: `GET /snapshot/nodes/{name}/source` (or a query param on the existing server)

**How Viz uses it:** The graph is still built from the snapshot (fast). When the user opens the code panel, Viz calls the source helper for that one node only, the same lazy pattern as today.

**Pros**

- Snapshot stays fast and small for CI, the HTTP server, and Viz graph load.
- Full source text available when needed, including for remote consumers that cannot read the project files.
- Clear separation: structure versus presentation metadata.
- Matches the idea of "some other API to get source code (optional param)".

**Cons**

- Two Kedro APIs to maintain.
- A per-node call may still need project bootstrap plus the pipeline registry (the same cost as today's metadata bridge, but scoped to one node; pass `metadata` to avoid re-bootstrapping on each call).
- The HTTP server needs a new route if you want parity outside Viz.

**Verdict:** Best when you want full `code` strings without bloating `GET /snapshot`, and it is the right answer for remote or self-contained consumers. Pairs well with Approach 1: the snapshot carries `func_name` plus the line range; the optional API returns the text on demand.

---

### Approach 3 — Viz-side resolution from snapshot identity (not recommended as primary)

**What:** Viz receives only `NodeSnapshot` fields, then resolves source itself, for example:

1. Parse `pipeline.py` / `nodes.py` under the project package
2. Match by `node.name` or convention (`name == func_name`)
3. `importlib` the module and `getattr(module, func_name)`
4. Run the existing `inspect.getsource()` logic

**How Viz uses it:** Entirely inside the inspection adapter's metadata path; no Kedro changes.

**Pros**

- No Kedro release dependency.
- Snapshot contract unchanged.

**Cons**

- Cannot reliably recover the source when `node._name != node._func_name`.
- Lambdas, partials, class methods, and pipeline factories are all painful.
- Duplicates Kedro's node resolution logic.
- `--lite` mode makes it worse (mocked imports).
- You would still bootstrap pipelines to find nodes, partially undoing the snapshot migration benefit.

**Verdict:** Reasonable only as a short-term fallback until Kedro adds the fields. Not a long-term design.

---

## Comparison

| | Snapshot size | Kedro change | Reliability | Matches current UX |
|---|---|---|---|---|
| **1. location on snapshot** | Small (path + 2 ints per node) | `func_name` at root + `source` object, always on | High (range from the real function) | Yes (code panel on click; live fallback for external funcs) |
| **2. Lazy source API** | Small | New function or endpoint | High | Yes (full source) |
| **3. Viz-side resolve** | Unchanged | None | Low to medium | Partial |

---

## Recommendation

**Split the concern:**

1. **Kedro inspection populates node identity plus source location.** `func_name` at the root of `NodeSnapshot`, and a `source` object with `filepath`, `line_start`, `line_end` (or `None` when the function cannot be located). This is implemented on `feat/add-fun-src-code`. It belongs in Kedro because it is derived from the live `Node` at snapshot-build time, and it serves both Viz and the [HTTP snapshot endpoint](https://docs.kedro.org/en/1.5.0/inspect/inspect-project/#how-to-access-the-snapshot-through-the-http-server).

2. **Full source text stays out of the default snapshot.** Viz reads the lines from disk (Approach 1). If a consumer needs the text without file access (a remote HTTP client), an optional lazy source call (Approach 2) returns it per node.

3. **Do not make pure Viz-side name resolution the primary path.** It diverges from Kedro for the same reasons already hit on node IDs.

### Practical rollout for the adapter stack

| Phase | Action |
|---|---|
| Now (Foundation / #2689) | No source work needed |
| Kedro ask | `func_name` at the root plus a `source` object (`filepath`, `line_start`, `line_end`) on `NodeSnapshot`, prototyped on branch `feat/add-fun-src-code` and will create a ticket to get this done next sprint. |
| Viz metadata adapter | Replace `TaskNodeMetadata`'s dependency on `kedro_node.func` with the snapshot `source` (file read) plus `func_name`; keep the live-object `inspect` fallback for external functions (`source is None`) and during transition |
| Optional (remote) | `get_node_source(..., include_code=True)` for remote or self-contained consumers |

This keeps PR #2689 focused on foundations while providing a clear Kedro-side ask that doubles as the node-ID fix.

---

## Open questions for Kedro

- Should `func_name` use `Node._func_name` (readable name, handles partials) or `__name__`? now we are using `Node._func_name`.
- How should bound methods, lambdas, and partials be represented when `inspect.getsourcelines` fails?
- Should line ranges refer to the wrapped function or the decorator entry point (match current Viz `_extract_wrapped_func` behaviour)?
- Should the HTTP server expose source location in `GET /snapshot` or only via a dedicated endpoint?
