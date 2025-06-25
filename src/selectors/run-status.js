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
