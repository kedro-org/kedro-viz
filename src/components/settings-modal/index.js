import React from 'react';
import { connect } from 'react-redux';
import Modal from '@quantumblack/kedro-ui/lib/components/modal';
import { changeFlag, toggleSettingsModal } from '../../actions';
import { getFlagsState } from '../../utils/flags';
import './settings-modal.css';
import Toggle from '../toggle';

/**
 * Kedro-UI modal to allow users to change the flag settings
 */

const SettingsModal = ({ theme, onClose, onToggleFlag, visible, flags }) => {
  if (!visible.settingsBtn) {
    return null;
  }
  const flagData = getFlagsState();
  return (
    <div className="pipeline-settings-modal">
      <Modal
        title="Settings"
        theme={theme}
        onClose={() => onClose(false)}
        visible={visible.settingsModal}>
        <div className="pipeline-settings-modal__content">
          <div className="pipeline-settings-modal__subtitle">Flags</div>
          <div className="pipeline-settings-modal__header">
            <div className="pipeline-settings-modal__name">Name</div>
            <div className="pipeline-settings-modal__state">State</div>
            <div className="pipeline-settings-modal__description">
              Description
            </div>
          </div>
          {flagData.map(({ name, value, description }, index) => (
            <div className="pipeline-settings-modal__column" key={value}>
              <div className="pipeline-settings-modal__name">{name}</div>
              <Toggle
                id={value}
                className="pipeline-settings-modal__state"
                title={flags[value] ? 'On' : 'Off'}
                checked={flags[value]}
                onChange={(event) =>
                  onToggleFlag(value, event.target.checked)
                }></Toggle>
              <div className="pipeline-settings-modal__description">
                {description}
              </div>
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
  onClose: (value) => {
    dispatch(toggleSettingsModal(value));
  },
  onToggleFlag: (name, value) => {
    dispatch(changeFlag(name, value));
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(SettingsModal);
