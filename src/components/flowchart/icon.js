import { select } from 'd3-selection';
import { paths } from '../icons/node-icon';

/**
 * Generate cog/database icon.
 * Inline SVG is required to support image exports
 */
export default node => {
  const svgNode = document.createElementNS('http://www.w3.org/2000/svg', 'svg');

  const svg = select(svgNode)
    .attr('class', 'node__icon')
    .attr('viewBox', '0 0 24 24');

  paths[node.type].forEach(path => {
    svg.append('path').attr('d', path);
  });

  return svgNode;
};
