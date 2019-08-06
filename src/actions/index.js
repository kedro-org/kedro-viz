export const CHANGE_ACTIVE_SNAPSHOT = 'CHANGE_ACTIVE_SNAPSHOT';

/**
 * Change which pipeline snapshot is active.
 * @param {string} snapshotID A single snapshot ID
 */
export function changeActiveSnapshot(snapshotID) {
  return {
    type: CHANGE_ACTIVE_SNAPSHOT,
    snapshotID
  };
}

export const CHANGE_VIEW = 'CHANGE_VIEW';

/**
 * Change the view mode, which handles how the nodes should be filtered.
 * @param {string} view One of 'combined', 'data', or 'task'
 */
export function changeView(view) {
  return {
    type: CHANGE_VIEW,
    view
  };
}

export const DELETE_SNAPSHOT = 'DELETE_SNAPSHOT';

/**
 * Select a snapshot and delete it. If handler is passed via App
 * 'onDeleteSnapshot' prop then use that, else use native method.
 * @param {string} id Snapshot id
 */
export function deleteSnapshot(id) {
  return {
    type: DELETE_SNAPSHOT,
    id
  };
}

export const RESET_SNAPSHOT_DATA = 'RESET_SNAPSHOT_DATA';

/**
 * Overwrite the existing data store when receiving
 * new snapshot data from upstream
 * @param {Array} snapshots List of snapshot objects
 */
export function resetSnapshotData(snapshots) {
  return {
    type: RESET_SNAPSHOT_DATA,
    snapshots
  };
}

export const TOGGLE_NODE_ACTIVE = 'TOGGLE_NODE_ACTIVE';

/**
 * Toggle a node's highlighting on/off
 * @param {string} nodeID The node's unique identifier
 * @param {Boolean} isActive Whether the node should be active
 */
export function toggleNodeActive(nodeID, isActive) {
  return {
    type: TOGGLE_NODE_ACTIVE,
    nodeID,
    isActive
  };
}

export const TOGGLE_NODE_DISABLED = 'TOGGLE_NODE_DISABLED';

/**
 * Toggle a node's visibility on/off
 * @param {string} nodeID The node's unique identifier
 * @param {Boolean} isDisabled Whether the node should be visible
 */
export function toggleNodeDisabled(nodeID, isDisabled) {
  return {
    type: TOGGLE_NODE_DISABLED,
    nodeID,
    isDisabled
  };
}

export const TOGGLE_NODE_FOCUSED = 'TOGGLE_NODE_FOCUSED';

/**
 * Update the value of the currently-focused node
 * @param {string|null} nodeFocused The node's unique identifier
 */
export function toggleNodeFocused(nodeFocused) {
  return {
    type: TOGGLE_NODE_FOCUSED,
    nodeFocused
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

export const TOGGLE_PARAMETERS = 'TOGGLE_PARAMETERS';

/**
 * Toggle whether to show Parameters on/off
 * @param {Boolean} parameters Whether to show Parameters
 */
export function toggleParameters(parameters) {
  return {
    type: TOGGLE_PARAMETERS,
    parameters
  };
}

export const TOGGLE_TEXT_LABELS = 'TOGGLE_TEXT_LABELS';

/**
 * Toggle whether to show text labels on/off
 * @param {Boolean} textLabels True if text labels are to be shown
 */
export function toggleTextLabels(textLabels) {
  return {
    type: TOGGLE_TEXT_LABELS,
    textLabels
  };
}

export const TOGGLE_TAG_ACTIVE = 'TOGGLE_TAG_ACTIVE';

/**
 * Toggle a tag's highlighting on/off
 * @param {string} tagID Tag id
 * @param {Boolean} active True if tag is active
 */
export function toggleTagActive(tagID, active) {
  return {
    type: TOGGLE_TAG_ACTIVE,
    tagID,
    active
  };
}

export const TOGGLE_TAG_FILTER = 'TOGGLE_TAG_FILTER';

/**
 * Toggle a tag on/off
 * @param {string} tagID Tag id
 * @param {Boolean} enabled True if tag is enabled
 */
export function toggleTagFilter(tagID, enabled) {
  return {
    type: TOGGLE_TAG_FILTER,
    tagID,
    enabled
  };
}

export const TOGGLE_THEME = 'TOGGLE_THEME';

/**
 * Switch between light/dark theme
 * @param {string} theme Theme name
 */
export function toggleTheme(theme) {
  return {
    type: TOGGLE_THEME,
    theme
  };
}

export const UPDATE_CHART_SIZE = 'UPDATE_CHART_SIZE';

/**
 * Store the chart size, based on the window
 * @param {Object} chartSize getBoundingClientRect value
 */
export function updateChartSize(chartSize) {
  return {
    type: UPDATE_CHART_SIZE,
    chartSize
  };
}
