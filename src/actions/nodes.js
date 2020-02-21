export const TOGGLE_NODE_CLICKED = 'TOGGLE_NODE_CLICKED';

/**
 * Update the value of the currently-active clicked node
 * @param {string|null} nodeClicked The node's unique identifier
 */
export function toggleNodeClicked(nodeClicked) {
  return {
    type: TOGGLE_NODE_CLICKED,
    nodeClicked
  };
}

export const TOGGLE_NODES_DISABLED = 'TOGGLE_NODES_DISABLED';

/**
 * Toggle a selected group of nodes' visibility on/off
 * @param {Array} nodeIDs The nodes' unique identifiers
 * @param {Boolean} isDisabled Whether the node should be visible
 */
export function toggleNodesDisabled(nodeIDs, isDisabled) {
  return {
    type: TOGGLE_NODES_DISABLED,
    nodeIDs,
    isDisabled
  };
}

export const TOGGLE_NODE_HOVERED = 'TOGGLE_NODE_HOVERED';

/**
 * Update the value of the currently-active hovered node
 * @param {string|null} nodeHovered The node's unique identifier
 */
export function toggleNodeHovered(nodeHovered) {
  return {
    type: TOGGLE_NODE_HOVERED,
    nodeHovered
  };
}
