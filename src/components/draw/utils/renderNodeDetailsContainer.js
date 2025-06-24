import {
  formatDuration,
  formatSize,
} from '../../workflow/workflow-utils/format';
import {
  getTasksStatusInfo,
  getDatasetStatusInfo,
} from '../../workflow/workflow-utils/getStatus';
import { NODE_DETAILS_HEIGHT } from './config';
import { MINIMUM_WIDTH } from './config';

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
  const nodeWidth = Math.max(node.width || 0, MINIMUM_WIDTH);
  const nodeHeight = node.height - 5;

  const { taskStatus, taskDuration } = getTasksStatusInfo(tasksStatus, node);
  const { datasetStatus, datasetSize } = getDatasetStatusInfo(
    dataSetsStatus,
    node
  );

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
        return `M ${nodeWidth / -2} ${nodeHeight / -2} H ${nodeWidth / 2} V ${
          nodeHeight / 2
        } H ${nodeWidth / -2} V ${nodeHeight / -2} Z`;
      } else {
        const radius = nodeHeight / 2;
        return `M ${nodeWidth / -2 + radius} ${nodeHeight / -2} H ${
          nodeWidth / 2 - radius
        } Q ${nodeWidth / 2} ${nodeHeight / -2} ${nodeWidth / 2} ${
          nodeHeight / -2 + radius
        } V ${nodeHeight / 2 - radius} Q ${nodeWidth / 2} ${nodeHeight / 2} ${
          nodeWidth / 2 - radius
        } ${nodeHeight / 2} H ${nodeWidth / -2 + radius} Q ${nodeWidth / -2} ${
          nodeHeight / 2
        } ${nodeWidth / -2} ${nodeHeight / 2 - radius} V ${
          nodeHeight / -2 + radius
        } Q ${nodeWidth / -2} ${nodeHeight / -2} ${nodeWidth / -2 + radius} ${
          nodeHeight / -2
        } Z`;
      }
    })
    .style('fill', 'none');

  // Details background
  detailsContainer
    .append('rect')
    .attr('class', 'pipeline-node__details-bg')
    .attr('width', nodeWidth)
    .attr(
      'height',
      node.type === 'task' || node.type === 'modularPipeline'
        ? NODE_DETAILS_HEIGHT
        : NODE_DETAILS_HEIGHT + 20
    )
    .attr('x', nodeWidth / -2)
    .attr(
      'y',
      node.type === 'task' || node.type === 'modularPipeline'
        ? nodeHeight / 2 + 1
        : 0
    )
    .attr('rx', 0);

  // Details outline (bottom part only)
  detailsContainer
    .append('path')
    .attr('class', 'pipeline-node__details-outline')
    .attr('d', () => {
      if (node.type === 'task' || node.type === 'modularPipeline') {
        return `M ${nodeWidth / -2} ${nodeHeight / 2} V ${
          nodeHeight / 2 + NODE_DETAILS_HEIGHT
        } H ${nodeWidth / 2} V ${nodeHeight / 2}`;
      } else {
        return `M ${nodeWidth / -2} 0 V ${
          nodeHeight / 2 + NODE_DETAILS_HEIGHT - 10
        } Q ${nodeWidth / -2} ${nodeHeight / 2 + NODE_DETAILS_HEIGHT} ${
          nodeWidth / -2 + 10
        } ${nodeHeight / 2 + NODE_DETAILS_HEIGHT} H ${nodeWidth / 2 - 10} Q ${
          nodeWidth / 2
        } ${nodeHeight / 2 + NODE_DETAILS_HEIGHT} ${nodeWidth / 2} ${
          nodeHeight / 2 + NODE_DETAILS_HEIGHT - 10
        } V 0`;
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
    .attr('x', nodeWidth / -2 + 15)
    .attr('y', nodeHeight / 2 + 20);

  // Status value
  statusGroup
    .append('text')
    .attr('class', 'pipeline-node__details-value')
    .text(datasetStatus ? `${datasetStatus}` : taskStatus ?? 'Skipped')
    .attr('text-anchor', 'start')
    .attr(
      'x',
      datasetStatus === 'Not persisted'
        ? nodeWidth / 2 - 100
        : nodeWidth / 2 - 80
    )
    .attr('y', nodeHeight / 2 + 20);

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
    .attr('x', nodeWidth / -2 + 15)
    .attr('y', nodeHeight / 2 + 45);

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
    .attr(
      'x',
      datasetStatus === 'Not persisted'
        ? nodeWidth / 2 - 100
        : nodeWidth / 2 - 80
    )
    .attr('y', nodeHeight / 2 + 45);
}
