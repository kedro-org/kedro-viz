import { createSelector } from 'reselect';

const getClickedNode = (state) => state.node.clicked;

/**
 * Returns true if run command should be visible
 */
export const getVisibleRunCommand = createSelector(
  [getClickedNode],
  (nodeClicked) => Boolean(nodeClicked)
);

export const getRunCommand = createSelector(
  [getClickedNode, (state) => state.node.runCommand],
  (nodeId, nodeRunCommand) => {
    if (!nodeId) {
      return null;
    }

    return nodeRunCommand[nodeId];
  }
);
