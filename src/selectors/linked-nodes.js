import { createSelector } from 'reselect';

const getEdgeIDs = state => state.edge.ids;
const getEdgeSources = state => state.edge.sources;
const getEdgeTargets = state => state.edge.targets;
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
 * Recursively search through the edges data for ancestor and descendant nodes
 * @param {Array} edges
 * @param {string} nodeID
 */
export const getLinkedNodes = createSelector(
  [getEdgeIDs, getEdgeSources, getEdgeTargets, getCentralNode],
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
