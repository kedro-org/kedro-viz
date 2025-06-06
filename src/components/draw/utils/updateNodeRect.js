import { select } from 'd3-selection';

import { renderNodeDetailsContainer } from './renderNodeDetailsContainer';

export const MINIMUM_WIDTH = 180;

export function getNodeWidth(node) {
  return Math.max(node.width - 5, MINIMUM_WIDTH);
}

/**
 * Sets the size and position of the given node rects
 * Pure D3 helper, no component dependencies
 */
export const updateNodeRects = (
  nodeRects,
  showRunStatus,
  nodesStatus,
  dataSetsStatus
) => {
  if (showRunStatus) {
    nodeRects
      .attr('width', getNodeWidth)
      .attr('height', (node) => node.height - 5)
      .attr('x', (node) => -getNodeWidth(node) / 2)
      .attr('y', (node) => (node.height - 5) / -2)
      .attr('rx', (node) =>
        node.type === 'task' || node.type === 'modularPipeline'
          ? 0
          : node.height / 2
      );

    // Render node details for each node
    nodeRects.each(function (node) {
      const parentGroup = select(this.parentNode);
      renderNodeDetailsContainer(
        parentGroup,
        node,
        nodesStatus,
        dataSetsStatus
      );
    });
  } else {
    return nodeRects
      .attr('width', (node) => node.width - 5)
      .attr('height', (node) => node.height - 5)
      .attr('x', (node) => (node.width - 5) / -2)
      .attr('y', (node) => (node.height - 5) / -2)
      .attr('rx', (node) => {
        // Task and Pipeline nodes are rectangle so radius on x-axis is 0
        if (node.type === 'task' || node.type === 'modularPipeline') {
          return 0;
        }
        return node.height / 2;
      });
  }
};
