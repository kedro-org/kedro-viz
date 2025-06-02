/**
 * Creates a mapping of node IDs to a boolean indicating if the node ID is included in the given values.
 * @param {Array} nodes - Array of nodes to process.
 * @param {Array} values - Array of values to check against node IDs.
 * @returns {Object} An object mapping node IDs to booleans.
 */
export function createNodeStateMap(nodes, values) {
  const valueSet = new Set(values); // Convert to Set for efficient lookup
  return nodes.reduce((acc, { id }) => {
    acc[id] = valueSet.has(id);
    return acc;
  }, {});
}
