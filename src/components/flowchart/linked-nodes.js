/**
 * Recursively search through the edges data for ancestor and descendant nodes
 * @param {Array} edges
 * @param {string} nodeID
 */
const getLinkedNodes = (edges, nodeID) => {
  const linkedNodes = [];
  const visibleEdges = edges.filter(d =>
    d.source.type !== d.target.type &&
    !d.source.disabled &&
    !d.target.disabled
  );

  (function getParents(id) {
    visibleEdges
      .filter(d => d.target.id === id)
      .forEach(d => {
        linkedNodes.push(d.source.id);
        getParents(d.source.id);
      });
  })(nodeID);

  (function getChildren(id) {
    visibleEdges
      .filter(d => d.source.id === id)
      .forEach(d => {
        linkedNodes.push(d.target.id);
        getChildren(d.target.id);
      });
  })(nodeID);

  return linkedNodes;
};

/**
 * Provide methods to highlight linked nodes on hover,
 * and fade non-linked nodes
 */
const linkedNodes = {
  show: (edges, el, id) => {
    const linkedNodes = getLinkedNodes(edges, id);
    const nodeIsLinked = d => linkedNodes.includes(d.id) || d.id === id;

    el.nodes
      .classed('node--active', nodeIsLinked)
      .classed('node--faded', d => !nodeIsLinked(d));

    el.edges.classed('edge--faded', ({ source, target }) =>
      [source, target].some(d => !nodeIsLinked(d))
    );
  },

  hide: ({ edges, nodes }) => {
    edges.classed('edge--faded', false);
    nodes.classed('node--active', false).classed('node--faded', false);
  }
};

export default linkedNodes;
