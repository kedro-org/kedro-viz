// Utility functions for extracting node and dataset status info

/**
 * Get node status and duration from tasksStatus object.
 * @param {Object} tasksStatus
 * @param {Object} node
 * @returns {{taskStatus: string|null, taskDuration: number|null}}
 */
export function getTasksStatusInfo(tasksStatus, node) {
  if (!tasksStatus) {
    return { taskStatus: null, taskDuration: null };
  }
  const statusKey = Object.keys(tasksStatus).find(
    (key) => tasksStatus[key][node.id]
  );
  if (!statusKey) {
    return { taskStatus: null, taskDuration: null };
  }
  const status = tasksStatus[statusKey][node.id];
  return {
    taskStatus: status?.status ?? null,
    taskDuration: status?.duration_sec ?? null,
  };
}

/**
 * Get dataset status and size from dataSetsStatus object.
 * @param {Object} dataSetsStatus
 * @param {Object} node
 * @returns {{datasetStatus: string|null, datasetSize: number|null}}
 */
export function getDatasetStatusInfo(datasetStatus, node) {
  if (!datasetStatus || node.type !== 'data') {
    return { datasetStatus: null, datasetSize: null };
  }
  const statusKey = Object.keys(datasetStatus).find(
    (key) => datasetStatus[key][node.id]
  );
  if (!statusKey) {
    return { datasetStatus: null, datasetSize: null };
  }
  const dataset = datasetStatus[statusKey][node.id];
  return {
    datasetStatus: dataset?.status ?? null,
    datasetSize: dataset?.size_bytes ?? null,
  };
}
