# Node source code with the Kedro inspection snapshot API

Design note for the snapshot-adapter backend ([PR #2689](https://github.com/kedro-org/kedro-viz/pull/2689), parent [#2265](https://github.com/kedro-org/kedro-viz/issues/2265)).

**Question:** Should Kedro inspection expose optional source metadata (source text, file path, line range), or should source resolution remain Viz-side?

**Related Kedro docs:** [Inspect a Kedro project](https://docs.kedro.org/en/1.5.0/inspect/inspect-project/)

---

## Current state

### Live backend (today)

Source code is **not** in the graph payload. It is resolved **lazily** when the user opens a task node, via `TaskNodeMetadata`, which requires a live `kedro.pipeline.node.Node` with `func` attached:

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

[`NodeSnapshot`](https://docs.kedro.org/en/1.5.0/api/inspection/kedro.inspection.models/#kedro.inspection.models.NodeSnapshot) carries:

- `name`
- `namespace`
- `tags`
- `inputs`
- `outputs`

Kedro deliberately drops `func` when building the snapshot (`_node_to_snapshot`: func is not included). That matches the inspection goal: read structure without running nodes or loading data.

### PR #2689 (foundation)

Foundation work (`_InspectionSession`, node IDs, parity harness) does not touch source yet. A parallel Kedro ask already surfaced for node IDs: expose `func_name` on `NodeSnapshot` so Viz can reconstruct `str(node)` and avoid a breaking ID change.

### Important detail

Graph baselines in the parity harness have no `"code"` field. Source is a **metadata-endpoint** concern (`/api/nodes/{id}`), so it does not need to be in `GET /snapshot` or the main graph response.

---

## Three approaches

### Approach 1 — Kedro exposes source **location** on the snapshot (recommended baseline)

**What:** Extend `NodeSnapshot` with lightweight, serializable fields:

```python
@dataclass
class NodeSnapshot:
    name: str
    namespace: str | None = None
    tags: list[str] = field(default_factory=list)
    inputs: list[str] = field(default_factory=list)
    outputs: list[str] = field(default_factory=list)
    # new
    func_name: str | None = None
    source_filepath: str | None = None      # project-relative
    source_line_start: int | None = None
    source_line_end: int | None = None
```

**How Viz uses it:** On `/api/nodes/{id}`, read the file from disk and slice lines `[start:end]`. Reuse existing decorator-unwrapping logic only if you still need the live callable for edge cases.

**Why Kedro-side, not Viz-side:** Kedro already has live `Node` objects while building the snapshot. It can call `inspect.getfile()` / `inspect.getsourcelines()` once, at snapshot-build time, with the same semantics as today. Viz would otherwise have to re-derive “which function is this node?” from name/inputs/outputs — fragile for namespaces, explicit names, partials, lambdas, and factory-built nodes (the `node_id_report.json` baseline already shows `<lambda>` and `explicit_diff_func` cases).

**Pros**

- Aligns with tech design (“ref and line number”, maybe `func_name`)
- Also fixes the node-ID problem (same `func_name` field)
- Works for Kedro HTTP `GET /snapshot` consumers, not only Viz
- Keeps snapshot JSON small (no full source text)

**Cons**

- Requires a Kedro release
- `inspect` edge cases (partials, bound methods, dynamically created functions) still need handling — but Kedro is the right owner since it already owns `Node._func_name`

**Verdict:** Best default. Location metadata is structural inspection data; full source text is not.

---

### Approach 2 — Kedro exposes a **separate optional source API** (lazy, on demand)

**What:** Keep `NodeSnapshot` lean. Add one of:

- `get_node_source(project_path, node_name, *, include_code=True) -> NodeSourceSnapshot`
- `get_project_snapshot(..., include_source=False)` where `include_source` only populates source fields (not necessarily inlined into the main snapshot response)
- Kedro HTTP: `GET /snapshot/nodes/{name}/source` (or query param on existing server)

**How Viz uses it:** Graph still built from snapshot (fast). When user opens the code panel, Viz calls the source helper for that one node only — same lazy pattern as today.

**Pros**

- Snapshot stays fast and small for CI, HTTP server, and Viz graph load
- Full source text available when needed
- Clear separation: structure vs. presentation metadata
- Matches the idea of “some other API to get source code (optional param)”

**Cons**

- Two Kedro APIs to maintain
- Per-node call may still need project bootstrap + pipeline registry (same cost as today’s metadata bridge, but scoped to one node)
- HTTP server needs a new route if you want parity outside Viz

**Verdict:** Best if you want **full `code` strings** without bloating `GET /snapshot`. Pairs well with Approach 1: snapshot carries `func_name` + line range; optional API carries full text for hard cases.

---

### Approach 3 — **Viz-side resolution** from snapshot identity (not recommended as primary)

**What:** Viz receives only `NodeSnapshot` fields, then resolves source itself, e.g.:

1. Parse `pipeline.py` / `nodes.py` under the project package
2. Match by `node.name` or convention (`name == func_name`)
3. `importlib` the module and `getattr(module, func_name)`
4. Run existing `inspect.getsource()` logic

**How Viz uses it:** Entirely inside the inspection adapter’s metadata path; no Kedro changes.

**Pros**

- No Kedro release dependency
- Snapshot contract unchanged

**Cons**

- **Cannot reliably recover `func_name`** when `node._name != node._func_name` (baseline labels these `id_reconstructable_from_snapshot: false`)
- Lambdas, partials, class methods, pipeline factories — all painful
- Duplicates Kedro’s node resolution logic
- `--lite` mode makes it worse (mocked imports)
- You would still bootstrap pipelines to find nodes — partially undoing the snapshot migration benefit

**Verdict:** Reasonable only as a **short-term fallback** until Kedro adds `func_name`. Not a long-term design.

---

## Comparison

| | Snapshot size | Kedro change | Reliability | Matches current UX |
|---|---|---|---|---|
| **1. Location on snapshot** | Small | `func_name` + file/line | High | Yes (code panel on click) |
| **2. Lazy source API** | Small | New function/endpoint | High | Yes (full source) |
| **3. Viz-side resolve** | Unchanged | None | Low–medium | Partial |

---

## Recommendation

**Split the concern:**

1. **Kedro inspection should expose source _location_ metadata** (`func_name`, `source_filepath`, `source_line_start`, `source_line_end`). This belongs in Kedro because it is derived from the live `Node` at snapshot-build time and serves both Viz and the [HTTP snapshot endpoint](https://docs.kedro.org/en/1.5.0/inspect/inspect-project/#how-to-access-the-snapshot-through-the-http-server).

2. **Full source _text_ should stay out of the default snapshot** — either Viz reads lines from disk (Approach 1), or Kedro offers an optional lazy source call (Approach 2) for cases where line-slicing is not enough (decorators, generated code).

3. **Do not make pure Viz-side name resolution the primary path** — it will diverge from Kedro for the same reasons already hit on node IDs.

### Practical rollout for the adapter stack

| Phase | Action |
|---|---|
| Now (Foundation / #2689) | No source work needed |
| Next Kedro ask | `func_name` + `source_filepath` + line range on `NodeSnapshot` |
| Viz metadata adapter | Replace `TaskNodeMetadata`’s dependency on `kedro_node.func` with snapshot fields + file read; keep `inspect` fallback for edge cases during transition |
| Optional later | `get_node_source(..., include_code=True)` if file slicing is insufficient |

This keeps PR #2689 focused on foundations while providing a clear Kedro-side ask that doubles as the node-ID fix.

---

## Open questions for Kedro

- Should `func_name` use `Node._func_name` (readable name, handles partials) or `__name__`?
- How should bound methods, lambdas, and partials be represented when `inspect.getsourcelines` fails?
- Should line ranges refer to the wrapped function or the decorator entry point (match current Viz `_extract_wrapped_func` behaviour)?
- Should the HTTP server expose source location in `GET /snapshot` or only via a dedicated endpoint?
