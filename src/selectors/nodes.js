/**
 * Set active status if the node is specifically highlighted, and/or via an associated tag
 * @param {string} id The unique reference for a given node
 * @param {Object} pipeline Active pipeline datum
 * @param {number} enabledTagCount Number of active tag filters
 */
const nodeIsActive = (id, { nodes, tags }) => {
  const active_node = nodes.active[id];
  const active_tag = nodes.tags[id].some(tag => tags.active[tag]);
  return {
    active_node,
    active_tag,
    active: Boolean(active_node || active_tag),
  };
};

/**
 * Set disabled status if the node is specifically hidden, and/or via an associated tag
 * @param {string} nodeID The unique reference for a given node
 * @param {Object} pipeline Active pipeline datum
 * @param {number} enabledTagCount Number of active tag filters
 */
const nodeIsDisabled = (nodeID, { nodes, tags }, enabledTagCount) => {
  const disabled_node = nodes.disabled[nodeID];
  let disabled_tag = false;
  if (enabledTagCount > 0) {
    const nodeTags = nodes.tags[nodeID];
    if (nodeTags.length) {
      disabled_tag = !nodeTags.some(tag => tags.enabled[tag]);
    } else {
      disabled_tag = true;
    }
  }
  return {
    disabled_node,
    disabled_tag,
    disabled: Boolean(disabled_node || disabled_tag),
  };
};

/**
 * Get a node ID and return a single formatted node for use in the app
 * @param {string} id The unique reference for a given node
 * @param {Object} pipeline Active pipeline datum
 * @param {number} enabledTagCount Number of active tag filters
 */
export const formatNode = (id, pipeline, enabledTagCount) => ({
  id,
  name: id.replace(/_/g, ' '),
  tags: pipeline.nodes.tags[id],
  type: pipeline.nodes.type[id],
  ...nodeIsActive(id, pipeline),
  ...nodeIsDisabled(id, pipeline, enabledTagCount),
});