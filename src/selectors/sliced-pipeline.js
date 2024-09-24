import { createSelector } from 'reselect';

const getEdgeIDs = (state) => state.edge.ids;
const getEdgeSources = (state) => state.edge.sources;
const getEdgeTargets = (state) => state.edge.targets;
const getFromNodes = (state) => state.slice.from;
const getToNodes = (state) => state.slice.to;

/**
 * Selector to get all edges formatted as an array of objects with id, source, and target properties.
 * @param {Object} state - The global state object.
 * @returns {Array} An array of edge objects.
 */
const getEdges = createSelector(
  [getEdgeIDs, getEdgeSources, getEdgeTargets],
  (edgeIDs, edgeSources, edgeTargets) =>
    edgeIDs.map((id) => ({
      id,
      source: edgeSources[id],
      target: edgeTargets[id],
    }))
);

/**
 * Selector to organize edges by their source and target nodes.
 * @param {Array} edges - Array of edge objects.
 * @returns {Object} An object containing edges mapped by source and target nodes.
 */

export const getEdgesByNode = createSelector([getEdges], (edges) => {
  const sourceEdges = {};
  const targetEdges = {};

  for (const edge of edges) {
    if (!sourceEdges[edge.target]) {
      sourceEdges[edge.target] = [];
    }

    sourceEdges[edge.target].push(edge.source);

    if (!targetEdges[edge.source]) {
      targetEdges[edge.source] = [];
    }

    targetEdges[edge.source].push(edge.target);
  }

  return { sourceEdges, targetEdges };
});

/**
 * Recursive function to find all linked nodes starting from a given node ID.
 * @param {string} nodeID - The starting node ID.
 * @param {Object} edgesByNode - A map of node IDs to their connected node IDs.
 * @param {Object} visited - A map to keep track of visited nodes.
 * @returns {Object} A map of visited nodes.
 */
const findLinkedNodes = (nodeID, edgesByNode, visited) => {
  // Check if the current node has not been visited
  if (!visited[nodeID]) {
    // Mark the current node as visited
    visited[nodeID] = true;
    // If the current node has outgoing edges
    if (edgesByNode[nodeID]) {
      // Recursively visit all connected nodes
      edgesByNode[nodeID].forEach((nodeID) =>
        findLinkedNodes(nodeID, edgesByNode, visited)
      );
    }
  }

  // Return the map of visited nodes
  return visited;
};

const findNodesInBetween = (sourceEdges, startID, endID) => {
  if (!startID || !endID) {
    return [startID, endID].filter(Boolean);
  }

  const linkedNodesBeforeEnd = {};
  findLinkedNodes(endID, sourceEdges, linkedNodesBeforeEnd);

  const linkedNodeBeforeStart = {};
  findLinkedNodes(startID, sourceEdges, linkedNodeBeforeStart);

  let filteredNodeIDs = Object.keys(linkedNodesBeforeEnd);

  if (filteredNodeIDs.includes(startID) && filteredNodeIDs.includes(endID)) {
    return filteredNodeIDs;
  } else {
    // If startID and endID are not connected, return empty array so it won't render the flowchart
    filteredNodeIDs = [];
  }

  return filteredNodeIDs;
};

/**
 * Selector to filter nodes that are connected between two specified node IDs.
 * @param {Object} edgesByNode - Edges organized by node IDs.
 * @param {string} startID - Starting node ID.
 * @param {string} endID - Ending node ID.
 * @returns {Array} Array of node IDs that are connected from startID to endID.
 */

export const getSlicedPipeline = createSelector(
  [getEdgesByNode, getFromNodes, getToNodes],
  ({ sourceEdges, targetEdges }, startID, endID) => {
    return findNodesInBetween(sourceEdges, startID, endID);
  }
);
