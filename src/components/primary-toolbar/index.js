import React from 'react';
import classnames from 'classnames';
import { connect } from 'react-redux';
import {
  toggleExportModal,
  toggleLayers,
  toggleSidebar,
  toggleTextLabels,
  toggleTheme
} from '../../actions';
import IconButton from '../icon-button';
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
  onToggleLayers,
  onToggleSidebar,
  onToggleTextLabels,
  onToggleTheme,
  textLabels,
  theme,
  visible,
  visibleLayers
}) => (
  <>
    <ul className="pipeline-primary-toolbar kedro">
      <IconButton
        ariaLabel={`${visible.sidebar ? 'Hide' : 'Show'} menu`}
        className={classnames('pipeline-menu-button', {
          'pipeline-menu-button--inverse': !visible.sidebar
        })}
        onClick={() => onToggleSidebar(!visible.sidebar)}
        icon="menu"
        labelText={`${visible.sidebar ? 'Hide' : 'Show'} menu`}
      />
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
        onClick={() => onToggleExportModal(true)}
        icon="export"
        labelText="Export visualisation"
        visible={visible.exportBtn}
      />
      <IconButton
        ariaLabel={`Turn data layers ${visibleLayers ? 'off' : 'on'}`}
        onClick={() => onToggleLayers(!visibleLayers)}
        icon="layers"
        labelText={`${visibleLayers ? 'Hide' : 'Show'} layers`}
        disabled={disableLayerBtn}
        visible={visible.layerBtn}
      />
    </ul>
  </>
);

export const mapStateToProps = state => ({
  disableLayerBtn: !state.layer.ids.length,
  textLabels: state.textLabels,
  theme: state.theme,
  visible: state.visible,
  visibleLayers: Boolean(getVisibleLayerIDs(state).length)
});

export const mapDispatchToProps = dispatch => ({
  onToggleExportModal: value => {
    dispatch(toggleExportModal(value));
  },
  onToggleLayers: value => {
    dispatch(toggleLayers(Boolean(value)));
  },
  onToggleSidebar: visible => {
    dispatch(toggleSidebar(visible));
  },
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
)(PrimaryToolbar);
