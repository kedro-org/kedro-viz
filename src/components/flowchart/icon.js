import { select } from 'd3-selection';

const paths = {
  // database icon
  data: [
    'M12 4c3.8 0 6.8 1.5 7 3.4v10.1c0 2-3.1 3.5-7 3.5s-7-1.6-7-3.5V7.4c.2-2 3.2-3.4 7-3.4zm5 11c-1.3.6-3 1-5 1s-3.7-.4-5-1v3c1.3.6 3 1 5 1s3.7-.4 5-1v-3zm-5-9c-2.8 0-5 .7-5 1.5S9.2 9 12 9s5-.7 5-1.5S14.8 6 12 6zm5 4c-1.3.6-3 1-5 1s-3.7-.4-5-1v3c1.3.6 3 1 5 1s3.7-.4 5-1v-3z'
  ],
  // function icon
  task: [
    'M17.83 5.2l.17.16-1.39 1.38c-.8-.78-1.43-.95-2.06-.65-.5.24-.94 1.18-1.35 2.94h1.54v1.95h-1.93l-.64 3.4c-.03.22-.07.4-.1.54-.56 2.72-1.19 4.4-2.28 5.31-.16.13-.32.24-.49.34-1.2.7-2.43.5-3.61-.22l-.22-.14-.47-.33 1.14-1.59.26.2.32.2c.63.37 1.14.46 1.58.2l.22-.15c.59-.49 1.1-1.8 1.55-3.9l.1-.53.63-3.33H8.26V9.03h2.92l.04-.22c.56-2.53 1.18-3.86 2.48-4.48 1.39-.66 2.82-.32 4.13.87z'
  ],
  // sliders icon
  parameters: [
    'M3 17.5v-2h18v2z',
    'M5.5 19v-5h2v5zM9.5 19v-5h2v5zM3 8.5v-2h18v2z',
    'M16.5 10V5h2v5z'
  ]
};

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
