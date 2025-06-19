/**
 * Selectors for run status data
 *
 * This file provides selectors for accessing the new node-ID based structured format
 * for pipeline run data.
 */

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
  return state.runStatus?.nodes?.[nodeId]?.durationSec || 0;
};

/**
 * Check if a node has failed
 * @param {Object} state Redux state
 * @param {String} nodeId Node ID
 * @returns {Boolean} Whether the node has failed
 */
export const hasNodeFailed = (state, nodeId) => {
  const node = state.runStatus?.nodes?.[nodeId];
  return node?.status === 'Failed';
};

/**
 * Check if a dataset is missing
 * @param {Object} state Redux state
 * @param {String} nodeId Node ID
 * @returns {Boolean} Whether the node has failed
 */
export const hasDatasetMissing = (state, nodeId) => {
  const node = state.runStatus?.datasets?.[nodeId];
  return node?.status === 'Missing';
};

/**
 * Get error message for a failed node
 * @param {Object} state Redux state
 * @param {String} nodeId Node ID
 * @returns {String|null} Error message or null if the node hasn't failed
 */
export const getNodeError = (state, nodeId) => {
  const node = state.runStatus?.nodes?.[nodeId];
  return node?.status === 'Failed' ? node?.error : null;
};

/**
 * Get error message for a missing dataset
 * @param {Object} state Redux state
 * @param {String} nodeId Node ID
 * @returns {String|null} Error message or null if the dataset hasn't missing
 */
export const getDatasetError = (state, nodeId) => {
  const dataset = state.runStatus?.datasets?.[nodeId];
  return dataset?.status === 'Missing' ? dataset?.error : null;
};
