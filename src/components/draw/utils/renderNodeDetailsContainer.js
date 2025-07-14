import {
  formatDuration,
  formatSize,
} from '../../workflow/workflow-utils/format';
import {
  getTasksStatusInfo,
  getDatasetStatusInfo,
} from '../../workflow/workflow-utils/getStatus';
import { workflowNodeDetailsHeight } from '../../../config';

// Node details layout constants
const DETAILS_LABEL_X_OFFSET = 15;
const STATUS_VALUE_X_OFFSET = 80;
const STATUS_LABEL_Y_OFFSET = 20;
const SIZE_LABEL_Y_OFFSET = 45;

// General helper to append a text element to a group
function appendDetailsText(group, classNames, text, x, y) {
  group
    .append('text')
    .attr('class', classNames)
    .text(text)
    .attr('text-anchor', 'start')
    .attr('x', x)
    .attr('y', y);
}

/**
 * Render the details container for a node (status, duration, outline, etc)
 * This is a pure D3 helper, no React dependencies
 */
export function renderNodeDetailsContainer(
  parentGroup,
  node,
  tasksStatus,
  dataSetsStatus
) {
  const nodeWidth = node.width - 5;
  const nodeHeight = node.height - 5;
  const detailsSectionHeight = nodeHeight / 2 + workflowNodeDetailsHeight;

  const { taskStatus, taskDuration } = getTasksStatusInfo(tasksStatus, node);
  const { datasetStatus, datasetSize } = getDatasetStatusInfo(
    dataSetsStatus,
    node
  );

  // Create details container group
  const detailsContainer = parentGroup
    .insert('g', ':first-child')
    .attr('class', 'pipeline-node__details-container');

  // First draw the background rectangle for the node details section
  detailsContainer
    .append('rect')
    .attr('class', 'pipeline-node__details-bg')
    .attr('width', nodeWidth)
    .attr('height', detailsSectionHeight)
    .attr('x', nodeWidth / -2)
    .attr('y', 0);

  // Second draw the outline path
  // For task nodes, draw a simple vertical line
  // For data nodes, draw a curved outline
  detailsContainer
    .append('path')
    .attr('class', 'pipeline-node__details-outline')
    .attr('d', () => {
      if (node.type === 'task') {
        return `
        M ${nodeWidth / -2} ${nodeHeight / 2} 
        V ${detailsSectionHeight} 
        H ${nodeWidth / 2} 
        V ${nodeHeight / 2}`;
      } else {
        // Draw a rounded bottom outline for non-task nodes
        const curveX = 10; // Horizontal radius for the curve
        const curveY = detailsSectionHeight - curveX; // Vertical start/end for the curve
        const leftX = nodeWidth / -2;
        const rightX = nodeWidth / 2;
        const bottomY = detailsSectionHeight;
        return `
          M ${leftX} 0 
          V ${curveY} 
          Q ${leftX} ${bottomY} ${leftX + curveX} ${bottomY} 
          H ${rightX - curveX} 
          Q ${rightX} ${bottomY} ${rightX} ${curveY} 
          V 0`;
      }
    });

  // Status group (label + value)
  const statusGroup = detailsContainer
    .append('g')
    .attr('class', 'pipeline-node__details-status-group');

  appendDetailsText(
    statusGroup,
    'pipeline-node__details-label',
    'Status:',
    nodeWidth / -2 + DETAILS_LABEL_X_OFFSET,
    nodeHeight / 2 + STATUS_LABEL_Y_OFFSET
  );

  appendDetailsText(
    statusGroup,
    'pipeline-node__details-value',
    datasetStatus ? `${datasetStatus}` : taskStatus ?? 'Skipped',
    nodeWidth / 2 - STATUS_VALUE_X_OFFSET,
    nodeHeight / 2 + STATUS_LABEL_Y_OFFSET
  );

  // Metrics group (duration or size label + value)
  const metricsGroup = detailsContainer
    .append('g')
    .attr('class', 'pipeline-node__details-metrics-group');

  appendDetailsText(
    metricsGroup,
    'pipeline-node__details-label',
    node.type === 'task' || node.type === 'modularPipeline'
      ? 'Duration:'
      : 'Size:',
    nodeWidth / -2 + DETAILS_LABEL_X_OFFSET,
    nodeHeight / 2 + SIZE_LABEL_Y_OFFSET
  );

  appendDetailsText(
    metricsGroup,
    'pipeline-node__details-value',
    node.type === 'task' || node.type === 'modularPipeline'
      ? taskDuration != null
        ? formatDuration(taskDuration)
        : 'N/A'
      : datasetSize != null
      ? formatSize(datasetSize)
      : 'N/A',
    nodeWidth / 2 - STATUS_VALUE_X_OFFSET,
    nodeHeight / 2 + SIZE_LABEL_Y_OFFSET
  );
}
