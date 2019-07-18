/**
 * Recursively search through the edges data for ancestor and descendant nodes
 * @param {Array} edges
 * @param {string} nodeID
 */
export const getLinkedNodes = (edges, nodeID) => {
  const linkedNodes = {
    [nodeID]: true
  };

  const traverseGraph = (prev, next) => {
    (function walk(id) {
      edges.forEach(edge => {
        if (edge[prev] === id) {
          linkedNodes[edge[next]] = true;
          walk(edge[next]);
        }
      });
    })(nodeID);
  };

  const direction = ['source', 'target'];
  traverseGraph.apply(null, direction);
  traverseGraph.apply(null, direction.reverse());

  return linkedNodes;
};

/**
 * Provide methods to highlight linked nodes on hover,
 * and fade non-linked nodes
 */
const linkedNodes = {
  /**
   * Show linked nodes and fade unlinked nodes
   * @param {Object} p.edges List of edge objects
   * @param {Object} p.el D3 element selections
   * @param {String} p.nodeID A node's unique ID
   */
  show: ({ edges, el, nodeID }) => {
    const linkedNodes = getLinkedNodes(edges, nodeID);
    const nodeIsLinked = id => linkedNodes[id];

    el.nodes
      .classed('node--highlight', node => nodeIsLinked(node.id))
      .classed('node--faded', node => !nodeIsLinked(node.id));

    el.edges.classed('edge--faded', ({ source, target }) =>
      [source, target].some(nodeID => !nodeIsLinked(nodeID))
    );
  },

  /**
   * Reset nodes and edges to normal
   * @param {Object} p.edges D3 edge element selection
   * @param {Object} p.nodes D3 node element selection
   */
  hide: ({ edges, nodes }) => {
    edges.classed('edge--faded', false);
    nodes.classed('node--highlight', false).classed('node--faded', false);
  }
};

export default linkedNodes;
