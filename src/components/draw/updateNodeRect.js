/**
 * Sets the size and position of the given node rects
 * Pure D3 helper, no component dependencies
 */
export const updateNodeRects = (nodeRects) =>
  nodeRects
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
