import React from 'react';
import classnames from 'classnames';
import { connect } from 'react-redux';
import {
  toggleExportModal,
  toggleSettingsModal,
  toggleLayers,
  toggleSidebar,
  toggleTextLabels,
  toggleTheme,
} from '../../actions';
import IconButton from '../icon-button';
import MenuIcon from '../icons/menu';
import ThemeIcon from '../icons/theme';
import LabelIcon from '../icons/label';
import ExportIcon from '../icons/export';
import LayersIcon from '../icons/layers';
import SettingsIcon from '../icons/settings';
import { getVisibleLayerIDs } from '../../selectors/disabled';
import './primary-toolbar.css';

/**
 * Main contols for filtering the chart data
 * @param {Function} onToggleTheme Handle toggling theme between light/dark
 * @param {Function} onToggleTextLabels Handle toggling text labels on/off
 * @param {Boolean} textLabels Whether text labels are displayed
 * @param {string} theme Kedro UI light/dark theme
 */
export const PrimaryToolbar = ({
  disableLayerBtn,
  onToggleExportModal,
  onToggleSettingsModal,
  onToggleLayers,
  onToggleSidebar,
  onToggleTextLabels,
  onToggleTheme,
  textLabels,
  theme,
  visible,
  visibleLayers,
}) => (
  <>
    <ul className="pipeline-primary-toolbar kedro">
      <IconButton
        ariaLabel={`${visible.sidebar ? 'Hide' : 'Show'} menu`}
        className={classnames(
          'pipeline-menu-button',
          'pipeline-menu-button--menu',
          {
            'pipeline-menu-button--inverse': !visible.sidebar,
          }
        )}
        onClick={() => onToggleSidebar(!visible.sidebar)}
        icon={MenuIcon}
        labelText={`${visible.sidebar ? 'Hide' : 'Show'} menu`}
      />
      <IconButton
        ariaLive="polite"
        ariaLabel={`Change to ${theme === 'light' ? 'dark' : 'light'} theme`}
        className={'pipeline-menu-button--theme'}
        onClick={() => onToggleTheme(theme === 'light' ? 'dark' : 'light')}
        icon={ThemeIcon}
        labelText="Toggle theme"
        visible={visible.themeBtn}
      />
      <IconButton
        ariaLive="polite"
        className={'pipeline-menu-button--labels'}
        onClick={() => onToggleTextLabels(!textLabels)}
        icon={LabelIcon}
        labelText={`${textLabels ? 'Hide' : 'Show'} text labels`}
        visible={visible.labelBtn}
      />
      <IconButton
        ariaLabel="Export graph as SVG or PNG"
        className={'pipeline-menu-button--export'}
        onClick={() => onToggleExportModal(true)}
        icon={ExportIcon}
        labelText="Export visualisation"
        visible={visible.exportBtn}
      />
      <IconButton
        ariaLabel={`Turn data layers ${visibleLayers ? 'off' : 'on'}`}
        className={'pipeline-menu-button--layers'}
        onClick={() => onToggleLayers(!visibleLayers)}
        icon={LayersIcon}
        labelText={`${visibleLayers ? 'Hide' : 'Show'} layers`}
        disabled={disableLayerBtn}
        visible={visible.layerBtn}
      />
      <IconButton
        ariaLabel={'Change the settings flags'}
        className={'pipeline-menu-button--settings'}
        onClick={() => onToggleSettingsModal(true)}
        icon={SettingsIcon}
        disabled={false}
        labelText={'Settings'}
        visible={visible.settingsBtn}
      />
    </ul>
  </>
);

export const mapStateToProps = (state) => ({
  disableLayerBtn: !state.layer.ids.length,
  textLabels: state.textLabels,
  theme: state.theme,
  visible: state.visible,
  visibleLayers: Boolean(getVisibleLayerIDs(state).length),
});

export const mapDispatchToProps = (dispatch) => ({
  onToggleExportModal: (value) => {
    dispatch(toggleExportModal(value));
  },
  onToggleSettingsModal: (value) => {
    dispatch(toggleSettingsModal(value));
  },
  onToggleLayers: (value) => {
    dispatch(toggleLayers(Boolean(value)));
  },
  onToggleSidebar: (visible) => {
    dispatch(toggleSidebar(visible));
  },
  onToggleTextLabels: (value) => {
    dispatch(toggleTextLabels(Boolean(value)));
  },
  onToggleTheme: (value) => {
    dispatch(toggleTheme(value));
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(PrimaryToolbar);
