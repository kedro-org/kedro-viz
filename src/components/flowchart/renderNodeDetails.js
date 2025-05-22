import * as d3 from 'd3';

// Helper for rendering node details (status, duration, outlines, etc.) for Kedro-Viz flowchart nodes
// This function should be called from drawNodes after node elements are created/updated

export function renderNodeDetails(selection, options = {}) {
  // selection: D3 selection of node groups (g.pipeline-node)
  // options: { statusMap, durationMap, outlineMap, ... }
  // Add status, duration, outlines, etc. as needed

  // Example: Render status indicator (if statusMap provided)
  if (options.statusMap) {
    selection.each(function (node) {
      const status = options.statusMap[node.id];
      // Remove any existing status indicator
      d3.select(this).selectAll('.pipeline-node__status').remove();
      if (status) {
        d3.select(this)
          .append('circle')
          .attr(
            'class',
            `pipeline-node__status pipeline-node__status--${status}`
          )
          .attr('r', 6)
          .attr('cx', node.statusOffsetX || 0)
          .attr('cy', node.statusOffsetY || 0);
      }
    });
  }

  // Example: Render duration label (if durationMap provided)
  if (options.durationMap) {
    selection.each(function (node) {
      const duration = options.durationMap[node.id];
      d3.select(this).selectAll('.pipeline-node__duration').remove();
      if (duration) {
        d3.select(this)
          .append('text')
          .attr('class', 'pipeline-node__duration')
          .attr('x', node.durationOffsetX || 0)
          .attr('y', node.durationOffsetY || 24)
          .text(duration);
      }
    });
  }

  // Example: Render outlines (if outlineMap provided)
  if (options.outlineMap) {
    selection.each(function (node) {
      const outline = options.outlineMap[node.id];
      d3.select(this).selectAll('.pipeline-node__outline').remove();
      if (outline) {
        d3.select(this)
          .append('rect')
          .attr('class', 'pipeline-node__outline')
          .attr('x', outline.x)
          .attr('y', outline.y)
          .attr('width', outline.width)
          .attr('height', outline.height)
          .attr('stroke', outline.color || '#000')
          .attr('fill', 'none');
      }
    });
  }
}
