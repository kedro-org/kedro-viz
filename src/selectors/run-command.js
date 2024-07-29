import { createSelector } from 'reselect';

const getSlicedPipeline = (state) => state.slice;
const getNodesNames = (state) => state.node.fullName;

export const getRunCommand = createSelector(
  [getSlicedPipeline, getNodesNames],
  (slicedPipeline, nodesNames) => {
    const { from, to } = slicedPipeline;

    if (!from && !to) {
      return null;
    }

    const fromNodeName = nodesNames[from];
    const toNodeName = nodesNames[to];

    return `kedro run --from-nodes=${fromNodeName} --to-nodes=${toNodeName}`;
  }
);
