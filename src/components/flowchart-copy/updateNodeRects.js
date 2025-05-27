import { select } from 'd3-selection';
import { formatDuration, formatSize } from './workflow-utils/format';
import { getNodeStatusInfo, getDatasetStatusInfo } from './workflow-utils/getStatus';

export const MINIMUM_WIDTH = 180;

export function getNodeWidth(node) {
  return Math.max(node.width - 5, MINIMUM_WIDTH);
}

/**
 * Render the details container for a node (status, duration, outline, etc)
 */
function renderNodeDetailsContainer(parentGroup, node, nodesStatus, dataSetsStatus) {
  const nodeWidth = getNodeWidth(node);
  const nodeHeight = node.height - 5;
  const detailsHeight = 60;

  const { nodeStatus, nodeDuration } = getNodeStatusInfo(nodesStatus, node);
  const { datasetStatus, datasetSize } = getDatasetStatusInfo(dataSetsStatus, node);

  // Create details container group
  const detailsContainer = parentGroup
    .insert('g', ':first-child')
    .attr('class', 'pipeline-node__details-container');

  // Main node outline (top part only)
  parentGroup
    .append('path')
    .attr('class', 'pipeline-node__main-outline')
    .attr('d', () => {
      if (node.type === 'task' || node.type === 'modularPipeline') {
        return `M ${nodeWidth / -2} ${nodeHeight / -2} H ${nodeWidth / 2} V ${nodeHeight / 2} H ${nodeWidth / -2} V ${nodeHeight / -2} Z`;
      } else {
        const radius = nodeHeight / 2;
        return `M ${nodeWidth / -2 + radius} ${nodeHeight / -2} H ${nodeWidth / 2 - radius} Q ${nodeWidth / 2} ${nodeHeight / -2} ${nodeWidth / 2} ${nodeHeight / -2 + radius} V ${nodeHeight / 2 - radius} Q ${nodeWidth / 2} ${nodeHeight / 2} ${nodeWidth / 2 - radius} ${nodeHeight / 2} H ${nodeWidth / -2 + radius} Q ${nodeWidth / -2} ${nodeHeight / 2} ${nodeWidth / -2} ${nodeHeight / 2 - radius} V ${nodeHeight / -2 + radius} Q ${nodeWidth / -2} ${nodeHeight / -2} ${nodeWidth / -2 + radius} ${nodeHeight / -2} Z`;
      }
    })
    .style('fill', 'none');

  // Details background
  detailsContainer
    .append('rect')
    .attr('class', 'pipeline-node__details-bg')
    .attr('width', nodeWidth)
    .attr('height', (node.type === 'task' || node.type === 'modularPipeline') ? detailsHeight : detailsHeight + 20)
    .attr('x', nodeWidth / -2)
    .attr('y', (node.type === 'task' || node.type === 'modularPipeline') ? nodeHeight / 2 + 1 : 0)
    .attr('rx', 0)
    .style('fill', '#1a1a1a')
    .style('stroke', 'none');

  // Details outline (bottom part only)
  detailsContainer
    .append('path')
    .attr('class', 'pipeline-node__details-outline')
    .attr('d', () => {
      if (node.type === 'task' || node.type === 'modularPipeline') {
        return `M ${nodeWidth / -2} ${nodeHeight / 2} V ${nodeHeight / 2 + detailsHeight} H ${nodeWidth / 2} V ${nodeHeight / 2}`;
      } else {
        return `M ${nodeWidth / -2} 0 V ${nodeHeight / 2 + detailsHeight - 10} Q ${nodeWidth / -2} ${nodeHeight / 2 + detailsHeight} ${nodeWidth / -2 + 10} ${nodeHeight / 2 + detailsHeight} H ${nodeWidth / 2 - 10} Q ${nodeWidth / 2} ${nodeHeight / 2 + detailsHeight} ${nodeWidth / 2} ${nodeHeight / 2 + detailsHeight - 10} V 0`;
      }
    })
    .style('fill', 'none')
    .style('stroke', '#525252')
    .style('stroke-width', 2);

  // Status group (label + value)
  const statusGroup = detailsContainer
    .append('g')
    .attr('class', 'pipeline-node__details-status-group');

  // Status label
  statusGroup
    .append('text')
    .attr('class', 'pipeline-node__details-label')
    .text('Status:')
    .attr('text-anchor', 'start')
    .attr('x', nodeWidth / -2 + 15)
    .attr('y', nodeHeight / 2 + 20)
    .style('fill', '#999')
    .style('font-size', '14px');

  // Status value
  const statusValue = statusGroup
    .append('text')
    .attr('class', 'pipeline-node__details-value')
    .text(datasetStatus ? `${nodeStatus ?? ''} ${datasetStatus}` : nodeStatus ?? 'Skipped')
    .attr('text-anchor', 'start')
    .attr('x', nodeWidth / 2 - 80)
    .attr('y', nodeHeight / 2 + 20)
    .style('font-size', '14px');

  // Set fill color based on status
  if (nodeStatus === 'Failed' || datasetStatus === 'Missing') {
    statusValue.style('fill', '#ff4d4d');
  } else if (nodeStatus === 'Success' || datasetStatus === 'Available') {
    statusValue.style('fill', '#FFF');
  } else {
    statusValue.style('fill', '#525252');
  }

  // Duration/Size group (label + value)
  const sizeGroup = detailsContainer
    .append('g')
    .attr('class', 'pipeline-node__details-size-group');

  // Duration/Size label
  sizeGroup
    .append('text')
    .attr('class', 'pipeline-node__details-label')
    .text((node.type === 'task' || node.type === 'modularPipeline') ? 'Duration:' : 'Size:')
    .attr('text-anchor', 'start')
    .attr('x', nodeWidth / -2 + 15)
    .attr('y', nodeHeight / 2 + 45)
    .style('fill', '#999')
    .style('font-size', '14px');

  // Duration/Size value
  sizeGroup
    .append('text')
    .attr('class', 'pipeline-node__details-value')
    .text((node.type === 'task' || node.type === 'modularPipeline')
      ? (nodeDuration != null ? formatDuration(nodeDuration) : 'N/A')
      : (datasetSize != null ? formatSize(datasetSize) : 'N/A'))
    .attr('text-anchor', 'start')
    .attr('x', nodeWidth / 2 - 80)
    .attr('y', nodeHeight / 2 + 45)
    .style('fill', (nodeStatus || datasetStatus) ? '#FFF' : '#525252')
    .style('font-size', '14px');
}

/**
 * Sets the size and position of the given node rects and renders node details.
 */
export const updateNodeRects = (nodeRects, nodesStatus, dataSetsStatus) => {
  nodeRects
    .attr('width', getNodeWidth)
    .attr('height', node => node.height - 5)
    .attr('x', node => -getNodeWidth(node) / 2)
    .attr('y', node => (node.height - 5) / -2)
    .attr('rx', node => (node.type === 'task' || node.type === 'modularPipeline') ? 0 : node.height / 2);

  // Render node details for each node
  nodeRects.each(function (node) {
    const parentGroup = select(this.parentNode);
    renderNodeDetailsContainer(parentGroup, node, nodesStatus, dataSetsStatus);
  });
};
