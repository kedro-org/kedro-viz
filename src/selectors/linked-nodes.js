import { createSelector } from 'reselect';

const getEdges = state => state.edges;
const getEdgeSources = state => state.edgeSources;
const getEdgeTargets = state => state.edgeTargets;
const getClickedNode = state => state.nodeClicked;
const getHoveredNode = state => state.nodeHovered;

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
 * Recursively search through the edges data for ancestor and descendant nodes
 * @param {Array} edges
 * @param {string} nodeID
 */
export const getLinkedNodes = createSelector(
  [getEdges, getEdgeSources, getEdgeTargets, getCentralNode],
  (edges, edgeSources, edgeTargets, nodeID) => {
    if (!nodeID) {
      return {};
    }

    const linkedNodes = {
      [nodeID]: true
    };

    const traverseGraph = (prev, next) => {
      (function walk(id) {
        edges.forEach(edge => {
          if (prev[edge] === id) {
            linkedNodes[next[edge]] = true;
            walk(next[edge]);
          }
        });
      })(nodeID);
    };

    const direction = [edgeSources, edgeTargets];
    traverseGraph.apply(null, direction);
    traverseGraph.apply(null, direction.reverse());

    return linkedNodes;
  }
);
