import React from 'react';
import { connect } from 'react-redux';
import Modal from '../modal';
import {
  changeFlag,
  toggleSettingsModal,
  togglePrettyName,
} from '../../actions';
import { getFlagsState } from '../../utils/flags';
import SettingsModalRow from './settings-modal-row';
import { settings as settingsConfig } from '../../config';
import './settings-modal.css';

/**
 * Kedro-UI modal to allow users to change the flag settings
 */

const SettingsModal = ({
  theme,
  prettyName,
  onClose,
  onToggleFlag,
  onTogglePrettyName,
  visible,
  flags,
}) => {
  const flagData = getFlagsState();

  return (
    <div className="pipeline-settings-modal">
      <Modal
        title="Settings"
        onClose={() => onClose(false)}
        visible={visible.settingsModal}
      >
        <div className="pipeline-settings-modal__content">
          <div className="pipeline-settings-modal__subtitle">General</div>
          <div className="pipeline-settings-modal__header">
            <div className="pipeline-settings-modal__name">Name</div>
            <div className="pipeline-settings-modal__state">State</div>
            <div className="pipeline-settings-modal__description">
              Description
            </div>
          </div>
          <SettingsModalRow
            id="prettyName"
            name={settingsConfig['prettyName'].name}
            toggleValue={prettyName}
            description={settingsConfig['prettyName'].description}
            onToggleChange={(event) => onTogglePrettyName(event.target.checked)}
          />
          <div className="pipeline-settings-modal__subtitle">Experiments</div>
          {flagData.map(({ name, value, description }, index) => (
            <SettingsModalRow
              key={value}
              id={value}
              name={name}
              toggleValue={flags[value]}
              description={description}
              onToggleChange={(event) =>
                onToggleFlag(value, event.target.checked)
              }
            />
          ))}
        </div>
      </Modal>
    </div>
  );
};

export const mapStateToProps = (state) => ({
  visible: state.visible,
  theme: state.theme,
  prettyName: state.prettyName,
  flags: state.flags,
});

export const mapDispatchToProps = (dispatch) => ({
  onClose: (value) => {
    dispatch(toggleSettingsModal(value));
  },
  onToggleFlag: (name, value) => {
    dispatch(changeFlag(name, value));
  },
  onTogglePrettyName: (value) => {
    dispatch(togglePrettyName(value));
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(SettingsModal);
