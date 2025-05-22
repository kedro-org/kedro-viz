import { select } from 'd3-selection';

/**
 * Render the details container for a node (status, duration, outline, etc)
 */
function renderNodeDetailsContainer(
  parentGroup,
  node,
  nodesStatus,
  dataSetsStatus
) {
  const nodeWidth = node.width - 5;
  const nodeHeight = node.height - 5;
  const detailsHeight = 60;

  // Create a container for the details section
  const detailsContainer = parentGroup
    .insert('g', ':first-child')
    .attr('class', 'pipeline-node__details-container');

  // Find the node status
  let nodeStatus = null;
  let nodeDuration = null;
  if (nodesStatus) {
    nodeStatus = Object.keys(nodesStatus).find(
      (statusKey) => nodesStatus[statusKey][node.id]
    );
    if (nodeStatus) {
      const status = nodesStatus[nodeStatus][node.id];
      nodeStatus = status && status.status;
      nodeDuration = status && status.duration_sec;
    }
  }

  // Find dataset status and size_bytes for data nodes
  let datasetStatus = null;
  let datasetSize = null;
  if (dataSetsStatus && node.type === 'data') {
    // Find the status group (e.g., 'success', 'failed') that contains this node.id
    const statusKey = Object.keys(dataSetsStatus).find(
      (key) => dataSetsStatus[key][node.id]
    );
    if (statusKey) {
      const dataset = dataSetsStatus[statusKey][node.id];
      datasetStatus = dataset && dataset.status;
      datasetSize = dataset && dataset.size_bytes;
    }
  }

  // Main node outline (top part only)
  parentGroup
    .append('path')
    .attr('class', 'pipeline-node__main-outline')
    .attr('d', () => {
      if (node.type === 'task' || node.type === 'modularPipeline') {
        return `
          M ${nodeWidth / -2} ${nodeHeight / -2}
          H ${nodeWidth / 2}
          V ${nodeHeight / 2}
          H ${nodeWidth / -2}
          V ${nodeHeight / -2}
          Z
        `;
      } else {
        const radius = nodeHeight / 2;
        return `
          M ${nodeWidth / -2 + radius} ${nodeHeight / -2}
          H ${nodeWidth / 2 - radius}
          Q ${nodeWidth / 2} ${nodeHeight / -2} ${nodeWidth / 2} ${
          nodeHeight / -2 + radius
        }
          V ${nodeHeight / 2 - radius}
          Q ${nodeWidth / 2} ${nodeHeight / 2} ${nodeWidth / 2 - radius} ${
          nodeHeight / 2
        }
          H ${nodeWidth / -2 + radius}
          Q ${nodeWidth / -2} ${nodeHeight / 2} ${nodeWidth / -2} ${
          nodeHeight / 2 - radius
        }
          V ${nodeHeight / -2 + radius}
          Q ${nodeWidth / -2} ${nodeHeight / -2} ${nodeWidth / -2 + radius} ${
          nodeHeight / -2
        }
          Z
        `;
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
        ? detailsHeight
        : detailsHeight + 20
    )
    .attr('x', nodeWidth / -2)
    .attr(
      'y',
      node.type === 'task' || node.type === 'modularPipeline'
        ? nodeHeight / 2 + 1
        : 0
    )
    .attr('rx', 0)
    .style('fill', '#1a1a1a')
    .style('stroke', 'none');

  // Details outline (bottom part only)
  detailsContainer
    .append('path')
    .attr('class', 'pipeline-node__details-outline')
    .attr('d', () => {
      if (node.type === 'task' || node.type === 'modularPipeline') {
        return `
          M ${nodeWidth / -2} ${nodeHeight / 2}
          V ${nodeHeight / 2 + detailsHeight}
          H ${nodeWidth / 2}
          V ${nodeHeight / 2}
        `;
      } else {
        return `
          M ${nodeWidth / -2} 0
          V ${nodeHeight / 2 + detailsHeight - 10}
          Q ${nodeWidth / -2} ${nodeHeight / 2 + detailsHeight} ${
          nodeWidth / -2 + 10
        } ${nodeHeight / 2 + detailsHeight}
          H ${nodeWidth / 2 - 10}
          Q ${nodeWidth / 2} ${nodeHeight / 2 + detailsHeight} ${
          nodeWidth / 2
        } ${nodeHeight / 2 + detailsHeight - 10}
          V 0
        `;
      }
    })
    .style('fill', 'none')
    .style('stroke', '#525252')
    .style('stroke-width', 2);

  // Status group (label + value)
  const statusGroup = detailsContainer
    .append('g')
    .attr('class', 'pipeline-node__details-status-group');

  // Status label (key)
  statusGroup
    .append('text')
    .attr('class', 'pipeline-node__details-label')
    .text('Status:')
    .attr('text-anchor', 'start')
    .attr('x', nodeWidth / -2 + 15)
    .attr('y', nodeHeight / 2 + 20)
    .style('fill', '#999')
    .style('font-size', '14px');

  // Status value (nodeStatus + datasetStatus)
  const statusValue = statusGroup
    .append('text')
    .attr('class', 'pipeline-node__details-value')
    .text(
      datasetStatus
        ? `${nodeStatus ?? ''} (${datasetStatus})`
        : nodeStatus ?? 'Skipped'
    )
    .attr('text-anchor', 'start')
    .attr('x', nodeWidth / 2 - 80)
    .attr('y', nodeHeight / 2 + 20)
    .style('font-size', '14px');

  // Set fill color based on status
  if (nodeStatus === 'Failed' || datasetStatus === 'Missing') {
    statusValue.style('fill', '#ff4d4d');
  } else {
    statusValue.style('fill', '#FFF');
  }

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
    .attr('y', nodeHeight / 2 + 45)
    .style('fill', '#999')
    .style('font-size', '14px');

  // Duration/Size value
  sizeGroup
    .append('text')
    .attr('class', 'pipeline-node__details-value')
    .text(
      node.type === 'task' || node.type === 'modularPipeline'
        ? nodeDuration ?? ''
        : datasetSize ?? 'N/A'
    )
    .attr('text-anchor', 'start')
    .attr('x', nodeWidth / 2 - 80)
    .attr('y', nodeHeight / 2 + 45)
    .style('fill', '#fff')
    .style('font-size', '14px');
}

/**
 * Sets the size and position of the given node rects
 */
export const updateNodeRects = (nodeRects, nodesStatus, dataSetsStatus) => {
  nodeRects
    .attr('width', (node) => node.width - 5)
    .attr('height', (node) => node.height - 5)
    .attr('x', (node) => (node.width - 5) / -2)
    .attr('y', (node) => (node.height - 5) / -2)
    .attr('rx', (node) => {
      if (node.type === 'task' || node.type === 'modularPipeline') {
        return 0;
      }
      return node.height / 2;
    });

  nodeRects.each(function (node) {
    const parentGroup = select(this.parentNode);
    renderNodeDetailsContainer(parentGroup, node, nodesStatus, dataSetsStatus);
  });
};
