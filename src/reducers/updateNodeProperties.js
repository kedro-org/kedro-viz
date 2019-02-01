/**
 * Loop through the list of nodes and edges for the active snapshot,
 * and update a specified property for each to a specied value,
 * if and only if they match a provided selector rule
 * @param {Object} snapshot Active pipeline data
 * @param {Function} matchNode Conditional. Returns true if node should be updated
 * @param {string} property The node prop to be updated
 * @param {any} value The new value for the updated node property
 */
const updateNodeProperties = ({
  snapshot,
  matchNode,
  property,
  value
}) => {
  // Update specified nodes for the active snapshot
  const nodes = snapshot.nodes.map(node => {
    const newNode = {};
    // Check whether the node passes the test, and if so, update it
    if (matchNode(node)) {
      newNode[property] = value;
    }
    // Create a new object to avoid mutating the state
    return Object.assign({}, node, newNode);
  });

  // Update all the edges to ensure they reference the newly-created objects
  const edges = snapshot.edges.map(edge => {
    return {
      source: nodes.find(d => d.id === edge.source.id),
      target: nodes.find(d => d.id === edge.target.id)
    };
  });

  return Object.assign({}, snapshot, { nodes, edges });
}

export default updateNodeProperties