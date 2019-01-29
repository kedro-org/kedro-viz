/**
 * Update a specific property for all of the nodes when a condition is met
 * @param {Object} pipelineData Active pipeline data
 * @param {Function} matchNode Conditional. Returns true if node should be updated.
 * @param {string} property The node prop to be updated
 * @param {any} value The new value for the updated node property
 */
const updateNodeProperties = ({
  pipelineData,
  matchNode,
  property,
  value
}) => {
  const nodes = pipelineData.nodes.map(node => {
    const newNode = {};
    if (matchNode(node)) {
      newNode[property] = value;
    }
    return Object.assign({}, node, newNode);
  });
  const edges = pipelineData.edges.map(edge => {
    return {
      source: nodes.find(d => d.id === edge.source.id),
      target: nodes.find(d => d.id === edge.target.id)
    };
  });
  return Object.assign({}, pipelineData, { nodes, edges });
}

export default updateNodeProperties