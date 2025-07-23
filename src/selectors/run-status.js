import { createSelector } from 'reselect';

function groupByErrorStatus(items) {
  const status = { success: {}, failed: {} };
  Object.entries(items || {}).forEach(([id, item]) => {
    if (item.error) {
      status.failed[id] = item;
    } else {
      status.success[id] = item;
    }
  });
  return status;
}

export const getDatasetsStatus = createSelector(
  [(state) => state.runStatus.datasets],
  groupByErrorStatus
);

export const getNodesStatus = createSelector(
  [(state) => state.runStatus.nodes],
  groupByErrorStatus
);

/**
 * Check if the pipeline run status is available
 * @param {Object} state Redux state
 * @returns {Boolean} Whether the run status is available
 */
export const isRunStatusAvailable = createSelector(
  [
    (state) => state.runStatus?.nodes,
    (state) => state.runStatus?.datasets,
    (state) => state.runStatus?.pipeline?.runId,
  ],
  (nodes, datasets, runId) => {
    // Check if we have actual run data (not just empty objects) and a valid run ID
    const hasNodes = nodes && Object.keys(nodes).length > 0;
    const hasDatasets = datasets && Object.keys(datasets).length > 0;
    const hasValidRunId = runId && runId !== 'default-run-id';

    return (hasNodes || hasDatasets) && hasValidRunId;
  }
);

/**
 * Get pipeline run metadata
 * @param {Object} state Redux state
 * @returns {Object} Pipeline run metadata
 */
export const getPipelineRunData = (state) => {
  return state.runStatus?.pipeline || {};
};

/**
 * Get error message for a failed node
 * @param {Object} state Redux state
 * @param {String} nodeId Node ID
 * @returns {String|null} Error message or null if the node hasn't failed
 */
export const getNodeError = (state, nodeId) => {
  const node = state.runStatus?.nodes?.[nodeId];
  return node?.error;
};

/**
 * Get error message for a missing dataset
 * @param {Object} state Redux state
 * @param {String} nodeId Node ID
 * @returns {String|null} Error message or null if the dataset hasn't missing
 */
export const getDatasetError = (state, nodeId) => {
  const dataset = state.runStatus?.datasets?.[nodeId];
  return dataset?.error;
};
