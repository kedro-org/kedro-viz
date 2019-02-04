export const CHANGE_ACTIVE_PIPELINE = 'CHANGE_ACTIVE_PIPELINE';

/**
 * Change which pipeline snapshot is active.
 * @param {Object} pipeline A single snapshot datum
 */
export function changeActivePipeline(pipeline) {
  return {
    type: CHANGE_ACTIVE_PIPELINE,
    pipeline
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
 * @param {number} id Snapshot kernel_ai_schema_id
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

export const UPDATE_NODE_PROPERTIES = 'UPDATE_NODE_PROPERTIES';

/**
 * Loop through the list of nodes and edges for the active snapshot,
 * and update a specified property for each to a specified value,
 * if and only if they match a provided selector rule
 * @param {Function} matchNode Conditional. Returns true if node should be updated
 * @param {string} property The node prop to be updated
 * @param {any} value The new value for the updated node property
 */
export function updateNodeProperties(matchNode, property, value) {
  return {
    type: UPDATE_NODE_PROPERTIES,
    matchNode,
    property,
    value
  };
}