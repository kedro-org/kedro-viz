import React from 'react';
import { connect } from 'react-redux';
import { NavLink } from 'react-router-dom';
import { toggleSettingsModal, toggleTheme } from '../../actions';
import ExperimentsIcon from '../icons/experiments';
import IconButton from '../ui/icon-button';
import LogoIcon from '../icons/logo';
import SettingsIcon from '../icons/settings';
import ThemeIcon from '../icons/theme';
import TreeIcon from '../icons/tree';

import './global-toolbar.css';

/**
 * Main controls for filtering the chart data
 * @param {Function} onToggleTheme Handle toggling theme between light/dark
 * @param {string} theme Kedro UI light/dark theme
 */
export const GlobalToolbar = ({
  isOutdated,
  onToggleSettingsModal,
  onToggleTheme,
  theme,
}) => {
  return (
    <>
      <div className="pipeline-global-toolbar">
        <ul className="pipeline-global-routes-toolbar kedro">
          <IconButton
            ariaLabel={'Kedro Viz logo and link'}
            className={'pipeline-menu-button--logo pipeline-menu-button--large'}
            disabled={false}
            icon={LogoIcon}
          />
          <NavLink exact to={{ pathname: '/' }}>
            <IconButton
              ariaLabel={'View your pipeline'}
              className={
                'pipeline-menu-button--large pipeline-menu-button--link'
              }
              disabled={false}
              icon={TreeIcon}
              labelText="Flowchart"
            />
          </NavLink>
          <NavLink exact to={{ pathname: '/experiment-tracking' }}>
            <IconButton
              ariaLabel={'View your experiments'}
              className={
                'pipeline-menu-button--large pipeline-menu-button--link'
              }
              disabled={false}
              icon={ExperimentsIcon}
              labelText="Experiment tracking"
            />
          </NavLink>
        </ul>
        <ul className="pipeline-global-control-toolbar kedro">
          <IconButton
            ariaLive="polite"
            ariaLabel={`Change to ${
              theme === 'light' ? 'dark' : 'light'
            } theme`}
            className={
              'pipeline-menu-button--theme pipeline-menu-button--large'
            }
            dataHeapEvent={`theme.${theme}`}
            onClick={() => onToggleTheme(theme === 'light' ? 'dark' : 'light')}
            icon={ThemeIcon}
            labelText="Toggle theme"
          />
          <IconButton
            ariaLabel={'Change the settings flags'}
            className={
              'pipeline-menu-button--settings pipeline-menu-button--large'
            }
            disabled={false}
            hasReminder={isOutdated}
            icon={SettingsIcon}
            labelText={'Settings'}
            onClick={() => onToggleSettingsModal(true)}
          />
        </ul>
      </div>
    </>
  );
};

export const mapStateToProps = (state) => ({
  theme: state.theme,
  visible: state.visible,
});

export const mapDispatchToProps = (dispatch) => ({
  onToggleSettingsModal: (value) => {
    dispatch(toggleSettingsModal(value));
  },
  onToggleTheme: (value) => {
    dispatch(toggleTheme(value));
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(GlobalToolbar);
