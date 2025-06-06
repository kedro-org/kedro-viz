import { select } from 'd3-selection';
import { formatDuration, formatSize } from './workflow-utils/format';
import {
  getNodeStatusInfo,
  getDatasetStatusInfo,
} from './workflow-utils/getStatus';
import { renderNodeDetailsContainer } from '../draw/utils/renderNodeDetailsContainer';

export const MINIMUM_WIDTH = 180;

export function getNodeWidth(node) {
  return Math.max(node.width - 5, MINIMUM_WIDTH);
}

/**
 * Sets the size and position of the given node rects and renders node details.
 */
export const updateNodeRects = (nodeRects, nodesStatus, dataSetsStatus) => {
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
    renderNodeDetailsContainer(parentGroup, node, nodesStatus, dataSetsStatus);
  });
};
