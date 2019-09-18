import React from 'react';
import { connect } from 'react-redux';
import classnames from 'classnames';
import { toggleTextLabels, toggleTheme } from '../../actions';
import { ReactComponent as ThemeIcon } from './theme-icon.svg';
import { ReactComponent as LabelIcon } from './label-icon.svg';
import './icon-toolbar.css';

const capitaliseFirstLetter = str =>
  str.replace(/^\w/, char => char.toUpperCase());

export const ThemeButton = ({ onToggle, theme }) => (
  <button
    className={classnames('pipeline-toggle-theme pipeline-icon-button', {
      'pipeline-toggle-theme--light': theme === 'light',
      'pipeline-toggle-theme--dark': theme === 'dark'
    })}
    onClick={() => onToggle(theme === 'light' ? 'dark' : 'light')}>
    <span>Toggle theme</span>
    <ThemeIcon className="pipeline-icon" />
  </button>
);

export const LabelButton = ({ onToggle, textLabels }) => (
  <button
    className={classnames('pipeline-toggle-labels pipeline-icon-button', {
      'pipeline-toggle-theme--show-labels': textLabels
    })}
    onClick={() => onToggle(!textLabels)}>
    <span>{textLabels ? 'Hide' : 'Show'} text labels</span>
    <LabelIcon className="pipeline-icon" />
  </button>
);

/**
 * Main contols for filtering the chart data
 * @param {Function} onToggleTheme Handle toggling theme between light/dark
 * @param {Function} onToggleTextLabels Handle toggling text labels on/off
 * @param {Boolean} textLabels Whether text labels are displayed
 * @param {string} theme Kedro UI light/dark theme
 */
export const IconToolbar = ({
  onToggleTextLabels,
  onToggleTheme,
  textLabels,
  theme
}) => (
  <ul className="pipeline-icon-toolbar kedro">
    <li>
      <ThemeButton onToggle={onToggleTheme} theme={theme} />
    </li>
    <li>
      <LabelButton onToggle={onToggleTextLabels} textLabels={textLabels} />
    </li>
  </ul>
);

export const mapStateToProps = state => ({
  textLabels: state.textLabels,
  theme: state.theme
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
