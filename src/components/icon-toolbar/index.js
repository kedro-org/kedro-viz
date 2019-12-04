import React, { useState } from 'react';
import { connect } from 'react-redux';
import Modal from '@quantumblack/kedro-ui/lib/components/modal';
import Button from '@quantumblack/kedro-ui/lib/components/button';
import { toggleTextLabels, toggleTheme } from '../../actions';
import { getGraphSize } from '../../selectors/layout';
import IconButton from './icon-button';
import downloadSvg, { downloadPng } from 'svg-crowbar';
import './icon-toolbar.css';

/**
 * Handle onClick for the SVG/PNG download button
 * @param {Function} download SVG-crowbar function to download SVG or PNG
 * @param {number} param.width Graph width
 * @param {number} param.height Graph height
 * @return {Function} onClick handler
 */
export const exportGraph = (download, { width, height }) => {
  const svg = document.querySelector('#pipeline-graph');
  // Create clone of graph SVG to avoid breaking the original
  const clone = svg.parentNode.appendChild(svg.cloneNode(true));
  // Reset zoom/translate
  clone.setAttribute('width', width);
  clone.setAttribute('height', height);
  clone.querySelector('#zoom-wrapper').removeAttribute('transform');
  // Add webfont
  const style = document.createElement('style');
  style.innerText =
    '@import url(https://fonts.googleapis.com/css?family=Titillium+Web:400);';
  clone.appendChild(style);
  // Download SVG/PNG
  download(clone, 'kedro-pipeline');
  // Delete cloned SVG
  svg.parentNode.removeChild(clone);
};

/**
 * Main contols for filtering the chart data
 * @param {Function} onToggleTheme Handle toggling theme between light/dark
 * @param {Function} onToggleTextLabels Handle toggling text labels on/off
 * @param {Boolean} textLabels Whether text labels are displayed
 * @param {string} theme Kedro UI light/dark theme
 */
export const IconToolbar = ({
  graphSize,
  onToggleTextLabels,
  onToggleTheme,
  textLabels,
  theme,
  visible
}) => {
  const [isModalVisible, toggleModal] = useState(false);

  return (
    <>
      <ul className="pipeline-icon-toolbar kedro">
        <IconButton
          ariaLive="polite"
          ariaLabel={`Change to ${theme === 'light' ? 'dark' : 'light'} theme`}
          onClick={() => onToggleTheme(theme === 'light' ? 'dark' : 'light')}
          icon="theme"
          labelText="Toggle theme"
          visible={visible.themeBtn}
        />
        <IconButton
          ariaLive="polite"
          onClick={() => onToggleTextLabels(!textLabels)}
          icon="label"
          labelText={`${textLabels ? 'Hide' : 'Show'} text labels`}
          visible={visible.labelBtn}
        />
        <IconButton
          ariaLabel="Export graph as SVG or PNG"
          onClick={() => toggleModal(true)}
          icon="export"
          labelText="Export visualisation"
          visible={visible.exportBtn}
        />
      </ul>
      {visible.exportBtn && (
        <Modal
          title="Export pipeline visualisation"
          onClose={() => toggleModal(false)}
          theme={theme}
          visible={isModalVisible}>
          <div className="pipeline-icon-modal">
            <Button
              theme={theme}
              onClick={() => {
                exportGraph(downloadPng, graphSize);
                toggleModal(false);
              }}>
              Download PNG
            </Button>
            <Button
              theme={theme}
              onClick={() => {
                exportGraph(downloadSvg, graphSize);
                toggleModal(false);
              }}>
              Download SVG
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
};

export const mapStateToProps = state => ({
  graphSize: getGraphSize(state),
  textLabels: state.textLabels,
  theme: state.theme,
  visible: state.visible
});

export const mapDispatchToProps = dispatch => ({
  onToggleTextLabels: value => {
    dispatch(toggleTextLabels(Boolean(value)));
  },
  onToggleTheme: value => {
    dispatch(toggleTheme(value));
  }
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(IconToolbar);
