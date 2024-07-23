import { createSelector } from 'reselect';

const getFilters = (state) => state.filters;
const getNodesNames = (state) => state.node.fullName;

export const getRunCommand = createSelector(
  [getFilters, getNodesNames],
  (filters, nodesNames) => {
    const { from, to } = filters;

    if (!from && !to) {
      return null;
    }

    const fromNodeName = nodesNames[from];
    const toNodeName = nodesNames[to];

    return `kedro run --from-nodes=${fromNodeName} --to-nodes=${toNodeName}`;
  }
);
