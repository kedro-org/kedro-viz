import React, { useEffect, useState, useCallback } from 'react';
import { connect } from 'react-redux';
import {
  changeFlag,
  toggleShowFeatureHints,
  toggleIsPrettyName,
  toggleSettingsModal,
} from '../../actions';
import {
  getPreferences,
  updateUserPreferences,
} from '../../actions/preferences';
import { getFlagsState } from '../../utils/flags';
import SettingsModalRow from './settings-modal-row';
import { settings as settingsConfig, localStorageName } from '../../config';
import { saveLocalStorage } from '../../store/helpers';
import { localStorageKeyFeatureHintsStep } from '../../components/feature-hints/feature-hints';
import { updatePreferences } from '../../utils/preferences-api';

import Button from '../ui/button';
import Modal from '../ui/modal';

import './settings-modal.scss';
import { isRunningLocally } from '../../utils';

/**
 * Modal to allow users to change the flag settings
 */

const SettingsModal = ({
  flags,
  showFeatureHints,
  isOutdated,
  isPrettyName,
  showDatasetPreviews,
  latestVersion,
  onToggleFlag,
  onToggleShowFeatureHints,
  onToggleIsPrettyName,
  onToggleShowDatasetPreviews,
  showSettingsModal,
  getPreferences,
  visible,
}) => {
  const flagData = getFlagsState();
  const [hasNotInteracted, setHasNotInteracted] = useState(true);
  const [hasClickedApplyAndClose, setHasClickApplyAndClose] = useState(false);
  const [isPrettyNameValue, setIsPrettyName] = useState(isPrettyName);
  const [showFeatureHintsValue, setShowFeatureHintsValue] =
    useState(showFeatureHints);
  const [showDatasetPreviewsValue, setShowDatasetPreviewsValue] =
    useState(showDatasetPreviews);
  const [toggleFlags, setToggleFlags] = useState(flags);

  useEffect(() => {
    setShowFeatureHintsValue(showFeatureHints);
  }, [showFeatureHints]);

  useEffect(() => {
    setShowDatasetPreviewsValue(showDatasetPreviews);
  }, [showDatasetPreviews]);

  useEffect(() => {
    if (visible.settingsModal) {
      getPreferences();
    }
  }, [visible.settingsModal, getPreferences]);

  const handleSavePreferences = useCallback(async () => {
    try {
      await updatePreferences(showDatasetPreviewsValue);
    } catch (error) {
      console.error('Error updating preferences:', error);
    }
  }, [showDatasetPreviewsValue]);

  useEffect(() => {
    let modalTimeout, resetTimeout;

    if (hasClickedApplyAndClose) {
      modalTimeout = setTimeout(() => {
        showSettingsModal(false);
      }, 1500);

      // Delay the reset so the user can't see the button text change.
      resetTimeout = setTimeout(() => {
        const updatedFlags = Object.entries(toggleFlags);
        updatedFlags.map((each) => {
          const [name, value] = each;

          return onToggleFlag(name, value);
        });

        handleSavePreferences();
        onToggleIsPrettyName(isPrettyNameValue);
        onToggleShowFeatureHints(showFeatureHintsValue);
        onToggleShowDatasetPreviews(showDatasetPreviewsValue);
        setHasNotInteracted(true);
        setHasClickApplyAndClose(false);

        window.location.reload();
      }, 2000);
    }

    return () => {
      clearTimeout(modalTimeout);
      clearTimeout(resetTimeout);
    };
  }, [
    hasClickedApplyAndClose,
    showFeatureHintsValue,
    isPrettyNameValue,
    showDatasetPreviewsValue,
    onToggleFlag,
    onToggleShowFeatureHints,
    onToggleIsPrettyName,
    onToggleShowDatasetPreviews,
    showSettingsModal,
    toggleFlags,
    handleSavePreferences,
  ]);

  const resetStateCloseModal = () => {
    showSettingsModal(false);
    setHasNotInteracted(true);
    setToggleFlags(flags);
    setIsPrettyName(isPrettyName);
    setShowFeatureHintsValue(showFeatureHints);
    setShowDatasetPreviewsValue(showDatasetPreviews);
  };

  return (
    <div className="pipeline-settings-modal">
      <Modal
        closeModal={resetStateCloseModal}
        title="Settings"
        visible={visible.settingsModal}
      >
        <div className="pipeline-settings-modal__content">
          <div className="pipeline-settings-modal__group">
            <SettingsModalRow
              id="isPrettyName"
              name={settingsConfig['isPrettyName'].name}
              toggleValue={isPrettyNameValue}
              description={settingsConfig['isPrettyName'].description}
              onToggleChange={(event) => {
                setIsPrettyName(event.target.checked);
                setHasNotInteracted(false);
              }}
            />
            <SettingsModalRow
              id="showFeatureHints"
              name={settingsConfig['showFeatureHints'].name}
              toggleValue={showFeatureHintsValue}
              description={settingsConfig['showFeatureHints'].description}
              onToggleChange={(event) => {
                setShowFeatureHintsValue(event.target.checked);
                setHasNotInteracted(false);

                if (event.target.checked === false) {
                  saveLocalStorage(localStorageName, {
                    [localStorageKeyFeatureHintsStep]: 0,
                  });
                }
              }}
            />
            <SettingsModalRow
              id="showDatasetPreviews"
              name={settingsConfig['showDatasetPreviews'].name}
              toggleValue={showDatasetPreviewsValue}
              description={settingsConfig['showDatasetPreviews'].description}
              onToggleChange={(event) => {
                setShowDatasetPreviewsValue(event.target.checked);
                setHasNotInteracted(false);
              }}
            />
            {flagData.map(({ name, value, description }) => (
              <SettingsModalRow
                description={description}
                id={value}
                key={value}
                name={name}
                onToggleChange={(event) => {
                  setToggleFlags({
                    ...toggleFlags,
                    [value]: event.target.checked,
                  });

                  setHasNotInteracted(false);
                }}
                toggleValue={toggleFlags[value]}
              />
            ))}
          </div>
          <div className="version-reminder-and-run-details-button-wrapper">
            {isRunningLocally() ? (
              isOutdated ? (
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
              )
            ) : null}
            <div className="pipeline-settings-modal-buttons">
              <Button
                dataTest={'settings-modal-close-btn'}
                mode="secondary"
                onClick={resetStateCloseModal}
                size="small"
              >
                Cancel
              </Button>
              <Button
                dataTest={'settings-modal-apply-btn'}
                disabled={hasNotInteracted}
                onClick={() => {
                  setHasClickApplyAndClose(true);
                }}
                mode={hasClickedApplyAndClose ? 'success' : 'primary'}
                size="small"
              >
                {hasClickedApplyAndClose ? (
                  <>
                    Changes applied{' '}
                    <span className="success-check-mark">✅</span>
                  </>
                ) : (
                  'Save and apply'
                )}
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export const mapStateToProps = (state) => ({
  flags: state.flags,
  showFeatureHints: state.showFeatureHints,
  isPrettyName: state.isPrettyName,
  showDatasetPreviews: state.userPreferences.showDatasetPreviews,
  visible: state.visible,
});

export const mapDispatchToProps = (dispatch) => ({
  showSettingsModal: (value) => {
    dispatch(toggleSettingsModal(value));
  },
  getPreferences: () => {
    dispatch(getPreferences());
  },
  onToggleFlag: (name, value) => {
    dispatch(changeFlag(name, value));
  },
  onToggleIsPrettyName: (value) => {
    dispatch(toggleIsPrettyName(value));
  },
  onToggleShowFeatureHints: (value) => {
    dispatch(toggleShowFeatureHints(value));
  },
  onToggleShowDatasetPreviews: (value) => {
    dispatch(updateUserPreferences({ showDatasetPreviews: value }));
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(SettingsModal);
