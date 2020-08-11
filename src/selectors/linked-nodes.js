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
 * Gets a map of nodeIDs to the visible source edges and target edges
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

      sourceEdges[edge.target].push(edge);

      if (!targetEdges[edge.source]) {
        targetEdges[edge.source] = [];
      }

      targetEdges[edge.source].push(edge);
    }

    return { sourceEdges, targetEdges };
  }
);

/**
 * Finds all visible successor for the given nodeID in given direction
 * @param {string} nodeID the starting nodeID
 * @param {Object} edgesByNode an object mapping nodeIDs to edges
 * @param {string} direction 'source' or 'target', direction to traverse along each edge
 * @param {object} visited an object for storing all visited node ids
 * @returns {object} the supplied `visited` object
 */
const findLinkedNodes = (nodeID, edgesByNode, direction, visited) => {
  if (!visited[nodeID]) {
    visited[nodeID] = true;

    if (edgesByNode[nodeID]) {
      edgesByNode[nodeID].forEach(edge =>
        findLinkedNodes(edge[direction], edgesByNode, direction, visited)
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
    findLinkedNodes(nodeID, sourceEdges, 'source', linkedNodes);

    linkedNodes[nodeID] = false;
    findLinkedNodes(nodeID, targetEdges, 'target', linkedNodes);

    return linkedNodes;
  }
);
