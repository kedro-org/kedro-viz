// Load the real selector without the unrelated React/layout import graph.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { execFileSync } = require('node:child_process');
const root = path.resolve(__dirname, '../..');
const { createSelector } = require(require.resolve('reselect', {
  paths: [path.join(root, '.perf-tools'), root],
}));

function loadSelector(baseline = false) {
  const source = baseline
    ? execFileSync(
        'git',
        [
          'show',
          '698c325d7ab0159b7e0cc1b2179f333dc9232360:src/selectors/edges.js',
        ],
        { cwd: root, encoding: 'utf8' }
      )
    : fs.readFileSync(path.join(root, 'src/selectors/edges.js'), 'utf8');
  const context = {
    createSelector,
    getNodeDisabled: (state) => state.node.disabled,
    getEdgeDisabled: () => ({}),
    getFocusedModularPipeline: (state) => state.focus,
  };
  vm.runInNewContext(
    source
      .replace(/^import .*;\r?\n/gm, '')
      .replace(/export const /g, 'const ') +
      '\nthis.selector = getTransitiveEdges;',
    context
  );
  return context.selector;
}

function fixture(
  count,
  connections,
  disabled = [],
  focus = null,
  invisible = []
) {
  const ids = Array.from({ length: count }, (_, index) => `n${index}`);
  const edge = { ids: [], sources: {}, targets: {} };
  connections.forEach(([source, target], index) => {
    const id = `e${index}`;
    edge.ids.push(id);
    edge.sources[id] = ids[source];
    edge.targets[id] = ids[target];
  });
  return {
    node: {
      ids,
      disabled: Object.fromEntries(disabled.map((id) => [ids[id], true])),
      modularPipelines: Object.fromEntries(
        ids.map((id, index) => [id, index % 2 ? ['inner'] : []])
      ),
    },
    edge,
    focus,
    modularPipeline: {
      visible: Object.fromEntries(
        ids.map((id, index) => [id, !invisible.includes(index)])
      ),
    },
  };
}

module.exports = { loadSelector, fixture };
