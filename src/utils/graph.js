import * as kiwi from 'kiwi.js';

const isEq = kiwi.Operator.Eq;
const isGe = kiwi.Operator.Ge;

const graph = (nodes, edges) => {
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

  const layerRows = layout(nodes, edges, 1500, 16, 110);
  routing(nodes, edges, layerRows, 26, 28, 35, 40, 8, 4, 5, 20);

  const size = sizeOf(nodes, 100);

  return {
    graph: () => size,
    nodes: () => nodes.map(node => node.id),
    edges: () => edges.map(edge => edge.id),
    node: id => offsetNode(nodes.find(node => node.id === id), size.min),
    edge: id => offsetEdge(edges.find(edge => edge.id === id), size.min)
  };
};

const offsetNode = (node, offset) => ({
  ...node,
  x: node.x - offset.x,
  y: node.y - offset.y
});

const offsetEdge = (edge, offset) => ({
  ...edge,
  points: edge.points.map(p => ({ x: p.x - offset.x, y: p.y - offset.y }))
});

const subtract = (a, b) => a - b;

const equals = (a, b) => a === b;

const distance1d = (a, b) => Math.abs(a - b);

const angle = (pointA, pointB) =>
  Math.atan2(pointA.y - pointB.y, pointA.x - pointB.x);

const nearestOnLine = (x, y, ax, ay, bx, by) => {
  const deltaX = bx - ax;
  const deltaY = by - ay;
  let position =
    ((x - ax) * deltaX + (y - ay) * deltaY) /
    (deltaX * deltaX + deltaY * deltaY || 1);

  if (position > 1) {
    position = 1;
  } else if (position < 0) {
    position = 0;
  }

  return {
    x: ax + position * deltaX,
    y: ay + position * deltaY,
    ax,
    ay,
    bx,
    by
  };
};

const sizeOf = (nodes, padding) => {
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

const solve = (constraints, iterations) => {
  for (let i = 0; i < iterations; i += 1) {
    for (const co of constraints) {
      const delta = (co.delta || subtract)(co.a[co.key], co.b[co.key], co);
      const distance = (co.dist || distance1d)(co.a[co.key], co.b[co.key], co);
      const target = co.target(co.a[co.key], co.b[co.key], co, delta, distance);

      if (!(co.operator || equals)(distance, target, delta)) {
        const fix = (co.strength ? co.strength() : 1) * (delta - target);
        let weightA = co.weightA ? co.weightA() : 1;
        let weightB = co.weightB ? co.weightB() : 1;

        weightA = weightA / (weightA + weightB);
        weightB = 1 - weightA;
        co.a[co.key] -= weightA * fix;
        co.b[co.key] += weightB * fix;
      }
    }
  }
};

const layout = (nodes, edges, spacing, spacingX, spacingY) => {
  const solver = new kiwi.Solver();

  const constrain = (...args) => {
    const constraint = new kiwi.Constraint(...args);
    solver.addConstraint(constraint);
    return constraint;
  };

  for (const node of nodes) {
    node.x = 0;
    node.y = 0;
    node.X = new kiwi.Variable();
    node.Y = new kiwi.Variable();
  }

  for (const edge of edges) {
    constrain(edge.targetNode.Y.minus(edge.sourceNode.Y), isGe, spacingY);
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

  const crossing = [];
  const crossingOperator = (dist, target, delta) =>
    target >= 0 ? delta >= target : delta <= target;
  const crossingStrength = () => 1 / spacing;
  const crossingTarget = (a, b, co) => {
    const sourceDelta = co.edgeA.sourceNode.x - co.edgeB.sourceNode.x;
    const targetDelta = co.edgeA.targetNode.x - co.edgeB.targetNode.x;
    return sourceDelta + targetDelta < 0 ? -spacing : spacing;
  };

  for (let i = 0; i < edges.length; i += 1) {
    const edgeA = edges[i];

    for (let j = i + 1; j < edges.length; j += 1) {
      const edgeB = edges[j];

      if (edgeA.source !== edgeB.source && edgeA.target !== edgeB.target) {
        crossing.push({
          edgeA,
          edgeB,
          key: 'x',
          a: edgeA.sourceNode,
          b: edgeB.sourceNode,
          target: crossingTarget,
          operator: crossingOperator,
          strength: crossingStrength
        });

        crossing.push({
          edgeA,
          edgeB,
          key: 'x',
          a: edgeA.targetNode,
          b: edgeB.targetNode,
          target: crossingTarget,
          operator: crossingOperator,
          strength: crossingStrength
        });
      }
    }
  }

  const parallel = [];
  const singles = [];
  const doubles = [];

  for (const edge of edges) {
    const cons = {
      a: edge.sourceNode,
      b: edge.targetNode,
      key: 'x',
      target: () => 0,
      operator: (a, b) => a === b,
      strength: () =>
        1 /
        Math.max(
          1,
          0.5 *
            (edge.sourceNode.targets.length + edge.targetNode.sources.length)
        )
    };

    parallel.push(cons);

    if (
      edge.sourceNode.targets.length === 1 ||
      edge.targetNode.sources.length === 1
    ) {
      singles.push(cons);
    }

    if (
      edge.sourceNode.targets.length === 1 &&
      edge.targetNode.sources.length === 1
    ) {
      doubles.push(cons);
    }
  }

  let separation = [];

  for (let i = 0; i < 20; i += 1) {
    solve(crossing, 1);
    solve(parallel, 1);
    solve(singles, 10);
    solve(doubles, 10);

    separation.length = 0;

    for (let l = 0; l < layerRows.length; l += 1) {
      const layerNodes = layerRows[l];
      layerNodes.sort((a, b) => a.x - b.x);

      for (let i = 0; i < layerNodes.length - 1; i += 1) {
        separation.push({
          a: layerNodes[i],
          b: layerNodes[i + 1],
          key: 'x',
          target: () =>
            -spacingX -
            layerNodes[i].width * 0.5 -
            layerNodes[i + 1].width * 0.5,
          operator: (a, b, c) => c <= b,
          strength: () => 1
        });
      }
    }

    solve(separation, 10);
  }

  const layerDensity = {};

  for (const edge of edges) {
    const layer = edge.sourceNode.layer;
    layerDensity[layer] = layerDensity[layer] || [0, 0];
    layerDensity[layer][0] += Math.abs(
      angle(edge.targetNode, edge.sourceNode) - Math.PI * 0.5
    );
    layerDensity[layer][1] += 1;
  }

  for (const layer in layerDensity) {
    layerDensity[layer] = layerDensity[layer][0] / layerDensity[layer][1];
  }

  for (let l = 0; l < layerRows.length; l += 1) {
    const layerNodes = layerRows[l];
    for (let i = 0; i < layerNodes.length - 1; i += 1) {
      constrain(
        layerNodes[i + 1].X.minus(layerNodes[i].X),
        isGe,
        Math.max(
          spacingX + layerNodes[i].width * 0.5 + layerNodes[i + 1].width * 0.5,
          0.8 * (layerNodes[i + 1].x - layerNodes[i].x)
        )
      );
    }
  }

  for (const edge of edges) {
    const sep =
      spacingY + layerDensity[edge.sourceNode.layer] * spacingY * 0.85;
    constrain(edge.targetNode.Y.minus(edge.sourceNode.Y), isGe, sep);
    constrain(
      edge.sourceNode.X.minus(edge.targetNode.X),
      isEq,
      0,
      kiwi.Strength.strong
    );
  }

  solver.updateVariables();

  for (const node of nodes) {
    node.y = node.Y.value();
    node.x = node.X.value();
  }

  return layerRows;
};

const routing = (
  nodes,
  edges,
  layerRows,
  spaceX,
  offsetY,
  tensionK,
  minGap,
  stemUnit,
  stemMinSource,
  stemMinTarget,
  stemMax
) => {
  for (const node of nodes) {
    node.targets.sort(
      (a, b) => angle(node, b.targetNode) - angle(node, a.targetNode)
    );
    node.sources.sort(
      (a, b) => angle(node, a.sourceNode) - angle(node, b.sourceNode)
    );
  }

  for (const edge of edges) {
    const source = edge.sourceNode;
    const target = edge.targetNode;

    const sourceSep = Math.min(
      (0.75 * source.width) / source.targets.length,
      6
    );
    const targetSep = Math.min(
      (0.75 * target.width) / target.sources.length,
      10
    );

    const edgeDist =
      source.targets.indexOf(edge) - (source.targets.length - 1) * 0.5;
    const targetEdgeDist =
      target.sources.indexOf(edge) - (target.sources.length - 1) * 0.5;

    const sourceOffsetX = sourceSep * edgeDist;
    const targetOffsetX = targetSep * targetEdgeDist;

    const start = { x: source.x + sourceOffsetX, y: source.y };
    const end = { x: target.x + targetOffsetX, y: target.y };

    const points = [];
    let current = start;

    for (let l = source.layer + 1; l < target.layer; l += 1) {
      let nearest = null;
      let nearestDist = Infinity;

      const first = layerRows[l][0];
      const ts =
        tensionK / Math.sqrt((current.y - end.y) * (current.y - end.y));
      const row = [
        { ...first, x: Number.MIN_SAFE_INTEGER },
        ...layerRows[l],
        { ...first, x: Number.MAX_SAFE_INTEGER }
      ];

      for (let i = 0; i < row.length - 1; i += 1) {
        const node = row[i];
        const next = row[i + 1];

        if (next.x - next.width * 0.5 - (node.x + node.width * 0.5) < minGap)
          continue;

        const gradient = (end.x - current.x) / (end.y - current.y) || 1;
        const tension =
          ts *
          (0.5 * (nearest ? nearest.gradient : gradient) + 0.5 * gradient) *
          (node.y - node.height * 0.5 - offsetY - current.y);
        const spaceXX = Math.min(
          spaceX,
          (next.x - next.width * 0.5 - (node.x + node.width * 0.5)) * 0.5
        );
        const pc = nearestOnLine(
          current.x + tension,
          current.y,
          node.x + node.width * 0.5 + spaceXX,
          node.y - node.height * 0.5 - offsetY,
          next.x - spaceXX - next.width * 0.5,
          next.y - next.height * 0.5 - offsetY
        );
        const dist =
          (current.x - pc.x) * (current.x - pc.x) +
          (current.y - pc.y) * (current.y - pc.y);

        if (dist < nearestDist) {
          nearestDist = dist;
          nearest = pc;
          nearest.gradient = gradient;
        }
      }

      const gradient = (end.x - nearest.x) / (end.y - nearest.y) || 1;
      const oy = first.height + 2 * offsetY;
      const ts2 =
        tensionK / Math.sqrt((nearest.y - end.y) * (nearest.y - end.y));
      const tension = ts2 * (0.5 * nearest.gradient + 0.5 * gradient) * oy;
      const nearest2 = nearestOnLine(
        nearest.x + tension,
        nearest.y,
        nearest.ax,
        nearest.ay + oy,
        nearest.bx,
        nearest.by + oy
      );
      const dy = (l - source.layer) / (target.layer - source.layer);
      const offsetX = sourceOffsetX * (1 - dy) * 1 + targetOffsetX * dy * 0;

      points.push({
        x: nearest.x + offsetX,
        y: nearest.y,
        gradient: nearest.gradient
      });
      points.push({ x: nearest2.x + offsetX, y: nearest2.y, gradient });

      current = { x: nearest2.x, y: nearest2.y };
    }

    edge.points = points;
  }

  for (const node of nodes) {
    node.targets.sort(
      (a, b) =>
        angle(node, b.points[0] || b.targetNode) -
        angle(node, a.points[0] || a.targetNode)
    );
    node.sources.sort(
      (a, b) =>
        angle(node, a.points[a.points.length - 1] || a.sourceNode) -
        angle(node, b.points[b.points.length - 1] || b.sourceNode)
    );
  }

  for (const edge of edges) {
    const source = edge.sourceNode;
    const target = edge.targetNode;

    const sourceSep = Math.min(
      (0.75 * source.width) / source.targets.length,
      6
    );
    const targetSep = Math.min(
      (0.75 * target.width) / target.sources.length,
      10
    );

    const edgeDist =
      source.targets.indexOf(edge) - (source.targets.length - 1) * 0.5;
    const targetEdgeDist =
      target.sources.indexOf(edge) - (target.sources.length - 1) * 0.5;

    const sourceOffsetX = sourceSep * edgeDist;
    const targetOffsetX = targetSep * targetEdgeDist;

    const startOffY =
      stemUnit *
      source.targets.length *
      (1 - Math.abs(edgeDist) / source.targets.length);
    const endOffY =
      stemUnit *
      target.sources.length *
      (1 - Math.abs(targetEdgeDist) / target.sources.length);

    const startPoints = [
      { x: source.x + sourceOffsetX, y: source.y + source.height * 0.5 },
      {
        x: source.x + sourceOffsetX,
        y: source.y + source.height * 0.5 + stemMinSource
      },
      {
        x: source.x + sourceOffsetX,
        y:
          source.y +
          source.height * 0.5 +
          stemMinSource +
          Math.min(startOffY, stemMax)
      }
    ];

    const endPoints = [
      {
        x: target.x + targetOffsetX,
        y:
          target.y -
          source.height * 0.5 -
          stemMinTarget -
          Math.min(endOffY, stemMax)
      },
      {
        x: target.x + targetOffsetX,
        y: target.y - source.height * 0.5 - stemMinTarget
      },
      { x: target.x + targetOffsetX, y: target.y - source.height * 0.5 }
    ];

    edge.points = [...startPoints, ...edge.points, ...endPoints];
  }
};

export default graph;
