/* eslint-disable camelcase */
import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import classnames from 'classnames';
import { toggleShareableUrlModal } from '../../actions';
import { hostingPlatform, inputKeyToStateKeyMap } from '../../config';

import {
  renderCompatibilityMessage,
  renderSuccessContent,
  renderErrorContent,
  renderDisclaimerContent,
  renderLoadingContent,
  renderTextContent,
} from './shareable-url-jsx';

import Button from '../ui/button';
import Dropdown from '../ui/dropdown';
import Input from '../ui/input';
import Modal from '../ui/modal';
import MenuOption from '../ui/menu-option';

import './shareable-url-modal.scss';

const modalMessages = (status, info = '') => {
  const messages = {
    failure: 'Something went wrong. Please try again later.',
    loading: 'Shooting your files through space. Sit tight...',
    success:
      'The current version of Kedro-Viz has been published and hosted via the link below.',
    incompatible: `Publishing Kedro-Viz is only supported with fsspec>=2023.9.0. You are currently on version ${info}.\n\nPlease upgrade fsspec to a supported version and ensure you're using Kedro 0.18.2 or above.`,
  };

  return messages[status];
};

const ShareableUrlModal = ({ onToggleModal, visible }) => {
  const [deploymentState, setDeploymentState] = useState('default');
  const [inputValues, setInputValues] = useState({});
  const [isFormDirty, setIsFormDirty] = useState({
    hasBucketName: false,
    hasPlatform: false,
    hasEndpoint: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [responseUrl, setResponseUrl] = useState(null);
  const [responseError, setResponseError] = useState(null);
  const [showCopied, setShowCopied] = useState(false);
  const [isLinkSettingsClick, setIsLinkSettingsClick] = useState(false);
  const [compatibilityData, setCompatibilityData] = useState({});
  const [canUseShareableUrls, setCanUseShareableUrls] = useState(true);
  const [isDisclaimerViewed, setIsDisclaimerViewed] = useState(false);

  useEffect(() => {
    async function fetchPackageCompatibility() {
      try {
        const request = await fetch('/api/package-compatibilities', {
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        });
        const response = await request.json();

        if (request.ok) {
          setCompatibilityData(response);
          setCanUseShareableUrls(response?.is_compatible || false);

          // User's fsspec package version isn't compatible, so set
          // the necessary state to reflect that in the UI.
          if (!response.is_compatible) {
            setDeploymentState(!response.is_compatible && 'incompatible');
          }
        }
      } catch (error) {
        console.error('package-compatibilities fetch error: ', error);
      }
    }

    fetchPackageCompatibility();
  }, []);

  const onChange = (key, value) => {
    setIsFormDirty((prevState) => ({
      ...prevState,
      [inputKeyToStateKeyMap[key]]: !!value,
    }));
    setInputValues(
      Object.assign({}, inputValues, {
        [key]: value,
      })
    );
  };

  const handleSubmit = async () => {
    setDeploymentState('loading');
    setIsLoading(true);

    try {
      const request = await fetch('/api/deploy', {
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
        body: JSON.stringify(inputValues),
      });
      const response = await request.json();

      if (request.ok) {
        setResponseUrl(response.url);
        setDeploymentState('success');
      } else {
        setResponseUrl(null);
        setResponseError(response.message || 'Error occurred!');
        setDeploymentState('failure');
      }
    } catch (error) {
      console.error(error);
      setResponseError(error.message || 'Error occurred!');
      setDeploymentState('failure');
    } finally {
      setIsLoading(false);
    }
  };

  const onCopyClick = () => {
    window.navigator.clipboard.writeText(responseUrl);
    setShowCopied(true);

    setTimeout(() => {
      setShowCopied(false);
    }, 1500);
  };

  const handleModalClose = () => {
    onToggleModal(false);
    if (deploymentState !== 'incompatible') {
      setDeploymentState('default');
    }
    setResponseError(null);
    setIsLoading(false);
    setResponseUrl(null);
    setIsLinkSettingsClick(false);
    setInputValues({});
    setIsDisclaimerViewed(false);
    setIsFormDirty({
      hasBucketName: false,
      hasPlatform: false,
      hasEndpoint: false,
    });
  };

  const getDeploymentStateByType = (type) => {
    if (deploymentState === 'default') {
      return null;
    }

    if (type === 'title') {
      return deploymentState === 'success'
        ? 'Kedro-Viz Published and Hosted'
        : 'Publish and Share Kedro-Viz';
    }

    return modalMessages(deploymentState, compatibilityData.package_version);
  };

  const handleResponseUrl = () => {
    // If the URL does not start with http:// or https://, append http:// to avoid relative path issue for GCP platform.
    if (!/^https?:\/\//.test(responseUrl) && inputValues.platform === 'gcp') {
      const url = 'http://' + responseUrl;
      return url;
    }
    return responseUrl;
  };

  const handleLinkSettingsClick = () => {
    setDeploymentState('default');
    setIsLoading(false);
    setResponseUrl(null);
    setIsLinkSettingsClick(true);
  };

  const handleGoBackClick = () => {
    setDeploymentState('default');
    setIsLoading(false);
    setResponseUrl(null);
    setResponseError(null);
  };

  const clearDisclaimerMessage = () => setIsDisclaimerViewed(true);

  const renderMainContent = () => {
    return !isLoading &&
      !responseUrl &&
      canUseShareableUrls &&
      !responseError ? (
      <>
        <div className="shareable-url-modal__content-form-wrapper">
          {renderTextContent()}
          <div className="shareable-url-modal__form-wrapper">
            <div className="shareable-url-modal__input-wrapper">
              <div className="shareable-url-modal__input-label">
                Hosting platform
              </div>
              <Dropdown
                defaultText={platform && hostingPlatform[platform]}
                placeholderText={!platform ? 'Select a hosting platform' : null}
                onChanged={(selectedPlatform) => {
                  onChange('platform', selectedPlatform.value);
                }}
                width={null}
              >
                {Object.entries(hostingPlatform).map(([value, label]) => (
                  <MenuOption
                    className={classnames({
                      'pipeline-list__option--active': platform === value,
                    })}
                    key={value}
                    primaryText={label}
                    value={value}
                  />
                ))}
              </Dropdown>
            </div>
            <div className="shareable-url-modal__input-wrapper">
              <div className="shareable-url-modal__input-label">
                Bucket Name
              </div>
              <Input
                defaultValue={bucket_name}
                onChange={(value) => onChange('bucket_name', value)}
                placeholder="Enter name"
                resetValueTrigger={visible}
                size="small"
                type="input"
                dataTest={'bucket_name'}
              />
            </div>
            <div className="shareable-url-modal__input-wrapper">
              <div className="shareable-url-modal__input-label">
                Endpoint Link
              </div>
              <Input
                defaultValue={endpoint}
                onChange={(value) => onChange('endpoint', value)}
                placeholder="Enter url"
                resetValueTrigger={visible}
                size="small"
                type="input"
                dataTest={'endpoint_name'}
              />
            </div>
          </div>
        </div>
        <div className="shareable-url-modal__button-wrapper shareable-url-modal__button-wrapper--right">
          <Button
            mode="secondary"
            onClick={() => handleModalClose()}
            size="small"
          >
            Cancel
          </Button>
          <Button
            disabled={!Object.values(isFormDirty).every((value) => value)}
            size="small"
            onClick={handleSubmit}
          >
            {isLinkSettingsClick ? 'Republish' : 'Publish'}
          </Button>
        </div>
      </>
    ) : null;
  };

  const { platform, bucket_name, endpoint } = inputValues || {};

  return (
    <Modal
      className={classnames('shareable-url-modal', {
        'shareable-url-modal__non-default-wrapper':
          deploymentState !== 'default',
      })}
      closeModal={handleModalClose}
      message={getDeploymentStateByType('message')}
      title={getDeploymentStateByType('title')}
      visible={visible.shareableUrlModal}
    >
      {!isDisclaimerViewed ? (
        renderDisclaimerContent(clearDisclaimerMessage, handleModalClose)
      ) : (
        <>
          {renderMainContent()}
          {renderLoadingContent(isLoading)}
          {renderErrorContent(responseError, handleGoBackClick)}
          {renderSuccessContent(
            responseUrl,
            showCopied,
            onCopyClick,
            handleResponseUrl,
            handleModalClose,
            handleLinkSettingsClick
          )}
          {renderCompatibilityMessage(canUseShareableUrls, handleModalClose)}
        </>
      )}
    </Modal>
  );
};

export const mapStateToProps = (state) => ({
  visible: state.visible,
});

export const mapDispatchToProps = (dispatch) => ({
  onToggleModal: (value) => {
    dispatch(toggleShareableUrlModal(value));
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(ShareableUrlModal);
