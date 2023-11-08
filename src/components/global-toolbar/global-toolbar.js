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
import ExperimentsIcon from '../icons/experiments';
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
            dataTest={'Kedro Icon'}
            disabled={false}
            icon={LogoIcon}
          />
          <NavLink exact to={{ pathname: sanitizedPathname() }}>
            <IconButton
              ariaLabel={'View your pipeline'}
              dataTest={'View your pipeline'}
              className={
                'pipeline-menu-button--large pipeline-menu-button--link'
              }
              data-test={'FlowChart Icon'}
              disabled={false}
              icon={TreeIcon}
              labelText="Flowchart"
            />
          </NavLink>
          {isRunningLocally() ? (
            <NavLink
              exact
              id="experiment-tracking-nav-button"
              to={{ pathname: `${sanitizedPathname()}experiment-tracking` }}
            >
              <IconButton
                ariaLabel={'View your experiments'}
                className={
                  'pipeline-menu-button--large pipeline-menu-button--link'
                }
                dataTest={'View your experiments'}
                disabled={false}
                icon={ExperimentsIcon}
                labelText="Experiment tracking"
              />
            </NavLink>
          ) : null}
        </ul>
        <ul className="pipeline-global-control-toolbar kedro">
          <IconButton
            ariaLabel={`Change to ${
              theme === 'light' ? 'dark' : 'light'
            } theme`}
            ariaLive="polite"
            dataTest={'Toggle Theme'}
            className={
              'pipeline-menu-button--theme pipeline-menu-button--large'
            }
            dataHeapEvent={`theme.${theme}`}
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
              dataTest={'Publish and share Kedro-Viz'}
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
            dataTest={'Change the settings flags'}
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
