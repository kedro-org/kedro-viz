import React, { useState } from 'react';
import { connect } from 'react-redux';
import { toggleTextLabels, toggleTheme } from '../../actions';
import IconButton from './icon-button';
import ExportModal from './export-modal';
import './icon-toolbar.css';

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
        <ExportModal visible={isModalVisible} toggleModal={toggleModal} />
      )}
    </>
  );
};

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
