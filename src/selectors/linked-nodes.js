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

    console.log(linkedNodes);

    return linkedNodes;
  }
);

export const getFilteredNodes = createSelector(
  [getVisibleEdgesByNode, getFromNodes, getToNodes, getGraphNodes],
  ({ sourceEdges, targetEdges }, startID, endID, graphNodes) => {
    // Initialize as an array this time
    let filteredNodes = [];

    if ((!startID || !startID.length) && (!endID || !endID.length)) {
      // If no startID or endID, return all graphNodes as an array
      filteredNodes = Object.values(graphNodes); // Convert all graphNodes values to an array
    } else {
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

      // Populate filteredNodes array with nodes that are linked between start and end
      filteredNodes = linkedNodesBetween
        .map((nodeID) => graphNodes[nodeID])
        .filter((node) => node !== undefined);
    }

    return filteredNodes; // This is now an array
  }
);
