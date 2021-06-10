import React from 'react';
import { connect } from 'react-redux';
import Modal from '@quantumblack/kedro-ui/lib/components/modal';
import Button from '@quantumblack/kedro-ui/lib/components/button';
import { changeFlag, toggleSettingsModal } from '../../actions';
import { Flags, getFlagsData } from '../../utils/flags';
import { flags } from '../../config';
import './settings-modal.css';
import SettingsToggle from './settings-toggle';

/**
 * Kedro-UI modal to allow users to choose between SVG/PNG export formats
 */

const SettingsModal = ({ theme, onToggle, onToggleFlag, visible, flags }) => {
  if (!visible.settingsBtn) {
    return null;
  }
  const flagData = getFlagsData();
  return (
    <div className="pipeline-settings-modal">
      <Modal
        title="Settings"
        theme={theme}
        onClose={() => onToggle(false)}
        visible={visible.settingsModal}>
        <div className="pipeline-settings-modal__content">
          <div className="pipeline-settings-modal__subtitle">Flags</div>
          <div className="pipeline-settings-modal__header">
            <div className="col-3 pipeline-settings-modal__name">Name</div>
            <div className="col-3 pipeline-settings-modal__state">State</div>
            <div className="col-6 pipeline-settings-modal__description">
              Description
            </div>
          </div>
          {flagData.map(({ name, value, description }, index) => (
            <div className="pipeline-settings-modal__grid" key={index}>
              <div className="col-3">{name}</div>
              <SettingsToggle
                id={name}
                className="col-3"
                checked={flags[value]}
                onChange={(event) =>
                  onToggleFlag(value, event.target.checked)
                }></SettingsToggle>
              <div className="col-6">{description}</div>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
};

export const mapStateToProps = (state) => ({
  visible: state.visible,
  theme: state.theme,
  flags: state.flags,
});

export const mapDispatchToProps = (dispatch) => ({
  onToggle: (value) => {
    dispatch(toggleSettingsModal(value));
  },
  onToggleFlag: (name, value) => {
    dispatch(changeFlag(name, value));
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(SettingsModal);
