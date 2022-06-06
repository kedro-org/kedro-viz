import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import {
  changeFlag,
  toggleSettingsModal,
  togglePrettyName,
} from '../../actions';
import { getFlagsState } from '../../utils/flags';
import SettingsModalRow from './settings-modal-row';
import { settings as settingsConfig } from '../../config';

import Modal from '../ui/modal';
import Button from '../ui/button';

import './settings-modal.css';

/**
 * Modal to allow users to change the flag settings
 */

const SettingsModal = ({
  flags,
  isOutdated,
  latestVersion,
  showSettingsModal,
  onToggleFlag,
  onTogglePrettyName,
  prettyName,
  visible,
}) => {
  const [hasNotInteracted, setHasNotInteracted] = useState(true);
  const [hasClickedApplyAndClose, setHasClickApplyAndClose] = useState(false);
  const flagData = getFlagsState();

  useEffect(() => {
    let modalTimeout, resetTimeout;

    if (hasClickedApplyAndClose) {
      modalTimeout = setTimeout(() => {
        showSettingsModal(false);
      }, 1500);

      // Delay the reset so the user can't see the button text change.
      resetTimeout = setTimeout(() => {
        setHasNotInteracted(true);
        setHasClickApplyAndClose(false);
        window.location.reload();
      }, 2000);
    }

    return () => {
      clearTimeout(modalTimeout);
      clearTimeout(resetTimeout);
    };
  }, [hasClickedApplyAndClose, showSettingsModal]);

  const resetStateCloseModal = () => {
    showSettingsModal(false);
    setHasNotInteracted(true);
  };

  return (
    <div className="pipeline-settings-modal">
      <Modal
        closeModal={() => resetStateCloseModal()}
        title="Settings"
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
            onToggleChange={(event) => {
              onTogglePrettyName(event.target.checked);
              setHasNotInteracted(false);
            }}
          />
          <div className="pipeline-settings-modal__subtitle">Experiments</div>
          {flagData.map(({ name, value, description }) => (
            <SettingsModalRow
              description={description}
              id={value}
              key={value}
              name={name}
              onToggleChange={(event) => {
                onToggleFlag(value, event.target.checked);
                setHasNotInteracted(false);
              }}
              toggleValue={flags[value]}
            />
          ))}
          {isOutdated ? (
            <div className="pipeline-settings-modal__upgrade-reminder">
              <span>&#8226; Kedro-Viz {latestVersion} is here! </span>
              <a
                href="https://github.com/kedro-org/kedro-viz/releases"
                target="_blank"
                rel="noopener noreferrer"
              >
                View release notes
              </a>
            </div>
          ) : (
            <div className="pipeline-settings-modal__already-latest">
              <span>
                &#8226; You are on the latest version of Kedro-Viz (
                {latestVersion})
              </span>
            </div>
          )}
          <div className="run-details-modal-button-wrapper">
            <Button
              mode="secondary"
              onClick={() => {
                showSettingsModal(false);
                setHasNotInteracted(true);
              }}
              size="small"
            >
              Cancel
            </Button>
            <Button
              disabled={hasNotInteracted}
              onClick={() => {
                setHasClickApplyAndClose(true);
              }}
              mode={hasClickedApplyAndClose ? 'success' : 'primary'}
              size="small"
            >
              {hasClickedApplyAndClose ? (
                <>
                  Changes applied <span className="success-check-mark">✅</span>
                </>
              ) : (
                'Apply changes and close'
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export const mapStateToProps = (state) => ({
  flags: state.flags,
  prettyName: state.prettyName,
  visible: state.visible,
});

export const mapDispatchToProps = (dispatch) => ({
  showSettingsModal: (value) => {
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
