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
    (state) => state.runStatus?.pipeline?.run_id,
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
 * Get all node data grouped by node ID
 * @param {Object} state Redux state
 * @returns {Object} Nodes data grouped by node ID
 */
export const getNodesById = (state) => {
  return state.runStatus?.nodes || {};
};

/**
 * Get all dataset data grouped by node ID
 * @param {Object} state Redux state
 * @returns {Object} Datasets data grouped by node ID
 */
export const getDatasetsById = (state) => {
  return state.runStatus?.datasets || {};
};

/**
 * Get pipeline run metadata
 * @param {Object} state Redux state
 * @returns {Object} Pipeline run metadata
 */
export const getPipelineRunData = (state) => {
  return state.runStatus?.pipeline || {};
};

/**
 * Get the status of a node by ID
 * @param {Object} state Redux state
 * @param {String} nodeId Node ID
 * @returns {Object} Node status data
 */
export const getNodeStatusById = (state, nodeId) => {
  return state.runStatus?.nodes?.[nodeId];
};

/**
 * Get the status of a dataset by ID
 * @param {Object} state Redux state
 * @param {String} datasetId Dataset ID
 * @returns {Object} Dataset status data
 */
export const getDatasetStatusById = (state, datasetId) => {
  return state.runStatus?.datasets?.[datasetId];
};

/**
 * Get the duration of a node by ID
 * @param {Object} state Redux state
 * @param {String} nodeId Node ID
 * @returns {Number} Node duration in seconds
 */
export const getNodeDurationById = (state, nodeId) => {
  return state.runStatus?.nodes?.[nodeId]?.duration || 0;
};

/**
 * Check if a node has failed
 * @param {Object} state Redux state
 * @param {String} nodeId Node ID
 * @returns {Boolean} Whether the node has failed
 */
export const hasNodeFailed = (state, nodeId) => {
  const node = state.runStatus?.nodes?.[nodeId];
  return node?.error != null;
};

/**
 * Get error message for a failed node
 * @param {Object} state Redux state
 * @param {String} nodeId Node ID
 * @returns {String|null} Error message or null if the node hasn't failed
 */
export const getNodeError = (state, nodeId) => {
  const node = state.runStatus?.nodes?.[nodeId];
  return node?.error || null;
};
