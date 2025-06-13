// Utility functions for extracting node and dataset status info

/**
 * Get node status and duration from nodesStatus object.
 * @param {Object} nodesStatus
 * @param {Object} node
 * @returns {{nodeStatus: string|null, nodeDuration: number|null}}
 */
export function getNodeStatusInfo(nodesStatus, node) {
  if (!nodesStatus) {
    return { nodeStatus: null, nodeDuration: null };
  }
  const statusKey = Object.keys(nodesStatus).find(
    (key) => nodesStatus[key][node.id]
  );
  if (!statusKey) {
    return { nodeStatus: null, nodeDuration: null };
  }
  const status = nodesStatus[statusKey][node.id];
  return {
    nodeStatus: status?.status ?? null,
    nodeDuration: status?.duration_sec ?? null,
  };
}

/**
 * Get dataset status and size from dataSetsStatus object.
 * @param {Object} dataSetsStatus
 * @param {Object} node
 * @returns {{datasetStatus: string|null, datasetSize: number|null}}
 */
export function getDatasetStatusInfo(dataSetsStatus, node) {
  if (!dataSetsStatus || node.type !== 'data') {
    return { datasetStatus: null, datasetSize: null };
  }
  const statusKey = Object.keys(dataSetsStatus).find(
    (key) => dataSetsStatus[key][node.id]
  );
  if (!statusKey) {
    return { datasetStatus: null, datasetSize: null };
  }
  const dataset = dataSetsStatus[statusKey][node.id];
  return {
    datasetStatus: dataset?.status ?? null,
    datasetSize: dataset?.size_bytes ?? null,
  };
}
