import { createSelector } from 'reselect';
import { getVisibleEdges } from './edges';
import { getGraphNodes } from './nodes';

const getClickedNode = (state) => state.node.clicked;
const getFromNodes = (state) => state.filters.from;
const getToNodes = (state) => state.filters.to;
/**
 * Gets a map of visible nodeIDs to successors nodeIDs in both directions
 * @param {Array} edges
 */
export const getVisibleEdgesByNode = createSelector(
  [getVisibleEdges],
  (edges) => {
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
  }
);

/**
 * Finds all visible successor nodeIDs for the given nodeID
 * @param {String} nodeID the starting nodeID
 * @param {Object} edgesByNode an object mapping nodeIDs to successor nodeIDs
 * @param {Object} visited an object for storing all visited node ids
 * @returns {Object} the supplied `visited` object
 */
const findLinkedNodes = (nodeID, edgesByNode, visited) => {
  if (!visited[nodeID]) {
    visited[nodeID] = true;

    if (edgesByNode[nodeID]) {
      edgesByNode[nodeID].forEach((nodeID) =>
        findLinkedNodes(nodeID, edgesByNode, visited)
      );
    }
  }

  return visited;
};

/**
 * Gets all visible ancestors and descendents for the given nodeID
 * @param {Object} visibleEdgeMaps
 * @param {String} nodeID
 */
export const getLinkedNodes = createSelector(
  [getVisibleEdgesByNode, getClickedNode],
  ({ sourceEdges, targetEdges }, nodeID) => {
    if (!nodeID) {
      return {};
    }

    const linkedNodes = {};
    findLinkedNodes(nodeID, sourceEdges, linkedNodes);

    linkedNodes[nodeID] = false;
    findLinkedNodes(nodeID, targetEdges, linkedNodes);

    return linkedNodes;
  }
);

export const getSlicedGraphNodes = createSelector(
  [getVisibleEdgesByNode, getFromNodes, getToNodes, getGraphNodes],
  ({ sourceEdges, targetEdges }, startID, endID, graphNodes) => {
    if (!startID && !endID && !graphNodes) {
      return {};
    }

    const linkedNodesBeforeEnd = {};
    findLinkedNodes(endID, sourceEdges, linkedNodesBeforeEnd);

    const linkedNodesAfterStart = {};
    findLinkedNodes(startID, targetEdges, linkedNodesAfterStart);

    const linkedNodesBetween = [];
    for (const nodeID in linkedNodesBeforeEnd) {
      if (linkedNodesAfterStart[nodeID]) {
        linkedNodesBetween.push(nodeID);
      }
    }

    // Traverse graphNodes and add those whose ID is in linkedNodesBetween
    const filteredNodes = {};
    for (const nodeID of linkedNodesBetween) {
      // Changed this loop
      if (graphNodes[nodeID]) {
        // Check if the graphNode's ID is present
        filteredNodes[nodeID] = graphNodes[nodeID];
      }
    }
    return filteredNodes;
  }
);
