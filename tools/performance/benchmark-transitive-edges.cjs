const assert = require('node:assert/strict');
const { performance } = require('node:perf_hooks');
const { loadSelector, fixture } = require('./transitive-edges.cjs');
const baseline = loadSelector(true).resultFunc;
const current = loadSelector().resultFunc;
const median = (values) =>
  [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];

console.log(
  JSON.stringify({
    node: process.version,
    platform: process.platform,
    arch: process.arch,
  })
);
for (const count of [500, 2000, 5000]) {
  const connections = [];
  const disabled = [];
  // Independent three-node chains: hide each middle node, connect visible endpoints.
  for (let i = 0; i + 2 < count; i += 3) {
    connections.push([i, i + 1], [i + 1, i + 2]);
    disabled.push(i + 1);
  }
  const state = fixture(count, connections, disabled);
  const args = [
    state.node.ids,
    state.edge.ids,
    state.node.disabled,
    state.edge.sources,
    state.edge.targets,
    state.focus,
    state.node.modularPipelines,
    state.modularPipeline.visible,
  ];
  assert.equal(
    JSON.stringify(current(...args)),
    JSON.stringify(baseline(...args))
  );
  for (let warmup = 0; warmup < 5; warmup++) {
    baseline(...args);
    current(...args);
  }
  const timings = { baseline: [], current: [] };
  for (let round = 0; round < 15; round++) {
    // Alternate order to reduce warm-cache and scheduling bias. Bypass memoization.
    for (const [name, fn] of round % 2
      ? [
          ['current', current],
          ['baseline', baseline],
        ]
      : [
          ['baseline', baseline],
          ['current', current],
        ]) {
      const start = performance.now();
      fn(...args);
      timings[name].push(performance.now() - start);
    }
  }
  const before = median(timings.baseline),
    after = median(timings.current);
  console.log(
    JSON.stringify({
      nodes: count,
      edges: connections.length,
      output_edges: disabled.length,
      samples: 15,
      before_ms: before,
      after_ms: after,
      speedup: before / after,
    })
  );
}
