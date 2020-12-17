import downloadSvg, { downloadPng } from 'svg-crowbar';

/**
 * Handle onClick for the SVG/PNG download button
 * @param {string} format Must be 'svg' or 'png'
 * @param {string} theme light/dark theme
 * @param {Object} graphSize Graph width/height/margin
 * @param {function} mockFn Mock testing function stand-in for svg-crowbar
 * @return {Function} onClick handler
 */
const exportGraph = ({ format, theme, graphSize, mockFn }) => {
  const downloadFormats = {
    png: downloadPng,
    svg: downloadSvg
  };
  const download = mockFn || downloadFormats[format];

  // Create clone of graph SVG to avoid breaking the original
  const svg = document.querySelector('#pipeline-graph');
  const clone = svg.parentNode.appendChild(svg.cloneNode(true));
  clone.classList.add('kedro', `kui-theme--${theme}`, 'pipeline-graph--export');

  // Reset zoom/translate
  let width = graphSize.width + graphSize.marginx * 2;
  let height = graphSize.height + graphSize.marginy * 2;
  clone.setAttribute('viewBox', `0 0 ${width} ${height}`);
  clone.querySelector('#zoom-wrapper').removeAttribute('transform');

  // Impose a maximum size on PNGs because otherwise they break when downloading
  if (format === 'png') {
    const maxWidth = 5000;
    width = Math.min(width, maxWidth);
    height = Math.min(height, maxWidth * (height / width));
  }
  clone.setAttribute('width', width);
  clone.setAttribute('height', height);

  const style = document.createElement('style');
  if (format === 'svg') {
    // Add webfont
    style.innerHTML =
      '@import url(https://fonts.googleapis.com/css?family=Titillium+Web:400);';
  } else {
    // Add websafe fallback font
    style.innerHTML = `.kedro {
      font-family: "Trebuchet MS", "Lucida Grande", "Lucida Sans Unicode", "Lucida Sans", Tahoma, sans-serif;
      letter-spacing: -0.4px;
    }`;
  }
  clone.prepend(style);

  // Download SVG/PNG
  download(clone, 'kedro-pipeline');
  // @TODO: Replace third { css: 'internal' } argument when CORS issue is fixed

  // Delete cloned SVG
  svg.parentNode.removeChild(clone);
};

export default exportGraph;
