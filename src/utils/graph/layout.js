import { halfPI, snap, angle, compare, groupByRow } from './common';
import { solve, greaterOrEqual, equalTo } from './solver';

/**
 * Finds positions for the given nodes relative to their edges.
 * Input nodes and edges are updated in-place.
 * Results are stored in the `x, y` properties on nodes.
 * @param {object} params The layout parameters
 * @param {array} params.nodes The input nodes
 * @param {array} params.edges The input edges
 * @param {object=} params.layers The node layers if specified
 * @param {number} params.basisX The basis relating diagram width in X
 * @param {number} params.spaceX The minimum gap between nodes in X
 * @param {number} params.spaceY The minimum gap between nodes in Y
 * @param {number} params.layerSpaceY The additional gap between nodes in Y between layers
 * @param {number} params.iterations The number of solver iterations to perform
 * @returns {void}
 */
export const layout = ({
  nodes,
  edges,
  layers,
  basisX,
  spaceX,
  spaceY,
  layerSpaceY,
  iterations
}) => {
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

  // Constraints in Y formed by the edges of the graph
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

  // Constraints in Y separating nodes into layers if specified
  if (layers) {
    const layerNames = Object.values(layers);
    const layerSpace = (spaceY + layerSpaceY) * 0.5;
    let layerNodes = nodes.filter(node => node.nearestLayer === layerNames[0]);

    // For each defined layer
    for (let i = 0; i < layerNames.length - 1; i += 1) {
      const layer = layerNames[i];
      const nextLayer = layerNames[i + 1];
      const nextLayerNodes = nodes.filter(
        node => node.nearestLayer === nextLayer
      );

      // Create a temporary intermediary 'node'
      const layerNode = { id: layer, x: 0, y: 0 };

      // Constraints in Y for each node such that node.y <= layerNode.y - spaceY
      for (const node of layerNodes) {
        layerConstraints.push({
          a: layerNode,
          b: node,
          key: 'y',
          operator: greaterOrEqual,
          target: () => layerSpace,
          weightA: () => 0,
          weightB: () => 1
        });
      }

      // Constraints in Y for each node on the next layer such that node.y >= layerNode.y
      for (const node of nextLayerNodes) {
        layerConstraints.push({
          a: node,
          b: layerNode,
          key: 'y',
          operator: greaterOrEqual,
          target: () => layerSpace,
          weightA: () => 0,
          weightB: () => 1
        });
      }

      layerNodes = nextLayerNodes;
    }
  }

  // Find the positions of each node in Y given the constraints exactly
  solve([...rowConstraints, ...layerConstraints], 1, true);

  // Find the rows formed by the nodes
  const rows = groupByRow(nodes);

  // Constraints in X to prevent a pair of edges crossing
  const crossingConstraint = {
    basisX,
    key: 'x',
    operator: (distance, target, delta) =>
      target >= 0 ? delta >= target : delta <= target,
    target: (a, b, co) => {
      // Find the minimal target position that separates both nodes
      const sourceDelta = co.edgeA.sourceNode.x - co.edgeB.sourceNode.x;
      const targetDelta = co.edgeA.targetNode.x - co.edgeB.targetNode.x;
      return sourceDelta + targetDelta < 0 ? -co.basisX : co.basisX;
    },
    strength: co => 1 / co.basisX,
    weightA: () => 0.5,
    weightB: () => 0.5
  };

  // For every pair of edges
  for (let i = 0; i < edges.length; i += 1) {
    const edgeA = edges[i];

    for (let j = i + 1; j < edges.length; j += 1) {
      const edgeB = edges[j];

      // Add crossing constraint between edge source nodes, where different
      if (edgeA.source !== edgeB.source) {
        crossingConstraints.push({
          ...crossingConstraint,
          a: edgeA.sourceNode,
          b: edgeB.sourceNode,
          edgeA,
          edgeB
        });
      }

      // Add crossing constraint between edge target nodes, where different
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

  // Constraints in X to minimise edge length thereby prioritising straight parallel edges in Y
  for (const edge of edges) {
    const parallelConstraint = {
      a: edge.sourceNode,
      b: edge.targetNode,
      key: 'x',
      operator: equalTo,
      target: () => 0,
      // Lower degree nodes can be moved more freely than higher
      strength: co =>
        1 / Math.max(1, 0.5 * (co.a.targets.length + co.b.sources.length)),
      weightA: () => 0.5,
      weightB: () => 0.5
    };

    parallelConstraints.push(parallelConstraint);

    const sourceHasOneTarget = edge.sourceNode.targets.length === 1;
    const targetHasOneSource = edge.targetNode.sources.length === 1;

    // Collect edges connected to single-degree nodes at either end
    if (sourceHasOneTarget || targetHasOneSource) {
      parallelSingleConstraints.push(parallelConstraint);
    }

    // Collect edges connected to single-degree at both ends
    if (sourceHasOneTarget && targetHasOneSource) {
      parallelDoubleConstraints.push(parallelConstraint);
    }
  }

  // Solving loop for constraints in X
  const halfIterations = Math.ceil(iterations * 0.5);

  for (let i = 0; i < iterations; i += 1) {
    // Minimise crossing
    solve(crossingConstraints, 1);

    // Minimise edge length
    solve(parallelConstraints, 1);

    // Minimise edge length specifically for low-degree edges more strongly
    solve(parallelSingleConstraints, halfIterations);
    solve(parallelDoubleConstraints, halfIterations);

    // Clear separation constraints from previous iteration
    separationConstraints.length = 0;

    // For each row
    for (let l = 0; l < rows.length; l += 1) {
      const rowNodes = rows[l];

      // Sort rows in order of X position. Break ties with ids for stability
      rowNodes.sort((a, b) => compare(a.x, b.x, a.id, b.id));

      // Constraints in X to maintain minimum node separation
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

    // Minimise node separation overlap
    solve(separationConstraints, halfIterations);
  }

  // For each row already sorted in X
  for (let l = 0; l < rows.length; l += 1) {
    const rowNodes = rows[l];

    // For each node on the row
    for (let i = 0; i < rowNodes.length - 1; i += 1) {
      // Find the current node separation
      const separation = (rowNodes[i + 1].x - rowNodes[i].x) * 0.8;

      // Find the minimal required separation
      const minSeparation =
        rowNodes[i].width * 0.5 + spaceX + rowNodes[i + 1].width * 0.5;

      // Snap the separation to a unit amount
      const targetSeparation = Math.max(
        snap(separation, spaceX),
        minSeparation
      );

      // Constraints in X to maintain target separation
      snapConstraints.push({
        a: rowNodes[i + 1],
        b: rowNodes[i],
        key: 'x',
        operator: greaterOrEqual,
        target: () => targetSeparation,
        weightA: () => 0,
        weightB: () => 1,
        required: true
      });
    }
  }

  // Find final positions of each node in X under given constraints exactly
  solve([...snapConstraints, ...parallelConstraints], 1, true);

  // Add additional spacing in Y for rows with many crossing edges
  expandDenseRows(edges, rows, spaceY);
};

/**
 * Adds additional spacing in Y for rows containing many crossing edges.
 * Node positions are updated in-place
 * @param {array} edges The input edges
 * @param {array} rows The input rows of nodes
 * @param {number} spaceY The minimum spacing between nodes in Y
 */
const expandDenseRows = (edges, rows, spaceY) => {
  const densities = rowDensity(edges);
  let currentOffsetY = 0;

  // Add spacing based on density, snapped to a grid to improve vertical rhythm
  for (let i = 0; i < densities.length; i += 1) {
    const density = densities[i];
    const offsetY = snap(density * spaceY, Math.round(spaceY * 0.25));
    currentOffsetY += offsetY;

    for (const node of rows[i + 1]) {
      node.y += currentOffsetY;
    }
  }
};

/**
 * Estimates an average 'density' for each row based on average edge angle at that row.
 * Rows are decided by each edge's source and target node Y positions.
 * Intermediate rows are assumed always vertical as a simplification.
 * Returns a list of values in `(0, 1)` where `0` means all edges on that row are vertical and `1` means all horizontal
 * @param {array} edges The input edges
 * @returns {array} The density of each row
 */
const rowDensity = edges => {
  const rows = {};

  for (const edge of edges) {
    // Find the normalised angle of the edge source and target nodes, relative to the X axis
    const edgeAngle =
      Math.abs(angle(edge.targetNode, edge.sourceNode) - halfPI) / halfPI;

    const sourceRow = edge.sourceNode.row;
    const targetRow = edge.targetNode.row - 1;

    // Add angle to the source row total
    rows[sourceRow] = rows[sourceRow] || [0, 0];
    rows[sourceRow][0] += edgeAngle;
    rows[sourceRow][1] += 1;

    if (targetRow !== sourceRow) {
      // Add angle to the target row total
      rows[targetRow] = rows[targetRow] || [0, 0];
      rows[targetRow][0] += edgeAngle;
      rows[targetRow][1] += 1;
    }
  }

  // Find the average angle for each row
  for (const row in rows) {
    rows[row] = rows[row][0] / (rows[row][1] || 1);
  }

  return Object.values(rows);
};
