/**
 * Recursively search through the edges data for ancestor and descendant nodes
 * @param {Array} edges
 * @param {string} nodeID
 */
const getLinkedNodes = (edges, nodeID) => {
  const linkedNodes = [];

  (function getParents(id) {
    edges
      .filter(d => d.target === id)
      .forEach(d => {
        linkedNodes.push(d.source);
        getParents(d.source);
      });
  })(nodeID);

  (function getChildren(id) {
    edges
      .filter(d => d.source === id)
      .forEach(d => {
        linkedNodes.push(d.target);
        getChildren(d.target);
      });
  })(nodeID);

  return linkedNodes;
};

/**
 * Provide methods to highlight linked nodes on hover,
 * and fade non-linked nodes
 */
const linkedNodes = {
  show: ({ edges, el }, id) => {
    const linkedNodes = getLinkedNodes(edges, id);
    const nodeIsLinked = nodeID =>
      linkedNodes.includes(nodeID) || nodeID === id;

    el.nodes
      .classed('node--active', node => nodeIsLinked(node.id))
      .classed('node--faded', node => !nodeIsLinked(node.id));

    el.edges.classed('edge--faded', ({ source, target }) =>
      [source, target].some(nodeID => !nodeIsLinked(nodeID))
    );
  },

  hide: ({ edges, nodes }) => {
    edges.classed('edge--faded', false);
    nodes.classed('node--active', false).classed('node--faded', false);
  }
};

export default linkedNodes;
