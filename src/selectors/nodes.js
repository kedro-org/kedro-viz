/**
 * Get a node ID and return a single formatted node for use in the app
 * @param {string} id The unique reference for a given node
 * @param {Object} pipeline Active pipeline datum
 * @param {number} enabledTagCount Number of active tag filters
 * @param {string} view Active view (combined/data/task)
 * @return {Object} A single node datum
 */
export const formatNode = (nodeID, pipeline, enabledTagCount, view) => {
  const { nodes, tags } = pipeline;

  /**
   * Set active status if the node is specifically highlighted, and/or via an associated tag
   * @return {Boolean} True if active
   */
  const nodeIsActive = () => {
    const active_node = Boolean(nodes.active[nodeID]);
    const active_tag = nodes.tags[nodeID].some(tag => tags.active[tag]);
    return Boolean(active_node || active_tag);
  };

  /**
   * Determine whether a node should be disabled based on its associated tags
   * @return {Boolean} True if disabled
   */
  const nodeTagIsDisabled = () => {
    if (enabledTagCount === 0) {
      return false;
    }
    if (nodes.tags[nodeID].length) {
      // Hide task nodes that don't have at least one tag filter enabled
      return !nodes.tags[nodeID].some(tag => tags.enabled[tag]);
    } else if (nodes.type[nodeID] === 'data') {
      // Hide data nodes that aren't linked to one of the visible task nodes
      return !nodes.links[nodeID].some(linkedNode => 
        nodes.tags[linkedNode].some(tag => tags.enabled[tag])
      );
    }
    return true;
  };

  /**
   * Set disabled status if the node is specifically hidden, and/or via a tag/view
   * @return {Object} Show whether disabled via node/tag/view, and the combined value
   */
  const nodeIsDisabled = () => {
    const disabled_node = Boolean(nodes.disabled[nodeID]);
    const disabled_tag = nodeTagIsDisabled();
    const disabled_view = view !== 'combined' && view !== nodes.type[nodeID];
    return {
      disabled_node,
      disabled_tag,
      disabled_view,
      disabled: Boolean(disabled_node || disabled_tag || disabled_view),
    };
  };

  return {
    id: nodeID,
    name: nodeID.replace(/_/g, ' '),
    links: pipeline.nodes.links[nodeID],
    tags: pipeline.nodes.tags[nodeID],
    type: pipeline.nodes.type[nodeID],
    active: nodeIsActive(),
    ...nodeIsDisabled(),
  };
};