# Indexing outgoing edges during transitive-edge traversal

## Change and scope

When nodes are hidden, `getTransitiveEdges` traverses their outgoing edges to
connect visible endpoints. Previously, each expansion scanned the complete
edge list and discarded edges with a different source. This change builds a
source-to-edge index once per selector recomputation, then visits only outgoing
edges. The index retains the input edge order and is populated only when at
least one node is disabled. Filtering, focus-mode rules, deduplication, and
selector output remain unchanged.

The index uses additional memory proportional to the edge count. Path
enumeration and `addNewEdge`'s array-based deduplication remain unchanged, so
this does **not** make the entire algorithm linear. Recursion and the existing
DAG assumption also remain unchanged.

## Measured result

Baseline: `698c325d7ab0159b7e0cc1b2179f333dc9232360` in
[kedro-org/kedro-viz](https://github.com/kedro-org/kedro-viz).

| Nodes | Edges | Output edges | Baseline median (ms) | Indexed median (ms) | Speedup |
| ----: | ----: | -----------: | -------------------: | ------------------: | ------: |
|   500 |   332 |          166 |               3.0245 |              0.6875 |   4.40x |
| 2,000 | 1,332 |          666 |              74.7883 |              5.1772 |  14.45x |
| 5,000 | 3,332 |        1,666 |             484.4481 |             38.6160 |  12.55x |

Measured on October 8, 2026, using Node.js v24.19.0 (Windows x64). Each fixture
contains independent three-node chains with the middle node hidden. Both
implementations receive identical arguments; output equality is checked before
timing. Five warmup iterations precede 15 measured iterations, alternating
baseline/candidate order. The benchmark invokes the real selector's
`resultFunc`, bypassing memoized cache hits.

These are **selector recomputation measurements**, not API, layout, React/SVG
rendering, browser latency, or end-to-end speedups. The synthetic workload is
deliberately simple and does not establish performance on every DAG shape.

## Hardware and environment

The hardware inventory was collected after the original benchmark on the same
day; it describes the guest environment, not dedicated physical resources.

- Reported CPU: Intel Xeon Gold 6348 at 2.60 GHz; 4 guest logical CPUs.
- Guest RAM: 17,178,677,248 bytes (approximately 16 GiB).
- OS: Windows 11 Enterprise, version 10.0.26100, x64.
- Hypervisor present: true; this is a virtualized environment.
- Storage: 200 GiB virtual SAS disk reported as SSD. This is not a guarantee
  of physical storage characteristics; the measured selector operates in memory.
- Runtime: Node.js v24.19.0; Reselect 4.1.8 for the isolated tests.
- No CUDA or GPU path was tested or used.

## Reproduction and validation

From a repository checkout containing the baseline commit, with Node.js 24,
Git, and pnpm available:

```sh
mkdir .perf-tools
pnpm --dir .perf-tools add reselect@4.1.8
node --test tools/performance/transitive-edges.test.cjs
node tools/performance/benchmark-transitive-edges.cjs
```

Alternatively, the scripts resolve Reselect from the root `node_modules` after
the normal project dependency installation. The isolated `.perf-tools` directory
is local tooling, not a product dependency change; do not commit it.

The harness loads the production selector source in a VM using real Reselect,
substituting only dependency selectors with fixture-state accessors. It loads
the baseline source through `git show`; it does not maintain a separate copy of
the candidate algorithm. Three Node tests pass, covering:

- A hidden diamond with converging paths and unique output endpoints.
- No hidden nodes, invisible destinations, and focused input/output filtering.
- Exact ordered output equivalence for 100 deterministic DAGs and selector
  memoization by identity.

An additional regression case is included in the existing Jest edge-selector
suite. Prettier formatting and `git diff --check` passed. The complete upstream
Jest/Cypress suites, product build, and browser QA were not run locally; this
change is submitted as a draft pending those checks. The Node harness bypasses
unrelated React/layout imports and is not a substitute for integration QA.

Before promotion, run the upstream suites and browser QA with representative
pipelines, including focus and node filters. Profile selector, layout, and
painting separately before making any end-to-end performance claim.
