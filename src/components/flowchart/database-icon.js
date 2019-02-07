import { select } from 'd3-selection';

/**
 * Databse icon, needs to be created like this to support exports
 * in studio ai (which struggles with xlink-hrefs)
 */
export default (d) => {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')

  const imageSize = d => Math.round(d.height * 0.36);

  const g = select(svg)
    .attr('viewBox', '0 0 58.2 58.2')
    .attr('width', imageSize(d))
    .attr('height', imageSize(d))
    .attr('x', imageSize(d) / -2)
    .attr('y', imageSize(d) / -2)
    .append('g')
    .attr('fill', '#fff');

  g.append('path')
    .attr('d', 'M31.7 33.07a84.08 84.08 0 0 1-5.21 0c-7.34-.2-13.2-1.24-17.4-2.72A20.44 20.44 0 0 1 4.1 28V37.4c2.85 2.97 12.4 5.71 25 5.71s22.15-2.74 25-5.71V28c-1.32.9-3.03 1.7-5.03 2.37-4.2 1.47-10.04 2.5-17.36 2.7z')

  g.append('path')
    .attr('d', 'M4.1 14.89V24.29c2.64 2.75 11.03 5.3 22.29 5.67h.35l.98.03a79.02 79.02 0 0 0 2.76 0l.99-.02.34-.01c11.26-.36 19.65-2.92 22.29-5.67v-9.4C49.23 18.23 38.94 20 29.1 20s-20.13-1.77-25-5.11z')

  g.append('path')
    .attr('d', 'M53.97 8.54C52.84 4.24 44.22 0 29.1 0 14.02 0 5.4 4.22 4.25 8.51A.97.97 0 0 0 4.1 9v2.3c2.84 2.97 12.32 5.7 25 5.7s22.16-2.73 25-5.7V9a.92.92 0 0 0-.13-.46zM4.1 41v8.2c0 .16.04.32.12.45 1.18 4.9 11.74 8.55 24.88 8.55 13.1 0 23.65-3.64 24.87-8.52a1 1 0 0 0 .13-.48V41c-4.14 2.91-12.66 5.2-25 5.2-12.35 0-20.87-2.29-25-5.2z')

  return svg
}
