import React from 'react';
import { connect } from 'react-redux';
import classnames from 'classnames';
import { toggleTextLabels, toggleTheme } from '../../actions';
import LabelIcon from '../icons/label';
import ThemeIcon from '../icons/theme';
import './icon-toolbar.css';

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
  </ul>
);

export const mapStateToProps = state => ({
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
