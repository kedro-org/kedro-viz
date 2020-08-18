import { createSelector } from 'reselect';
import { getVisibleEdges } from './edges';

const getClickedNode = state => state.node.clicked;
const getHoveredNode = state => state.node.hovered;

/**
 * Get the node that should be used as the center of the set of linked nodes
 * @param {Array} edges
 * @param {string} nodeID
 */
export const getCentralNode = createSelector(
  [getClickedNode, getHoveredNode],
  (clickedNode, hoveredNode) => clickedNode || hoveredNode
);

/**
 * Gets a map of visible nodeIDs to successors nodeIDs in both directions
 * @param {Array} edges
 */
export const getVisibleEdgesByNode = createSelector(
  [getVisibleEdges],
  edges => {
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
 * @param {string} nodeID the starting nodeID
 * @param {Object} edgesByNode an object mapping nodeIDs to successor nodeIDs
 * @param {object} visited an object for storing all visited node ids
 * @returns {object} the supplied `visited` object
 */
const findLinkedNodes = (nodeID, edgesByNode, visited) => {
  if (!visited[nodeID]) {
    visited[nodeID] = true;

    if (edgesByNode[nodeID]) {
      edgesByNode[nodeID].forEach(nodeID =>
        findLinkedNodes(nodeID, edgesByNode, visited)
      );
    }
  }

  return visited;
};

/**
 * Gets all visible ancestors and descendents for the given nodeID
 * @param {Object} visibleEdgeMaps
 * @param {string} nodeID
 */
export const getLinkedNodes = createSelector(
  [getVisibleEdgesByNode, getCentralNode],
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
