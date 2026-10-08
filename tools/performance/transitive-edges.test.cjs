const assert = require('node:assert/strict');
const { test } = require('node:test');
const { loadSelector, fixture } = require('./transitive-edges.cjs');
const current = loadSelector();
const baseline = loadSelector(true);
const plain = (value) => JSON.parse(JSON.stringify(value));

test('hidden diamond preserves unique edge order and endpoints', () => {
  const state = fixture(
    5,
    [
      [0, 1],
      [0, 2],
      [1, 3],
      [2, 3],
      [3, 4],
    ],
    [1, 2, 3]
  );
  assert.deepEqual(plain(current(state)), {
    edgeIDs: ['n0|n4'],
    sources: { 'n0|n4': 'n0' },
    targets: { 'n0|n4': 'n4' },
  });
});

test('no hidden nodes, hidden targets and focused input/output preserve baseline', () => {
  for (const state of [
    fixture(5, [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
    ]),
    fixture(
      5,
      [
        [0, 1],
        [1, 2],
        [2, 3],
        [3, 4],
      ],
      [1, 2],
      null,
      [3]
    ),
    fixture(
      5,
      [
        [0, 1],
        [1, 2],
        [2, 3],
        [3, 4],
      ],
      [1, 2],
      { id: 'inner' }
    ),
  ])
    assert.deepEqual(plain(current(state)), plain(baseline(state)));
});

test('100 seeded DAGs retain exact ordering, filtering, deduplication and memoization', () => {
  let seed = 20261008;
  const random = () =>
    (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 2 ** 32;
  for (let run = 0; run < 100; run++) {
    const connections = [];
    const disabled = [];
    const invisible = [];
    for (let source = 0; source < 40; source++) {
      if (random() < 0.4) disabled.push(source);
      if (random() < 0.15) invisible.push(source);
      for (let target = source + 1; target < 40; target++) {
        if (random() < 0.07) connections.push([source, target]);
      }
    }
    const state = fixture(
      40,
      connections,
      disabled,
      run % 2 ? { id: 'inner' } : null,
      invisible
    );
    assert.deepEqual(plain(current(state)), plain(baseline(state)));
    assert.equal(current(state), current(state));
  }
});
