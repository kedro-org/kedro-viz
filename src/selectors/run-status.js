/**
 * Selectors for run status data
 *
 * This file provides selectors for accessing the new node-ID based structured format
 * for pipeline run events data.
 */

/**
 * Get all node data grouped by node ID
 * @param {Object} state Redux state
 * @returns {Object} Nodes data grouped by node ID
 */
export const getNodesById = (state) => {
  return state.runStatus.groupedData?.nodes || {};
};

/**
 * Get all dataset data grouped by node ID
 * @param {Object} state Redux state
 * @returns {Object} Datasets data grouped by node ID
 */
export const getDatasetsById = (state) => {
  return state.runStatus.groupedData?.datasets || {};
};

/**
 * Get pipeline run metadata
 * @param {Object} state Redux state
 * @returns {Object} Pipeline run metadata
 */
export const getPipelineRunData = (state) => {
  return state.runStatus.groupedData?.pipeline || {};
};

/**
 * Get the status of a node by ID
 * @param {Object} state Redux state
 * @param {String} nodeId Node ID
 * @returns {Object} Node status data
 */
export const getNodeStatusById = (state, nodeId) => {
  return state.runStatus.groupedData?.nodes?.[nodeId];
};

/**
 * Get the status of a dataset by ID
 * @param {Object} state Redux state
 * @param {String} datasetId Dataset ID
 * @returns {Object} Dataset status data
 */
export const getDatasetStatusById = (state, datasetId) => {
  return state.runStatus.groupedData?.datasets?.[datasetId];
};

/**
 * Get the duration of a node by ID
 * @param {Object} state Redux state
 * @param {String} nodeId Node ID
 * @returns {Number} Node duration in seconds
 */
export const getNodeDurationById = (state, nodeId) => {
  return state.runStatus.groupedData?.nodes?.[nodeId]?.durationSec || 0;
};

/**
 * Check if a node has failed
 * @param {Object} state Redux state
 * @param {String} nodeId Node ID
 * @returns {Boolean} Whether the node has failed
 */
export const hasNodeFailed = (state, nodeId) => {
  const node = state.runStatus.groupedData?.nodes?.[nodeId];
  return node?.status === 'error' || node?.status === 'failed';
};

/**
 * Get error message for a failed node
 * @param {Object} state Redux state
 * @param {String} nodeId Node ID
 * @returns {String|null} Error message or null if the node hasn't failed
 */
export const getNodeError = (state, nodeId) => {
  const node = state.runStatus.groupedData?.nodes?.[nodeId];
  return node?.status === 'error' || node?.status === 'failed'
    ? node?.error
    : null;
};

/**
 * Get run status loading state
 * @param {Object} state Redux state
 * @returns {Boolean} Whether run status data is loading
 */
export const getRunStatusLoading = (state) => {
  return state.runStatus.loading;
};

/**
 * Get run status error
 * @param {Object} state Redux state
 * @returns {String|null} Error message or null if there's no error
 */
export const getRunStatusError = (state) => {
  return state.runStatus.error;
};
