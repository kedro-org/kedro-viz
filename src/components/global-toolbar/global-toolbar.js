import React from 'react';
import { connect } from 'react-redux';
import { NavLink } from 'react-router-dom';
import {
  toggleSettingsModal,
  toggleShareableUrlModal,
  toggleTheme,
} from '../../actions';
import { isRunningLocally, sanitizedPathname } from '../../utils';

import DownloadIcon from '../icons/download';
import IconButton from '../ui/icon-button';
import LogoIcon from '../icons/logo';
import SettingsIcon from '../icons/settings';
import ThemeIcon from '../icons/theme';
import TreeIcon from '../icons/tree';

import './global-toolbar.scss';

/**
 * Main controls for filtering the chart data
 * @param {Function} onToggleTheme Handle toggling theme between light/dark
 * @param {String} theme Kedro UI light/dark theme
 */
export const GlobalToolbar = ({
  isOutdated,
  onToggleSettingsModal,
  onToggleShareableUrlModal,
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
            dataTest={'global-toolbar-kedro-icon'}
            disabled={false}
            icon={LogoIcon}
          />
          <NavLink exact to={{ pathname: sanitizedPathname() }}>
            <IconButton
              ariaLabel={'View your pipeline'}
              dataTest={'global-toolbar-flowchart-btn'}
              className={
                'pipeline-menu-button--large pipeline-menu-button--link'
              }
              disabled={false}
              icon={TreeIcon}
              labelText="Flowchart"
            />
          </NavLink>
        </ul>
        <ul className="pipeline-global-control-toolbar kedro">
          <IconButton
            ariaLabel={`Change to ${
              theme === 'light' ? 'dark' : 'light'
            } theme`}
            ariaLive="polite"
            dataTest={`global-toolbar-theme-btn-${theme}`}
            className={
              'pipeline-menu-button--theme pipeline-menu-button--large'
            }
            icon={ThemeIcon}
            labelText="Toggle theme"
            onClick={() => onToggleTheme(theme === 'light' ? 'dark' : 'light')}
          />
          {isRunningLocally() ? (
            <IconButton
              ariaLabel={'Publish and share'}
              className={
                'pipeline-menu-button--deploy pipeline-menu-button--large'
              }
              dataTest={'global-toolbar-deploy-btn'}
              disabled={false}
              icon={DownloadIcon}
              labelText={'Publish and share'}
              onClick={() => onToggleShareableUrlModal(true)}
            />
          ) : null}
          <IconButton
            ariaLabel={'Change the settings flags'}
            className={
              'pipeline-menu-button--settings pipeline-menu-button--large'
            }
            dataTest={'global-toolbar-settings-btn'}
            disabled={false}
            icon={SettingsIcon}
            labelText={'Settings'}
            onClick={() => onToggleSettingsModal(true)}
          >
            {isOutdated && <span className="update-reminder-dot"></span>}
          </IconButton>
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
  onToggleShareableUrlModal: (value) => {
    dispatch(toggleShareableUrlModal(value));
  },
  onToggleTheme: (value) => {
    dispatch(toggleTheme(value));
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(GlobalToolbar);
