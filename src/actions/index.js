export const CHANGE_ACTIVE_PIPELINE = 'CHANGE_ACTIVE_PIPELINE';
export function changeActivePipeline(pipeline) {
  return {
    type: CHANGE_ACTIVE_PIPELINE,
    pipeline
  };
}

export const CHANGE_VIEW = 'CHANGE_VIEW';
export function changeView(view) {
  return {
    type: CHANGE_VIEW,
    view
  };
}

export const DELETE_SNAPSHOT = 'DELETE_SNAPSHOT';
export function deleteSnapshot(id) {
  return {
    type: DELETE_SNAPSHOT,
    id
  };
}

export const RESET_SNAPSHOT_DATA = 'RESET_SNAPSHOT_DATA';
export function resetSnapshotData(snapshots) {
  return {
    type: RESET_SNAPSHOT_DATA,
    snapshots
  };
}

export const TOGGLE_PARAMETERS = 'TOGGLE_PARAMETERS';
export function toggleParameters(parameters) {
  return {
    type: TOGGLE_PARAMETERS,
    parameters
  };
}

export const TOGGLE_TEXT_LABELS = 'TOGGLE_TEXT_LABELS';
export function toggleTextLabels(textLabels) {
  return {
    type: TOGGLE_TEXT_LABELS,
    textLabels
  };
}

export const UPDATE_NODE_PROPERTIES = 'UPDATE_NODE_PROPERTIES';
export function updateNodeProperties(matchNode, property, value) {
  return {
    type: UPDATE_NODE_PROPERTIES,
    matchNode,
    property,
    value
  };
}