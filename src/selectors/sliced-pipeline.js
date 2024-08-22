import { createSelector } from 'reselect';

const getEdgeIDs = (state) => state.edge.ids;
const getEdgeSources = (state) => state.edge.sources;
const getEdgeTargets = (state) => state.edge.targets;
const getFromNodes = (state) => state.slice.from;
const getToNodes = (state) => state.slice.to;
const getNames = (state) => state.node.name;

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

const findPath = (input, startId, endId, path = []) => {
  path.push(startId); // Add the current node to the path
  if (startId === endId) {
    // If the current node is the end node, return true
    return true;
  }
  if (!input[startId]) {
    // If the current node has no children, it's a dead end
    path.pop();
    return false;
  }
  for (const child of input[startId]) {
    if (findPath(input, child, endId, path)) {
      // If a path to the end node is found through the child, return true
      return true;
    }
  }
  path.pop(); // Remove the current node from the path if no path to endId is found through it
  return false;
};

const sliceTree = (input, startId, endId) => {
  const path = [];
  findPath(input, startId, endId, path); // Find the path from startId to endId

  const result = {};
  for (let i = 0; i < path.length - 1; i++) {
    // Build the tree structure based on the path
    const currentId = path[i];
    const nextId = path[i + 1];
    if (!result[currentId]) {
      result[currentId] = [nextId];
    } else {
      result[currentId].push(nextId);
    }
  }

  return result;
};

/**
 * Recursive function to find all linked nodes starting from a given node ID.
 * @param {string} nodeID - The starting node ID.
 * @param {Object} edgesByNode - A map of node IDs to their connected node IDs.
 * @param {Object} visited - A map to keep track of visited nodes.
 * @returns {Object} A map of visited nodes.
 */
const findLinkedNodes = (nodeID, edgesByNode, visited, names) => {
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

const findNodesInBetween = (
  sourceEdges,
  targetEdges,
  startID,
  endID,
  names
) => {
  if (!startID || !endID) {
    return [startID, endID].filter(Boolean);
  }

  const slicedNodes = sliceTree(targetEdges, startID, endID);
  const keys = Object.keys(slicedNodes);
  const values = [].concat(...Object.values(slicedNodes));
  const combined = keys.concat(values);
  // Filter out duplicates to ensure each node ID is unique
  const uniqueSlicedNodeIDs = [...new Set(combined)];

  // Check if both startID and endID are included in the filtered node IDs
  // If not, it implies they are not connected, and we return an empty array
  if (
    uniqueSlicedNodeIDs.includes(startID) &&
    uniqueSlicedNodeIDs.includes(endID)
  ) {
    return uniqueSlicedNodeIDs;
  } else {
    return [];
  }
};

/**
 * Selector to filter nodes that are connected between two specified node IDs.
 * @param {Object} edgesByNode - Edges organized by node IDs.
 * @param {string} startID - Starting node ID.
 * @param {string} endID - Ending node ID.
 * @returns {Array} Array of node IDs that are connected from startID to endID.
 */

export const getSlicedPipeline = createSelector(
  [getEdgesByNode, getFromNodes, getToNodes, getNames],
  ({ sourceEdges, targetEdges }, startID, endID, names) => {
    return findNodesInBetween(sourceEdges, targetEdges, startID, endID, names);
  }
);
