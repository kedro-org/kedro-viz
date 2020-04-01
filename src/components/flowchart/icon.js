import { select } from 'd3-selection';

const paths = {
  // database icon
  data: [
    'M12 5c3.3 0 6 1.6 6 3.5v8c0 2-2.7 3.5-6 3.5s-6-1.6-6-3.5V8.3C6.1 6.5 8.8 5 12 5zm4 10.1c-1 .6-2.5.9-4 .9s-3-.3-4-.9v2c1 .6 2.5.9 4 .9s3-.3 4-.9zm0-4c-1 .6-2.5.9-4 .9s-3-.3-4-.9v2c1 .6 2.5.9 4 .9s3-.3 4-.9zM12 7c-2.2 0-4 .7-4 1.5S9.8 10 12 10s4-.7 4-1.5S14.2 7 12 7z'
  ],
  // cogs icon
  task: [
    'M18.39 4.2l.18.16-1.34 1.48c-.88-.8-1.56-1-2.08-.75-.54.27-.98 1.26-1.4 3.11h1.55v2h-1.94l-.73 3.9-.05.26c-.57 2.7-1.22 4.4-2.33 5.3-.16.14-.34.27-.52.37-1.23.73-2.5.5-3.69-.26-.19-.12-.33-.23-.52-.37l-.14-.12 1.24-1.56.23.17.27.2c.63.4 1.14.49 1.6.22.07-.04.15-.1.25-.19.61-.5 1.13-1.8 1.59-3.86l.06-.31.24-1.2.47-2.55H8.7v-2h3l.14-.62c.54-2.37 1.17-3.65 2.41-4.27 1.28-.64 2.63-.32 3.95.73l.19.16z'
  ],
  // sliders icon
  parameters: [
    'M7.5 15v1.5h2V15h2v1.5h9v2h-9v1.4h-2v-1.4h-2v1.4h-2v-1.4H3v-2h2.5V15h2zM18 4v1.4h2.5v2H18v1.5h-2V7.4H3v-2h13V4h2z'
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
