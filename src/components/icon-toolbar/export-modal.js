import React from 'react';
import { connect } from 'react-redux';
import Modal from '@quantumblack/kedro-ui/lib/components/modal';
import Button from '@quantumblack/kedro-ui/lib/components/button';
import { getGraphSize } from '../../selectors/layout';
import downloadSvg, { downloadPng } from 'svg-crowbar';

/**
 * Handle onClick for the SVG/PNG download button
 * @param {string} format Must be 'svg' or 'png'
 * @param {number} param.width Graph width
 * @param {number} param.height Graph height
 * @return {Function} onClick handler
 */
export const exportGraph = (format, { width, height }) => {
  const svg = document.querySelector('#pipeline-graph');
  // Create clone of graph SVG to avoid breaking the original
  const clone = svg.parentNode.appendChild(svg.cloneNode(true));
  // Reset zoom/translate
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
  // Add webfont
  const style = document.createElement('style');
  style.innerHTML =
    '@import url(https://fonts.googleapis.com/css?family=Titillium+Web:400);';
  clone.prepend(style);
  // Download SVG/PNG
  const download = {
    png: downloadPng,
    svg: downloadSvg
  };
  download[format](clone, 'kedro-pipeline');
  // Delete cloned SVG
  svg.parentNode.removeChild(clone);
};

/**
 * Kedro-UI modal to allow users to choose between SVG/PNG export formats
 */
const ExportModal = ({ graphSize, theme, toggleModal, visible }) => (
  <Modal
    title="Export pipeline visualisation"
    onClose={() => toggleModal(false)}
    theme={theme}
    visible={visible}>
    <div className="pipeline-icon-modal">
      <Button
        theme={theme}
        onClick={() => {
          exportGraph('png', graphSize);
          toggleModal(false);
        }}>
        Download PNG
      </Button>
      <Button
        theme={theme}
        onClick={() => {
          exportGraph('svg', graphSize);
          toggleModal(false);
        }}>
        Download SVG
      </Button>
    </div>
  </Modal>
);

export const mapStateToProps = state => ({
  graphSize: getGraphSize(state),
  theme: state.theme
});

export default connect(mapStateToProps)(ExportModal);
