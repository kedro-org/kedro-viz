import { event } from 'd3-selection';

/**
 * Provide methods to show/hide the tooltip
 */
const tooltip = {
  show: ({ el, navOffset, width, x, y }, d) => {
    const offset = event.target.getBoundingClientRect();
    const isRight = (offset.left - navOffset) > width / 2;
    const xOffset = isRight ? offset.left - (width + navOffset) : offset.left;
    const translate = {
      x: (xOffset - x) + (offset.width / 2),
      y: offset.top - y,
    };
    let label = `<b>${d.name}</b>`;
    if (d.layer) {
      label += `<small>${d.layer.name}</small>`;
    }
    el.tooltip
      .classed('tooltip--visible', true)
      .classed('tooltip--right', isRight)
      .html(label)
      .style('transform', `translate(${translate.x}px, ${translate.y}px)`);
  },

  hide: ({ tooltip }) => {
    tooltip.classed('tooltip--visible', false);
  }
};

export default tooltip;
