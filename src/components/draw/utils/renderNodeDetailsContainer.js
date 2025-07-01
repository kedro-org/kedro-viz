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
const DETAILS_BG_RADIUS = 0;
const DETAILS_LABEL_X_OFFSET = 15;
const STATUS_VALUE_X_OFFSET = 80;
const STATUS_LABEL_Y_OFFSET = 20;
const SIZE_LABEL_Y_OFFSET = 45;

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

  // Draw the background rectangle for the node details section
  detailsContainer
    .append('rect')
    .attr('class', 'pipeline-node__details-bg')
    .attr('width', nodeWidth)
    .attr('height', detailsSectionHeight)
    .attr('x', nodeWidth / -2)
    .attr('y', 0)
    .attr('rx', DETAILS_BG_RADIUS);

  // Details outline (bottom part only)
  detailsContainer
    .append('path')
    .attr('class', 'pipeline-node__details-outline')
    .attr('d', () => {
      // For task nodes, draw a simple vertical line
      // For data nodes, draw a curved outline
      if (node.type === 'task') {
        return `M ${nodeWidth / -2} ${
          nodeHeight / 2
        } V ${detailsSectionHeight} H ${nodeWidth / 2} V ${nodeHeight / 2}`;
      } else {
        const curveY = detailsSectionHeight - 10;
        const curveX = 10;
        return `M ${nodeWidth / -2} 0 V ${curveY} Q ${
          nodeWidth / -2
        } ${detailsSectionHeight} ${
          nodeWidth / -2 + curveX
        } ${detailsSectionHeight} H ${nodeWidth / 2 - curveX} Q ${
          nodeWidth / 2
        } ${detailsSectionHeight} ${nodeWidth / 2} ${curveY} V 0`;
      }
    });

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
    .attr('x', nodeWidth / -2 + DETAILS_LABEL_X_OFFSET)
    .attr('y', nodeHeight / 2 + STATUS_LABEL_Y_OFFSET);

  // Status value
  const statusValueX = nodeWidth / 2 - STATUS_VALUE_X_OFFSET;
  statusGroup
    .append('text')
    .attr('class', 'pipeline-node__details-value')
    .text(datasetStatus ? `${datasetStatus}` : taskStatus ?? 'Skipped')
    .attr('text-anchor', 'start')
    .attr('x', statusValueX)
    .attr('y', nodeHeight / 2 + STATUS_LABEL_Y_OFFSET);

  // Duration/Size group (label + value)
  const sizeGroup = detailsContainer
    .append('g')
    .attr('class', 'pipeline-node__details-size-group');

  // Duration/Size label
  sizeGroup
    .append('text')
    .attr('class', 'pipeline-node__details-label')
    .text(
      node.type === 'task' || node.type === 'modularPipeline'
        ? 'Duration:'
        : 'Size:'
    )
    .attr('text-anchor', 'start')
    .attr('x', nodeWidth / -2 + DETAILS_LABEL_X_OFFSET)
    .attr('y', nodeHeight / 2 + SIZE_LABEL_Y_OFFSET);

  // Duration/Size value
  sizeGroup
    .append('text')
    .attr('class', 'pipeline-node__details-value')
    .text(
      node.type === 'task' || node.type === 'modularPipeline'
        ? taskDuration != null
          ? formatDuration(taskDuration)
          : 'N/A'
        : datasetSize != null
        ? formatSize(datasetSize)
        : 'N/A'
    )
    .attr('text-anchor', 'start')
    .attr('x', statusValueX)
    .attr('y', nodeHeight / 2 + SIZE_LABEL_Y_OFFSET);
}
