import { createSelector } from 'reselect';

const getSlicedPipelineState = (state) => state.slice;
const getNodesRunCommand = (state) => state.node.runCommand;

export const getRunCommand = createSelector(
  [getSlicedPipelineState, getNodesRunCommand],
  (slicedPipelineState, nodeRunCommand) => {
    const { from, to } = slicedPipelineState;

    if (!from || !to) {
      return null;
    }

    const slicingPipelineCommand =
      nodeRunCommand[to] || 'please define a run command for this node';
    return slicingPipelineCommand;
  }
);
