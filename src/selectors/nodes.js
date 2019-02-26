/**
 * Set active status if the node is specifically highlighted, and/or via an associated tag
 * @param {string} id The unique reference for a given node
 * @param {Object} pipeline Active pipeline datum
 */
const nodeIsActive = (id, { nodes, tags }) => {
  const active_node = Boolean(nodes.active[id]);
  const active_tag = nodes.tags[id].some(tag => tags.active[tag]);
  return {
    active: Boolean(active_node || active_tag),
  };
};

/**
 * Set disabled status if the node is specifically hidden, and/or via an associated tag
 * @param {string} nodeID The unique reference for a given node
 * @param {Object} pipeline Active pipeline datum
 * @param {number} enabledTagCount Number of active tag filters
 * @param {string} view Active view (combined/data/task)
 */
const nodeIsDisabled = (nodeID, { nodes, tags }, enabledTagCount, view) => {
  const disabled_node = Boolean(nodes.disabled[nodeID]);
  let disabled_tag = false;
  if (enabledTagCount > 0) {
    const nodeTags = nodes.tags[nodeID];
    if (nodeTags.length) {
      disabled_tag = !nodeTags.some(tag => tags.enabled[tag]);
    } else {
      disabled_tag = true;
    }
  }
  const disabled_view = view !== 'combined' && view !== nodes.type[nodeID];
  return {
    disabled_node,
    disabled_tag,
    disabled_view,
    disabled: Boolean(disabled_node || disabled_tag || disabled_view),
  };
};

/**
 * Get a node ID and return a single formatted node for use in the app
 * @param {string} id The unique reference for a given node
 * @param {Object} pipeline Active pipeline datum
 * @param {number} enabledTagCount Number of active tag filters
 * @param {string} view Active view (combined/data/task)
 */
export const formatNode = (id, pipeline, enabledTagCount, view) => ({
  id,
  name: id.replace(/_/g, ' '),
  tags: pipeline.nodes.tags[id],
  type: pipeline.nodes.type[id],
  ...nodeIsActive(id, pipeline),
  ...nodeIsDisabled(id, pipeline, enabledTagCount, view),
});