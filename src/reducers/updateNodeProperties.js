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
    if (matchNode(node)) {
      node[property] = value;
    }
    return node;
  });
  return Object.assign({}, pipelineData, { nodes });
}

export default updateNodeProperties