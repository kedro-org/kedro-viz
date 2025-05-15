import { createSelector } from 'reselect';

export const getNodesStatus = createSelector(
  [(state) => state.status.nodes],
  (nodes = {}) => {
    const status = {};
    Object.entries(nodes).forEach(([id, node]) => {
      const nodeStatus = node.status;
      if (!status[nodeStatus]) {
        status[nodeStatus] = {};
      }
      status[nodeStatus][id] = node;
    });

    return status;
  }
);