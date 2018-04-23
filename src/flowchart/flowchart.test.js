import React from 'react';
import ReactDOM from 'react-dom';
import Flowchart from './index';

// const getArray = n => Array.from(new Array(n)).map((d, i) => i);

// const flowchart = new Flowchart();

// const data = {
//   layers: getArray(6),
//   nodes: 'QWERTY'.split('').map((d, i) => ({
//     name: d,
//     level: i + 1
//   })),
// };

// data.links = data.nodes.slice(1).map((d, i, arr) => ({
//   source: arr[i],
//   target: arr[i + 1]
// }));

it('calculates the length of paths', () => {
  // flowchart.calculateBuckets(data);
});

// it('calculates complex buckets', () => {
//   const { nodes, links } = data;
//   data.links = [
//     ...links,
//     { source: nodes[0], target: nodes[1] },
//     { source: nodes[0], target: nodes[2] },
//     { source: nodes[0], target: nodes[3] },
//   ];
//   flowchart.calculateBuckets(data);
// });
