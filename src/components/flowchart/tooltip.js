/**
 * Provide methods to show/hide the tooltip
 */
const tooltip = {
  /**
   * Show, fill and and position the tooltip
   * @param {Object} p.chartSize Modified getBoundingClientRect values for chart container
   * @param {Object} p.eventOffset event.target.getBoundingClientRect
   * @param {number} p.navOffset Horizontal offset due to nav width
   * @param {Object} p.node A node datum
   * @param {Object} p.tooltip Tooltip element ref
   */
  show: ({ chartSize, eventOffset, navOffset, node, tooltip }) => {
    const isRight = eventOffset.left - navOffset > chartSize.width / 2;
    const xOffset = isRight
      ? eventOffset.left - (chartSize.width + navOffset)
      : eventOffset.left;
    const translate = {
      x: xOffset - chartSize.x + eventOffset.width / 2,
      y: eventOffset.top - chartSize.y
    };
    tooltip
      .classed('tooltip--visible', true)
      .classed('tooltip--right', isRight)
      .html(`<b>${node.name}</b>`)
      .style('transform', `translate(${translate.x}px, ${translate.y}px)`);
  },

  /**
   * Hide the tooltip
   * @param {Object} p.tooltip Tooltip element ref
   */
  hide: ({ tooltip }) => {
    tooltip.classed('tooltip--visible', false);
  }
};

export default tooltip;
