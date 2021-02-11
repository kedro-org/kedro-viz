import { halfPI, snap, angle, compare, groupByRow } from './common';
import { solve } from './solver';
import {
  rowConstraint,
  layerConstraint,
  parallelConstraint,
  crossingConstraint,
  separationConstraint,
} from './constraints';

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
  iterations,
}) => {
  // Set initial positions for nodes
  for (const node of nodes) {
    node.x = 0;
    node.y = 0;
  }

  // Constants passed to solver
  const constants = {
    spaceX,
    spaceY,
    basisX,
    layerSpace: (spaceY + layerSpaceY) * 0.5,
  };

  // Constraints to separate nodes into rows
  const rowConstraints = createRowConstraints(edges);

  // Constraints to separate nodes into layers
  const layerConstraints = createLayerConstraints(nodes, layers);

  // Find the node positions given these constraints
  solve([...rowConstraints, ...layerConstraints], constants, 1, true);

  // Find the rows using the node positions after solving
  const rows = groupByRow(nodes);

  // Constraints to avoid edges crossing
  const crossingConstraints = createCrossingConstraints(edges);

  // Constraints to maintain parallel vertical edges
  const {
    parallelConstraints,
    parallelSingleConstraints,
    parallelDoubleConstraints,
  } = createParallelConstraints(edges);

  // Constraints to maintain a minimum horizontal node spacing
  const separationConstraints = createSeparationConstraints(rows);

  // Solve these constraints using multiple iterations
  for (let i = 0; i < iterations; i += 1) {
    // Solve main constraints
    solve(crossingConstraints, constants, 1);
    solve(parallelConstraints, constants, 1);

    // Further improve special cases with more effort
    solve(parallelSingleConstraints, constants, iterations * 0.5);
    solve(parallelDoubleConstraints, constants, iterations * 0.5);

    // Update and solve separation constraints given the updated positions
    updateSeparationConstraints(separationConstraints, rows, spaceX);
    solve(separationConstraints, constants, iterations * 0.5);
  }

  // Update separation constraints but ensure spacing is exact
  updateSeparationConstraints(separationConstraints, rows, spaceX, true);

  // Find the final node positions given these strict constraints
  solve([...separationConstraints, ...parallelConstraints], constants, 1, true);

  // Adjust vertical spacing between rows for legibility
  expandDenseRows(edges, rows, spaceY);
};

/**
 * Creates row constraints for the given edges.
 * @param {array} edges The input edges
 * @returns {array} The constraints
 */
const createRowConstraints = (edges) =>
  edges.map((edge) => ({
    base: rowConstraint,
    a: edge.targetNode,
    b: edge.sourceNode,
  }));

/**
 * Creates layer constraints for the given nodes and layers.
 * @param {array} nodes The input nodes
 * @param {array=} layers The input layers if any
 * @returns {array} The constraints
 */
const createLayerConstraints = (nodes, layers) => {
  const layerConstraints = [];

  // Early out if no layers defined
  if (!layers) {
    return layerConstraints;
  }

  // Group the nodes for each layer
  const layerGroups = layers.map((name) =>
    nodes.filter((node) => node.nearestLayer === name)
  );

  // For each layer of nodes
  for (let i = 0; i < layerGroups.length - 1; i += 1) {
    const layerNodes = layerGroups[i];
    const nextLayerNodes = layerGroups[i + 1];

    // Create a temporary intermediary node for the layer
    const intermediary = { id: `layer-${i}`, x: 0, y: 0 };

    // Constrain each node in the layer to above the intermediary
    for (const node of layerNodes) {
      layerConstraints.push({
        base: layerConstraint,
        a: intermediary,
        b: node,
      });
    }

    // Constrain each node in the next layer to below the intermediary
    for (const node of nextLayerNodes) {
      layerConstraints.push({
        base: layerConstraint,
        a: node,
        b: intermediary,
      });
    }
  }

  return layerConstraints;
};

/**
 * Creates crossing constraints for the given edges.
 * @param {array} edges The input edges
 * @returns {array} The constraints
 */
const createCrossingConstraints = (edges) => {
  const crossingConstraints = [];

  // For every pair of edges
  for (let i = 0; i < edges.length; i += 1) {
    const edgeA = edges[i];

    for (let j = i + 1; j < edges.length; j += 1) {
      const edgeB = edges[j];

      // Add crossing constraint between edge source nodes, where different
      if (edgeA.source !== edgeB.source) {
        crossingConstraints.push({
          base: crossingConstraint,
          a: edgeA.sourceNode,
          b: edgeB.sourceNode,
          edgeA: edgeA,
          edgeB: edgeB,
        });
      }

      // Add crossing constraint between edge target nodes, where different
      if (edgeA.target !== edgeB.target) {
        crossingConstraints.push({
          base: crossingConstraint,
          a: edgeA.targetNode,
          b: edgeB.targetNode,
          edgeA: edgeA,
          edgeB: edgeB,
        });
      }
    }
  }

  return crossingConstraints;
};

/**
 * Creates parallel constraints for the given edges.
 * Returns object with additional arrays that identify these special cases:
 * - edges connected to single-degree nodes at either end
 * - edges connected to single-degree nodes at both ends
 * @param {array} edges The input edges
 * @returns {object} An object containing the constraints
 */
const createParallelConstraints = (edges) => {
  const parallelConstraints = [];
  const parallelSingleConstraints = [];
  const parallelDoubleConstraints = [];

  // For each edge
  for (const edge of edges) {
    // Constraint to keep it vertical and therefore parallel
    const constraint = {
      base: parallelConstraint,
      a: edge.sourceNode,
      b: edge.targetNode,
    };

    parallelConstraints.push(constraint);

    // Identify special cases
    const sourceHasOneTarget = edge.sourceNode.targets.length === 1;
    const targetHasOneSource = edge.targetNode.sources.length === 1;

    // Collect edges connected to single-degree nodes at either end
    if (sourceHasOneTarget || targetHasOneSource) {
      parallelSingleConstraints.push(constraint);
    }

    // Collect edges connected to single-degree nodes at both ends
    if (sourceHasOneTarget && targetHasOneSource) {
      parallelDoubleConstraints.push(constraint);
    }
  }

  return {
    parallelConstraints,
    parallelSingleConstraints,
    parallelDoubleConstraints,
  };
};

/**
 * Creates horizontal separation constraints for the given rows.
 * @param {array} rows The rows containing nodes
 * @returns {array} The constraints
 */
const createSeparationConstraints = (rows) => {
  const separationConstraints = [];

  // Constraints to maintain horizontal node separation
  for (const rowNodes of rows) {
    for (let j = 0; j < rowNodes.length - 1; j += 1) {
      separationConstraints.push({
        base: separationConstraint,
        a: null,
        b: null,
      });
    }
  }

  return separationConstraints;
};

/**
 * Updates horizontal separation constraints for the given rows.
 * @param {array} separationConstraints The constraints to update
 * @param {array} rows The rows containing nodes
 * @param {number} spaceX The desired separation in X
 * @returns {array} The constraints
 */
const updateSeparationConstraints = (
  separationConstraints,
  rows,
  spaceX,
  snapped = false
) => {
  let k = 0;

  // For each row
  for (let l = 0; l < rows.length; l += 1) {
    const rowNodes = rows[l];

    // Sort rows horizontally, breaks ties with ids for stability
    rowNodes.sort((a, b) => compare(a.x, b.x, a.id, b.id));

    // Update constraints given updated row order
    for (let j = 0; j < rowNodes.length - 1; j += 1) {
      const constraint = separationConstraints[k];

      // Update the constraint objects in order
      constraint.a = rowNodes[j];
      constraint.b = rowNodes[j + 1];

      // Find the minimal required horizontal separation
      const minSeparation =
        spaceX + constraint.a.width * 0.5 + constraint.b.width * 0.5;

      if (!snapped) {
        // Use the minimal separation
        constraint.separation = minSeparation;
      } else {
        // Find the current node horizontal separation
        const separation = constraint.b.x - constraint.a.x;

        // Snap the current horizontal separation to a unit amount
        constraint.separation = Math.max(
          snap(separation * 0.8, spaceX),
          minSeparation
        );
      }

      k += 1;
    }
  }
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

  // Add spacing based on density
  for (let i = 0; i < densities.length; i += 1) {
    const density = densities[i];

    // Snap to improve vertical rhythm
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
const rowDensity = (edges) => {
  const rows = {};

  for (const edge of edges) {
    // Find the normalized angle of the edge source and target nodes, relative to the X axis
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
