import { createSelector } from 'reselect';
import { prettifyName } from '../utils';

const getClickedNode = (state) => state.node.clicked;
const getActivePipeline = (state) => state.pipeline.active;

/**
 * Returns true if run command should be visible
 */
export const getVisibleRunCommand = createSelector(
  [getClickedNode, getActivePipeline],
  (nodeClicked, activePipeline) => {
    return Boolean(nodeClicked) || Boolean(activePipeline);
  }
);

export const getRunCommand = createSelector(
  [getClickedNode, (state) => state.node.runCommand, getActivePipeline],
  (nodeId, nodeRunCommand, activePipeline) => {
    if (!nodeId && !activePipeline) {
      return null;
    }

    return nodeRunCommand[nodeId] || `kedro run --runner="${activePipeline}"`;
  }
);
