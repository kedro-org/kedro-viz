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
      sourceEdges[edge.target] = sourceEdges[edge.target] || [];
      sourceEdges[edge.target].push(edge);
    }

    for (const edge of edges) {
      targetEdges[edge.source] = targetEdges[edge.source] || [];
      targetEdges[edge.source].push(edge);
    }

    return { sourceEdges, targetEdges };
  }
);

/**
 * Finds all visible successors for the given nodeID in given direction
 * @param {string} nodeID
 * @param {Object} edgesByNode
 * @param {string} direction
 * @param {?Array} result
 * @param {?object} visited
 * @param {?Array} empty
 */
const findLinkedNodes = (
  nodeId,
  edgesByNode,
  direction,
  result = [],
  visited = {},
  empty = []
) => {
  if (visited[nodeId]) {
    return result;
  }

  visited[nodeId] = true;
  result.push(nodeId);

  (edgesByNode[nodeId] || empty).forEach(edge =>
    findLinkedNodes(
      edge[direction],
      edgesByNode,
      direction,
      result,
      visited,
      empty
    )
  );

  return result;
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

    const nodeIDs = findLinkedNodes(nodeID, sourceEdges, 'source').concat(
      findLinkedNodes(nodeID, targetEdges, 'target')
    );

    const linkedNodes = {};

    for (const nodeID of nodeIDs) {
      linkedNodes[nodeID] = true;
    }

    return linkedNodes;
  }
);
