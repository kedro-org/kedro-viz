import { createSelector } from 'reselect';

const getSlicedPipeline = (state) => state.slice;
const getNodesNames = (state) => state.node.fullName;
const getModularPipeline = (state) => state.node.modularPipelines;
const getNodesTypes = (state) => state.node.type;

export const getRunCommand = createSelector(
  [getSlicedPipeline, getNodesNames, getNodesTypes],
  (slicedPipeline, nodesNames, nodesTypes) => {
    const { from, to } = slicedPipeline;

    if (!from || !to) {
      return null;
    }

    const fromNodeName = nodesNames[from];
    const toNodeName = nodesNames[to];
    const fromNodeType = nodesTypes[from];
    const toNodeType = nodesTypes[to];

    // Determine the correct flag based on the node type
    const fromFlag = fromNodeType === 'data' ? '--from-inputs' : '--from-nodes';
    const toFlag = toNodeType === 'data' ? '--to-outputs' : '--to-nodes';

    return `kedro run ${fromFlag}=${fromNodeName} ${toFlag}=${toNodeName}`;
  }
);
