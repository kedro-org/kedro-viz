import { event } from 'd3-selection';

/**
 * Provide methods to show/hide the tooltip
 */
const tooltip = ({ el, width }) => ({
  show: d => {
    const { clientX, clientY } = event;
    const isRight = clientX > width / 2;
    const x = isRight ? clientX - width : clientX;
    let label = `<b>${d.name}</b>`;
    if (d.layer) {
      label += `<small>${d.layer.name}</small>`;
    }
    el.tooltip
      .classed('tooltip--visible', true)
      .classed('tooltip--right', isRight)
      .html(label)
      .style('transform', `translate(${x}px, ${clientY}px)`);
  },

  hide: () => {
    el.tooltip.classed('tooltip--visible', false);
  }
});

export default tooltip;
