import { halfPI, snap, angle } from './common';
import { greaterThan, solve, equalTo } from './solver';

const layout = ({ nodes, edges, basisX, spaceX, spaceY }) => {
  for (const node of nodes) {
    node.x = 0;
    node.y = 0;
  }

  const layerConstraints = edges.map(edge => ({
    a: edge.targetNode,
    b: edge.sourceNode,
    key: 'y',
    operator: greaterThan,
    target: () => spaceY,
    weightA: () => 0,
    weightB: () => 1,
    required: true
  }));

  solve(layerConstraints, 1, true);

  const layers = {};

  for (const node of nodes) {
    layers[node.y] = layers[node.y] || [];
    layers[node.y].push(node);
  }

  const keys = Object.keys(layers);
  keys.sort((a, b) => a - b);

  const layerRows = keys.map(key => layers[key]);
  for (let i = 0; i < layerRows.length; i += 1) {
    for (const node of layerRows[i]) {
      node.layer = i;
    }
  }

  const crossingConstraints = [];
  const parallelConstraints = [];
  const parallelSingleConstraints = [];
  const parallelDoubleConstraints = [];
  const separationConstraints = [];
  const snapConstraints = [];

  for (let i = 0; i < edges.length; i += 1) {
    const edgeA = edges[i];

    for (let j = i + 1; j < edges.length; j += 1) {
      const edgeB = edges[j];

      if (edgeA.source !== edgeB.source && edgeA.target !== edgeB.target) {
        const crossingConstraint = {
          edgeA,
          edgeB,
          basisX,
          key: 'x',
          operator: crossingOperator,
          target: crossingTarget,
          strength: crossingStrength,
          weightA: () => 0.5,
          weightB: () => 0.5
        };

        crossingConstraints.push(
          {
            ...crossingConstraint,
            a: edgeA.sourceNode,
            b: edgeB.sourceNode
          },
          {
            ...crossingConstraint,
            a: edgeA.targetNode,
            b: edgeB.targetNode
          }
        );
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

    for (let l = 0; l < layerRows.length; l += 1) {
      const layerNodes = layerRows[l];
      layerNodes.sort((a, b) => a.x - b.x);

      for (let j = 0; j < layerNodes.length - 1; j += 1) {
        separationConstraints.push({
          a: layerNodes[j],
          b: layerNodes[j + 1],
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

  for (let l = 0; l < layerRows.length; l += 1) {
    const layerNodes = layerRows[l];

    for (let i = 0; i < layerNodes.length - 1; i += 1) {
      const snapSeparation = snap(
        Math.max(
          spaceX + layerNodes[i].width * 0.5 + layerNodes[i + 1].width * 0.5,
          0.8 * (layerNodes[i + 1].x - layerNodes[i].x)
        ),
        spaceX
      );

      snapConstraints.push({
        a: layerNodes[i + 1],
        b: layerNodes[i],
        key: 'x',
        operator: greaterThan,
        target: () => snapSeparation,
        weightA: () => 0,
        weightB: () => 1,
        required: true
      });
    }
  }

  solve([...snapConstraints, ...parallelConstraints], 1, true);

  const densities = layerDensity(edges);
  let densityOffsetY = 0;

  for (let i = 0; i < densities.length; i += 1) {
    const density = densities[i];
    const offsetY = snap(density * spaceY, Math.round(spaceY * 0.25));
    densityOffsetY += offsetY;

    for (const node of layerRows[i + 1]) {
      node.y += densityOffsetY;
    }
  }

  return layerRows;
};

const crossingStrength = co => 1 / co.basisX;

const crossingOperator = (distance, target, delta) =>
  target >= 0 ? delta >= target : delta <= target;

const crossingTarget = (ax, bx, co) => {
  const sourceDelta = co.edgeA.sourceNode.x - co.edgeB.sourceNode.x;
  const targetDelta = co.edgeA.targetNode.x - co.edgeB.targetNode.x;
  return sourceDelta + targetDelta < 0 ? -co.basisX : co.basisX;
};

const layerDensity = edges => {
  const layers = {};

  for (const edge of edges) {
    const dense =
      Math.abs(angle(edge.targetNode, edge.sourceNode) - halfPI) / halfPI;

    const sourceLayer = edge.sourceNode.layer;
    const targetLayer = edge.targetNode.layer - 1;

    layers[sourceLayer] = layers[sourceLayer] || [0, 0];
    layers[sourceLayer][0] += dense;
    layers[sourceLayer][1] += 1;

    if (targetLayer !== sourceLayer) {
      layers[targetLayer] = layers[targetLayer] || [0, 0];
      layers[targetLayer][0] += dense;
      layers[targetLayer][1] += 1;
    }
  }

  for (const layer in layers) {
    layers[layer] = layers[layer][0] / (layers[layer][1] || 1);
  }

  return Object.values(layers);
};

export { layout };
