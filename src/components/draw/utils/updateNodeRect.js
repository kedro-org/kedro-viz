import { select } from 'd3-selection';

import { renderNodeDetailsContainer } from './renderNodeDetailsContainer';
import { getNodeWidth } from './getNodeRectWidth';

function setNodeRectAttrs(nodeRects, widthFn) {
  return nodeRects
    .attr('width', widthFn)
    .attr('height', (node) => node.height - 5)
    .attr('x', (node) => -widthFn(node) / 2)
    .attr('y', (node) => (node.height - 5) / -2)
    .attr('rx', (node) =>
      node.type === 'task' || node.type === 'modularPipeline'
        ? 0
        : node.height / 2
    );
}

/**
 * Sets the size and position of the given node rects
 * Pure D3 helper, no component dependencies
 */
export const updateNodeRects = (
  nodeRects,
  showRunStatus,
  tasksStatus,
  dataSetsStatus
) => {
  if (showRunStatus) {
    setNodeRectAttrs(nodeRects, getNodeWidth);

    // Render node details for each node
    nodeRects.each(function (node) {
      const parentGroup = select(this.parentNode);
      // Remove any existing details container for this node
      parentGroup.selectAll('.pipeline-node__details-container').remove();
      renderNodeDetailsContainer(
        parentGroup,
        node,
        tasksStatus,
        dataSetsStatus
      );
    });
  } else {
    return setNodeRectAttrs(nodeRects, (node) => node.width - 5);
  }
};
