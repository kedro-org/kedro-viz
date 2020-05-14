import * as kiwi from 'kiwi.js';

export default (nodes, edges) => {
  if (!nodes.length || !edges.length) {
    return;
  }

  const nodeById = {};

  for (const node of nodes) {
    nodeById[node.id] = node;
    node.targets = [];
    node.sources = [];
  }

  for (const edge of edges) {
    edge.sourceNode = nodeById[edge.source];
    edge.targetNode = nodeById[edge.target];
    edge.sourceNode.targets.push(edge);
    edge.targetNode.sources.push(edge);
  }

  const layerRows = layout({
    nodes,
    edges,
    basisX: 1500,
    spaceX: 16,
    spaceY: 110
  });

  routing({
    nodes,
    edges,
    layerRows,
    spaceX: 26,
    spaceY: 28,
    tension: 0,
    minNodeGap: 40,
    stemUnit: 8,
    stemMinSource: 5,
    stemMinTarget: 5,
    stemMax: 20
  });

  const size = bounds(nodes, 100);

  return {
    graph: () => size,
    nodes: () => nodes.map(node => node.id),
    edges: () => edges.map(edge => edge.id),
    node: id => offsetNode(nodes.find(node => node.id === id), size.min),
    edge: id => offsetEdge(edges.find(edge => edge.id === id), size.min)
  };
};

const compare = (a, b, ...args) => {
  const delta = typeof a === 'string' ? a.localeCompare(b) : a - b;
  return delta !== 0 || args.length === 0 ? delta : compare(...args);
};

const halfPI = Math.PI * 0.5;
const equalTo = kiwi.Operator.Eq;
const greaterThan = kiwi.Operator.Ge;
const subtract = (a, b) => a - b;
const equals = (a, b) => a === b;
const clamp = (value, min, max) =>
  value < min ? min : value > max ? max : value;
const snap = (value, unit) => Math.round(value / unit) * unit;
const distance1d = (a, b) => Math.abs(a - b);
const angle = (a, b) => Math.atan2(a.y - b.y, a.x - b.x);

const nodeLeft = node => node.x - node.width * 0.5;
const nodeRight = node => node.x + node.width * 0.5;
const nodeTop = node => node.y - node.height * 0.5;
const nodeBottom = node => node.y + node.height * 0.5;

const offsetNode = (node, offset) => ({
  ...node,
  x: node.x - offset.x,
  y: node.y - offset.y
});

const offsetEdge = (edge, offset) => ({
  ...edge,
  points: edge.points.map(p => ({ x: p.x - offset.x, y: p.y - offset.y }))
});

const nearestOnLine = (x, y, ax, ay, bx, by) => {
  const dx = bx - ax;
  const dy = by - ay;
  const position = ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy || 1);
  const positionClamped = clamp(position, 0, 1);

  return {
    x: ax + dx * positionClamped,
    y: ay + dy * positionClamped,
    ax,
    ay,
    bx,
    by
  };
};

const bounds = (nodes, padding) => {
  const size = {
    marginx: padding,
    marginy: padding,
    min: { x: Infinity, y: Infinity },
    max: { x: -Infinity, y: -Infinity }
  };

  for (const node of nodes) {
    const x = node.x;
    const y = node.y;
    if (x < size.min.x) size.min.x = x;
    if (x > size.max.x) size.max.x = x;
    if (y < size.min.y) size.min.y = y;
    if (y > size.max.y) size.max.y = y;
  }

  size.width = size.max.x - size.min.x + 2 * padding;
  size.height = size.max.y - size.min.y + 2 * padding;
  size.min.x -= padding;
  size.min.y -= padding;

  return size;
};

const layerDensity = edges => {
  const layers = {};

  for (const edge of edges) {
    const dense = Math.abs(
      (angle(edge.targetNode, edge.sourceNode) - halfPI) / Math.PI
    );

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
    const average = layers[layer][0] / (layers[layer][1] || 1);
    layers[layer] = Math.pow(1 + average, 2) - 1;
  }

  return Object.values(layers);
};

const constrain = (solver, ...args) => {
  const constraint = new kiwi.Constraint(...args);
  solver.addConstraint(constraint);
  return constraint;
};

const solve = (constraints, iterations) => {
  for (let i = 0; i < iterations; i += 1) {
    for (const co of constraints) {
      const delta = (co.delta || subtract)(co.a[co.key], co.b[co.key], co);
      const distance = (co.distance || distance1d)(
        co.a[co.key],
        co.b[co.key],
        co
      );
      const target = co.target(co.a[co.key], co.b[co.key], co, delta, distance);

      if (!(co.operator || equals)(distance, target, delta)) {
        const resolve = (co.strength ? co.strength(co) : 1) * (delta - target);

        let weightA = co.weightA ? co.weightA() : 1;
        let weightB = co.weightB ? co.weightB() : 1;

        weightA = weightA / (weightA + weightB);
        weightB = 1 - weightA;

        co.a[co.key] -= weightA * resolve;
        co.b[co.key] += weightB * resolve;
      }
    }
  }
};

const layout = ({ nodes, edges, basisX, spaceX, spaceY }) => {
  let solver = new kiwi.Solver();

  for (const node of nodes) {
    node.x = 0;
    node.y = 0;
    node.X = new kiwi.Variable();
    node.Y = new kiwi.Variable();
  }

  for (const edge of edges) {
    constrain(
      solver,
      edge.targetNode.Y.minus(edge.sourceNode.Y),
      greaterThan,
      spaceY
    );
  }

  solver.updateVariables();

  const layers = {};

  for (const node of nodes) {
    node.y = node.Y.value();
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
  const singleConstraints = [];
  const doubleConstraints = [];
  const separationConstraints = [];

  const crossingOperator = (distance, target, delta) =>
    target >= 0 ? delta >= target : delta <= target;
  const crossingStrength = co => 1 / co.basisX;
  const crossingTarget = (ax, bx, co) => {
    const sourceDelta = co.edgeA.sourceNode.x - co.edgeB.sourceNode.x;
    const targetDelta = co.edgeA.targetNode.x - co.edgeB.targetNode.x;
    return sourceDelta + targetDelta < 0 ? -co.basisX : co.basisX;
  };

  for (let i = 0; i < edges.length; i += 1) {
    const edgeA = edges[i];

    for (let j = i + 1; j < edges.length; j += 1) {
      const edgeB = edges[j];

      if (edgeA.source !== edgeB.source && edgeA.target !== edgeB.target) {
        const crossingConstraint = {
          target: crossingTarget,
          operator: crossingOperator,
          strength: crossingStrength,
          key: 'x',
          edgeA,
          edgeB,
          basisX
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
    const edgeConstraint = {
      a: edge.sourceNode,
      b: edge.targetNode,
      key: 'x',
      target: () => 0,
      strength: co =>
        1 / Math.max(1, 0.5 * (co.a.targets.length + co.b.sources.length))
    };

    parallelConstraints.push(edgeConstraint);

    if (
      edge.sourceNode.targets.length === 1 ||
      edge.targetNode.sources.length === 1
    ) {
      singleConstraints.push(edgeConstraint);
    }

    if (
      edge.sourceNode.targets.length === 1 &&
      edge.targetNode.sources.length === 1
    ) {
      doubleConstraints.push(edgeConstraint);
    }
  }

  for (let i = 0; i < 20; i += 1) {
    solve(crossingConstraints, 1);
    solve(parallelConstraints, 1);
    solve(singleConstraints, 10);
    solve(doubleConstraints, 10);

    separationConstraints.length = 0;

    for (let l = 0; l < layerRows.length; l += 1) {
      const layerNodes = layerRows[l];
      layerNodes.sort((a, b) => a.x - b.x);

      for (let j = 0; j < layerNodes.length - 1; j += 1) {
        separationConstraints.push({
          a: layerNodes[j],
          b: layerNodes[j + 1],
          key: 'x',
          target: (ax, bx, co) => -spaceX - co.a.width * 0.5 - co.b.width * 0.5,
          operator: (distance, target, delta) => delta <= target,
          strength: () => 1
        });
      }
    }

    solve(separationConstraints, 10);
  }

  solver = new kiwi.Solver();

  for (let l = 0; l < layerRows.length; l += 1) {
    const layerNodes = layerRows[l];

    for (let i = 0; i < layerNodes.length - 1; i += 1) {
      constrain(
        solver,
        layerNodes[i + 1].X.minus(layerNodes[i].X),
        greaterThan,
        snap(
          Math.max(
            spaceX + layerNodes[i].width * 0.5 + layerNodes[i + 1].width * 0.5,
            0.8 * (layerNodes[i + 1].x - layerNodes[i].x)
          ),
          spaceX
        )
      );
    }
  }

  for (const edge of edges) {
    constrain(
      solver,
      edge.sourceNode.X.minus(edge.targetNode.X),
      equalTo,
      0,
      kiwi.Strength.strong
    );
  }

  solver.updateVariables();

  for (const node of nodes) {
    node.x = node.X.value();
    node.y = node.Y.value();
  }

  const densities = layerDensity(edges);
  let densityOffset = 0;

  for (let i = 0; i < densities.length; i += 1) {
    const density = densities[i];
    const separationY = snap(density * spaceY, Math.round(spaceY * 0.5));
    densityOffset += separationY;

    for (const node of layerRows[i + 1]) {
      node.y += densityOffset;
    }
  }

  return layerRows;
};

const routing = ({
  nodes,
  edges,
  layerRows,
  spaceX,
  spaceY,
  tension,
  minNodeGap,
  stemUnit,
  stemMinSource,
  stemMinTarget,
  stemMax
}) => {
  for (const node of nodes) {
    node.targets.sort((a, b) =>
      compare(
        Math.atan2(
          b.sourceNode.y - b.targetNode.y,
          b.sourceNode.x - b.targetNode.x !== 0
            ? b.sourceNode.x - b.targetNode.x
            : (b.targetNode.layer % 2 === 0 ? -1 : 1) *
                Math.pow(b.targetNode.layer - b.sourceNode.layer, 3)
        ),
        Math.atan2(
          a.sourceNode.y - a.targetNode.y,
          a.sourceNode.x - a.targetNode.x !== 0
            ? a.sourceNode.x - a.targetNode.x
            : (a.targetNode.layer % 2 === 0 ? -1 : 1) *
                Math.pow(a.targetNode.layer - a.sourceNode.layer, 3)
        )
      )
    );
  }

  for (const edge of edges) {
    const source = edge.sourceNode;
    const target = edge.targetNode;

    const sourceSeparation = Math.min(
      (0.75 * source.width) / source.targets.length,
      6
    );
    const targetSeparation = Math.min(
      (0.75 * target.width) / target.sources.length,
      10
    );

    const sourceEdgeDistance =
      source.targets.indexOf(edge) - (source.targets.length - 1) * 0.5;
    const targetEdgeDistance =
      target.sources.indexOf(edge) - (target.sources.length - 1) * 0.5;

    const sourceOffsetX = sourceSeparation * sourceEdgeDistance;
    const targetOffsetX = targetSeparation * targetEdgeDistance;

    const startPoint = { x: source.x + sourceOffsetX, y: source.y };
    const endPoint = { x: target.x + targetOffsetX, y: target.y };
    let currentPoint = startPoint;

    edge.points = [];

    for (let l = source.layer + 1; l < target.layer; l += 1) {
      const firstNode = layerRows[l][0];
      let upperPoint = firstNode;
      let nearestDistance = Infinity;

      const row = [
        { ...firstNode, x: Number.MIN_SAFE_INTEGER },
        ...layerRows[l],
        { ...firstNode, x: Number.MAX_SAFE_INTEGER }
      ];

      for (let i = 0; i < row.length - 1; i += 1) {
        const node = row[i];
        const nextNode = row[i + 1];
        const nodeGap = nodeLeft(nextNode) - nodeRight(node);

        if (nodeGap < minNodeGap) continue;

        const gradient =
          (endPoint.x - currentPoint.x) / (endPoint.y - currentPoint.y) || 1;
        const smoothGradient =
          (currentPoint.gradient || gradient) * 0.5 + gradient * 0.5;
        const offsetX = Math.min(spaceX, nodeGap * 0.5);
        const offsetY = nodeTop(node) - spaceY - currentPoint.y;

        const tensionForce =
          tension / Math.pow(distance1d(node.y, endPoint.y), 2);
        const tensionOffset = tensionForce * smoothGradient * offsetY;

        const candidatePoint = nearestOnLine(
          currentPoint.x + tensionOffset,
          currentPoint.y,
          nodeRight(node) + offsetX,
          nodeTop(node) - spaceY,
          nodeLeft(nextNode) - offsetX,
          nodeTop(nextNode) - spaceY
        );

        const distance = distance1d(currentPoint.x, candidatePoint.x);

        if (distance < nearestDistance) {
          nearestDistance = distance;
          upperPoint = candidatePoint;
          upperPoint.gradient = gradient;
        }
      }

      const gradient =
        (endPoint.x - upperPoint.x) / (endPoint.y - upperPoint.y) || 1;
      const smoothGradient = upperPoint.gradient * 0.5 + gradient * 0.5;
      const offsetY = firstNode.height + 2 * spaceY;

      const tensionForce =
        tension / Math.pow(distance1d(upperPoint.y, endPoint.y), 2);
      const tensionOffset = tensionForce * smoothGradient * offsetY;

      const lowerPoint = nearestOnLine(
        upperPoint.x + tensionOffset,
        upperPoint.y,
        upperPoint.ax,
        upperPoint.ay + offsetY,
        upperPoint.bx,
        upperPoint.by + offsetY
      );

      edge.points.push({ x: upperPoint.x + sourceOffsetX, y: upperPoint.y });
      edge.points.push({ x: lowerPoint.x + sourceOffsetX, y: lowerPoint.y });

      currentPoint = {
        x: lowerPoint.x,
        y: lowerPoint.y,
        gradient: smoothGradient
      };
    }
  }

  for (const node of nodes) {
    node.targets.sort((a, b) =>
      compare(
        angle(b.sourceNode, b.points[0] || b.targetNode),
        angle(a.sourceNode, a.points[0] || a.targetNode)
      )
    );
    node.sources.sort((a, b) =>
      compare(
        angle(a.points[a.points.length - 1] || a.sourceNode, a.targetNode),
        angle(b.points[b.points.length - 1] || b.sourceNode, b.targetNode)
      )
    );
  }

  for (const edge of edges) {
    const source = edge.sourceNode;
    const target = edge.targetNode;

    const sourceSeparation = Math.min(
      (0.75 * source.width) / source.targets.length,
      6
    );
    const targetSeparation = Math.min(
      (0.75 * target.width) / target.sources.length,
      10
    );

    const sourceEdgeDistance =
      source.targets.indexOf(edge) - (source.targets.length - 1) * 0.5;
    const targetEdgeDistance =
      target.sources.indexOf(edge) - (target.sources.length - 1) * 0.5;

    const sourceOffsetX = sourceSeparation * sourceEdgeDistance;
    const targetOffsetX = targetSeparation * targetEdgeDistance;

    const sourceOffsetY =
      stemUnit *
      source.targets.length *
      (1 - Math.abs(sourceEdgeDistance) / source.targets.length);

    const targetOffsetY =
      stemUnit *
      target.sources.length *
      (1 - Math.abs(targetEdgeDistance) / target.sources.length);

    const sourcePoints = [
      {
        x: source.x + sourceOffsetX,
        y: source.y + source.height * 0.5
      },
      {
        x: source.x + sourceOffsetX,
        y: source.y + source.height * 0.5 + stemMinSource
      },
      {
        x: source.x + sourceOffsetX,
        y: nodeBottom(source) + stemMinSource + Math.min(sourceOffsetY, stemMax)
      }
    ];

    const targetPoints = [
      {
        x: target.x + targetOffsetX,
        y: nodeTop(target) - stemMinTarget - Math.min(targetOffsetY, stemMax)
      },
      {
        x: target.x + targetOffsetX,
        y: nodeTop(target) - stemMinTarget
      },
      {
        x: target.x + targetOffsetX,
        y: nodeTop(target)
      }
    ];

    edge.points = [...sourcePoints, ...edge.points, ...targetPoints];
  }
};
