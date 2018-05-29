/**
 * Recursively search through the edges data for ancestor and descendant nodes
 * @param {Object} data
 * @param {string} nodeID
 */
const getLinkedNodes = (data, nodeID) => {
  const linkedNodes = [];
  const edges = data.edges.filter(
    d =>
      d.source.type !== d.target.type &&
      !d.source.disabled &&
      !d.target.disabled
  );

  (function getParents(id) {
    edges.filter(d => d.target.id === id).forEach(d => {
      linkedNodes.push(d.source.id);
      getParents(d.source.id);
    });
  })(nodeID);

  (function getChildren(id) {
    edges.filter(d => d.source.id === id).forEach(d => {
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
const linkedNodes = ({ props, el }) => {
  const { nodes, edges } = el;

  return {
    show: ({ id }) => {
      const linkedNodes = getLinkedNodes(props.data, id);
      const nodeIsLinked = d => linkedNodes.includes(d.id) || d.id === id;

      nodes
        .classed('node--active', nodeIsLinked)
        .classed('node--faded', d => !nodeIsLinked(d));

      edges.classed('edge--faded', ({ source, target }) =>
        [source, target].some(d => !nodeIsLinked(d))
      );
    },

    hide: () => {
      edges.classed('edge--faded', false);
      nodes.classed('node--active', false).classed('node--faded', false);
    }
  };
};

export default linkedNodes;
