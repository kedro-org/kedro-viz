import { createSelector } from 'reselect';

export const getDatSetsStatus = createSelector(
  [(state) => state.status.datasets],
  (datasetsStatus) => {
    const status = { failed: {}, success: {} };
    Object.entries(datasetsStatus || {}).forEach(([id, dataset]) => {
      if (dataset.error) {
        status.failed[id] = dataset;
      } else {
        status.success[id] = dataset;
      }
    });
    return status;
  }
);

export const getNodesStatus = createSelector(
  [(state) => state.status.nodes],
  (nodesStatus) => {
    const status = {};
    Object.entries(nodesStatus).forEach(([id, node]) => {
      const nodeStatus = node.status;
      if (!status[nodeStatus]) {
        status[nodeStatus] = {};
      }
      status[nodeStatus][id] = node;
    });

    return status;
  }
);
