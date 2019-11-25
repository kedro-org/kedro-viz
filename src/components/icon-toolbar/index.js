import React from 'react';
import { connect } from 'react-redux';
import classnames from 'classnames';
import { toggleTextLabels, toggleTheme } from '../../actions';
import { getGraphSize } from '../../selectors/layout';
import LabelIcon from '../icons/label';
import ThemeIcon from '../icons/theme';
import downloadSvg, { downloadPng } from 'svg-crowbar';
import './icon-toolbar.css';

/**
 * Theme toggle button component
 * @param {Function} onToggle Handle toggling theme between light/dark
 * @param {string} theme Kedro UI light/dark theme
 */
export const ThemeButton = ({ onToggle, theme }) => (
  <button
    aria-live="polite"
    aria-label={`Change to ${theme === 'light' ? 'dark' : 'light'} theme`}
    className={classnames('pipeline-toggle-theme pipeline-icon-button', {
      'pipeline-toggle-theme--light': theme === 'light',
      'pipeline-toggle-theme--dark': theme === 'dark'
    })}
    onClick={() => onToggle(theme === 'light' ? 'dark' : 'light')}>
    <span>Toggle theme</span>
    <ThemeIcon className="pipeline-icon" />
  </button>
);

/**
 * Text Label toggle button component
 * @param {Function} onToggle Handle toggling text labels on/off
 * @param {Boolean} textLabels Whether text labels are displayed
 */
export const LabelButton = ({ onToggle, textLabels }) => (
  <button
    aria-live="polite"
    className={classnames('pipeline-toggle-labels pipeline-icon-button', {
      'pipeline-toggle-theme--show-labels': textLabels
    })}
    onClick={() => onToggle(!textLabels)}>
    <span>{textLabels ? 'Hide' : 'Show'} text labels</span>
    <LabelIcon className="pipeline-icon" />
  </button>
);

/**
 * Handle onClick for the SVG/PNG download button
 * @param {Function} download SVG-crowbar function to download SVG or PNG
 * @param {number} param.width Graph width
 * @param {number} param.height Graph height
 * @return {Function} onClick handler
 */
const exportGraph = (download, { width, height }) => () => {
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
}) => (
  <ul className="pipeline-icon-toolbar kedro">
    {visible.themeBtn && (
      <li>
        <ThemeButton onToggle={onToggleTheme} theme={theme} />
      </li>
    )}
    {visible.labelBtn && (
      <li>
        <LabelButton onToggle={onToggleTextLabels} textLabels={textLabels} />
      </li>
    )}
    <li>
      <button onClick={exportGraph(downloadSvg, graphSize)}>SVG</button>
    </li>
    <li>
      <button onClick={exportGraph(downloadPng, graphSize)}>PNG</button>
    </li>
  </ul>
);

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
