import { halfPI, snap, angle, compare } from './common';
import { solve, greaterOrEqual, equalTo } from './solver';

const layout = ({ nodes, edges, layers, basisX, spaceX, spaceY }) => {
  const layerConstraints = [];
  const crossingConstraints = [];
  const parallelConstraints = [];
  const parallelSingleConstraints = [];
  const parallelDoubleConstraints = [];
  const separationConstraints = [];
  const snapConstraints = [];

  for (const node of nodes) {
    node.x = 0;
    node.y = 0;
  }

  const rowConstraints = edges.map(edge => ({
    a: edge.targetNode,
    b: edge.sourceNode,
    key: 'y',
    operator: greaterOrEqual,
    target: () => spaceY,
    weightA: () => 0,
    weightB: () => 1,
    required: true
  }));

  if (layers) {
    const layerNames = Object.values(layers);
    let layerNodes = nodes.filter(node => node.layer === layerNames[0]);

    for (let i = 0; i < layerNames.length - 1; i += 1) {
      const layer = layerNames[i];
      const nextLayer = layerNames[i + 1];
      const nextLayerNodes = nodes.filter(node => node.layer === nextLayer);
      const layerNode = { id: layer, x: 0, y: 0 };

      for (const node of layerNodes) {
        layerConstraints.push({
          a: layerNode,
          b: node,
          key: 'y',
          operator: greaterOrEqual,
          target: () => spaceY,
          weightA: () => 0,
          weightB: () => 1,
          required: true
        });
      }

      for (const node of nextLayerNodes) {
        layerConstraints.push({
          a: node,
          b: layerNode,
          key: 'y',
          operator: greaterOrEqual,
          target: () => 0,
          weightA: () => 0,
          weightB: () => 1,
          required: true
        });
      }

      layerNodes = nextLayerNodes;
    }
  }

  solve([...rowConstraints, ...layerConstraints], 1, true);

  const rows = groupByRow(nodes);

  const crossingConstraint = {
    basisX,
    key: 'x',
    operator: crossingOperator,
    target: crossingTarget,
    strength: crossingStrength,
    weightA: () => 0.5,
    weightB: () => 0.5
  };

  for (let i = 0; i < edges.length; i += 1) {
    const edgeA = edges[i];

    for (let j = i + 1; j < edges.length; j += 1) {
      const edgeB = edges[j];

      if (edgeA.source !== edgeB.source) {
        crossingConstraints.push({
          ...crossingConstraint,
          a: edgeA.sourceNode,
          b: edgeB.sourceNode,
          edgeA,
          edgeB
        });
      }

      if (edgeA.target !== edgeB.target) {
        crossingConstraints.push({
          ...crossingConstraint,
          a: edgeA.targetNode,
          b: edgeB.targetNode,
          edgeA,
          edgeB
        });
      }
    }
  }

  for (const edge of edges) {
    const parallelConstraint = {
      a: edge.sourceNode,
      b: edge.targetNode,
      key: 'x',
      operator: equalTo,
      target: () => 0,
      strength: co =>
        1 / Math.max(1, 0.5 * (co.a.targets.length + co.b.sources.length)),
      weightA: () => 0.5,
      weightB: () => 0.5
    };

    parallelConstraints.push(parallelConstraint);

    if (
      edge.sourceNode.targets.length === 1 ||
      edge.targetNode.sources.length === 1
    ) {
      parallelSingleConstraints.push(parallelConstraint);
    }

    if (
      edge.sourceNode.targets.length === 1 &&
      edge.targetNode.sources.length === 1
    ) {
      parallelDoubleConstraints.push(parallelConstraint);
    }
  }

  for (let i = 0; i < 20; i += 1) {
    solve(crossingConstraints, 1);
    solve(parallelConstraints, 1);
    solve(parallelSingleConstraints, 10);
    solve(parallelDoubleConstraints, 10);

    separationConstraints.length = 0;

    for (let l = 0; l < rows.length; l += 1) {
      const rowNodes = rows[l];
      rowNodes.sort((a, b) => compare(a.x, b.x, a.id, b.id));

      for (let j = 0; j < rowNodes.length - 1; j += 1) {
        separationConstraints.push({
          a: rowNodes[j],
          b: rowNodes[j + 1],
          key: 'x',
          operator: (distance, target, delta) => delta <= target,
          target: (ax, bx, co) => -spaceX - co.a.width * 0.5 - co.b.width * 0.5,
          strength: () => 1,
          weightA: () => 0.5,
          weightB: () => 0.5
        });
      }
    }

    solve(separationConstraints, 10);
  }

  for (let l = 0; l < rows.length; l += 1) {
    const rowNodes = rows[l];

    for (let i = 0; i < rowNodes.length - 1; i += 1) {
      const snapSeparation = snap(
        Math.max(
          spaceX + rowNodes[i].width * 0.5 + rowNodes[i + 1].width * 0.5,
          0.8 * (rowNodes[i + 1].x - rowNodes[i].x)
        ),
        spaceX
      );

      snapConstraints.push({
        a: rowNodes[i + 1],
        b: rowNodes[i],
        key: 'x',
        operator: greaterOrEqual,
        target: () => snapSeparation,
        weightA: () => 0,
        weightB: () => 1,
        required: true
      });
    }
  }

  solve([...snapConstraints, ...parallelConstraints], 1, true);

  expandDenseRows(edges, rows, spaceY);

  return rows;
};

const crossingStrength = co => 1 / co.basisX;

const crossingOperator = (distance, target, delta) =>
  target >= 0 ? delta >= target : delta <= target;

const crossingTarget = (ax, bx, co) => {
  const sourceDelta = co.edgeA.sourceNode.x - co.edgeB.sourceNode.x;
  const targetDelta = co.edgeA.targetNode.x - co.edgeB.targetNode.x;
  return sourceDelta + targetDelta < 0 ? -co.basisX : co.basisX;
};

const groupByRow = nodes => {
  const rows = {};

  for (const node of nodes) {
    rows[node.y] = rows[node.y] || [];
    rows[node.y].push(node);
  }

  const rowNumbers = Object.keys(rows);
  rowNumbers.sort((a, b) => a - b);

  const sortedRows = rowNumbers.map(key => rows[key]);
  for (let i = 0; i < sortedRows.length; i += 1) {
    sortedRows[i].sort((a, b) => compare(a.x, b.x, a.id, b.id));

    for (const node of sortedRows[i]) {
      node.row = i;
    }
  }

  return sortedRows;
};

const expandDenseRows = (edges, rows, spaceY) => {
  const densities = rowDensity(edges);
  let currentOffsetY = 0;

  for (let i = 0; i < densities.length; i += 1) {
    const density = densities[i];
    const offsetY = snap(density * spaceY, Math.round(spaceY * 0.25));
    currentOffsetY += offsetY;

    for (const node of rows[i + 1]) {
      node.y += currentOffsetY;
    }
  }
};

const rowDensity = edges => {
  const rows = {};

  for (const edge of edges) {
    const dense =
      Math.abs(angle(edge.targetNode, edge.sourceNode) - halfPI) / halfPI;

    const sourceRow = edge.sourceNode.row;
    const targetRow = edge.targetNode.row - 1;

    rows[sourceRow] = rows[sourceRow] || [0, 0];
    rows[sourceRow][0] += dense;
    rows[sourceRow][1] += 1;

    if (targetRow !== sourceRow) {
      rows[targetRow] = rows[targetRow] || [0, 0];
      rows[targetRow][0] += dense;
      rows[targetRow][1] += 1;
    }
  }

  for (const row in rows) {
    rows[row] = rows[row][0] / (rows[row][1] || 1);
  }

  return Object.values(rows);
};

export { layout, groupByRow };
