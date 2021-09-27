import { connect } from 'react-redux';
import { toggleSettingsModal, toggleTheme } from '../../actions';
import IconButton from '../icon-button';
import SettingsIcon from '../icons/settings';
import ThemeIcon from '../icons/theme';

import './global-toolbar.css';

/**
 * Main controls for filtering the chart data
 * @param {Function} onToggleTheme Handle toggling theme between light/dark
 * @param {string} theme Kedro UI light/dark theme
 */
export const GlobalToolbar = ({
  onToggleSettingsModal,
  onToggleTheme,
  theme,
  visible,
}) => {
  return (
    <>
      <div className="global-toolbar">
        <ul className="global-primary-toolbar kedro">
          <IconButton
            ariaLive="polite"
            ariaLabel={`Change to ${
              theme === 'light' ? 'dark' : 'light'
            } theme`}
            className={'pipeline-menu-button--theme toolbar-menu-button--large'}
            onClick={() => onToggleTheme(theme === 'light' ? 'dark' : 'light')}
            icon={ThemeIcon}
            labelText="Toggle theme"
            visible={visible.themeBtn}
          />
          <IconButton
            ariaLabel={'Change the settings flags'}
            className={
              'pipeline-menu-button--settings toolbar-menu-button--large'
            }
            onClick={() => onToggleSettingsModal(true)}
            icon={SettingsIcon}
            disabled={false}
            labelText={'Settings'}
            visible={visible.settingsBtn}
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
