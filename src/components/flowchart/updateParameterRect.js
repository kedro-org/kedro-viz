/**
 * Sets the size and position of the parameter indicator rects for nodes
 * Pure D3 helper, no component dependencies
 */
export const updateParameterRect = (nodeRects, orientation) =>
  nodeRects
    .attr('width', 12)
    .attr('height', 12)
    .attr('x', (node) =>
      orientation === 'vertical'
        ? (node.width + 20) / -2
        : -(node.width / 2) + 10
    )
    .attr('y', (node) => (orientation === 'vertical' ? -6 : -node.height + 12));
