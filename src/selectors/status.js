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
  [(state) => state.status.datasets],
  groupByErrorStatus
);

export const getNodesStatus = createSelector(
  [(state) => state.status.nodes],
  groupByErrorStatus
);
