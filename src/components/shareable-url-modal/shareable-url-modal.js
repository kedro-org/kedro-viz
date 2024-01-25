import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import classnames from 'classnames';
import { toggleShareableUrlModal } from '../../actions';
import { hostingPlatform } from '../../config';

import Button from '../ui/button';
import CopyIcon from '../icons/copy';
import Dropdown from '../ui/dropdown';
import IconButton from '../ui/icon-button';
import Input from '../ui/input';
import LoadingIcon from '../icons/loading';
import Modal from '../ui/modal';
import MenuOption from '../ui/menu-option';
import Tooltip from '../ui/tooltip';

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
    /* eslint-disable camelcase */
    bucket_name: false,
    platform: false,
    endpoint: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [responseUrl, setResponseUrl] = useState(null);
  const [responseError, setResponseError] = useState(null);
  const [showCopied, setShowCopied] = useState(false);
  const [isLinkSettingsClick, setIsLinkSettingsClick] = useState(false);
  const [compatibilityData, setCompatibilityData] = useState({});
  const [canUseShareableUrls, setCanUseShareableUrls] = useState(true);

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
    setIsFormDirty((prevState) => ({ ...prevState, [key]: !!value }));
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
    setIsFormDirty({
      bucket_name: false,
      platform: false,
      endpoint: false,
    }); /* eslint-disable camelcase */
  };

  const getModalHeading = (type) => {
    if (type === 'title' && deploymentState !== 'default') {
      if (deploymentState === 'success') {
        return 'Kedro-Viz Published and Hosted';
      } else {
        return 'Publish and Share Kedro-Viz';
      }
    } else {
      if (deploymentState !== 'default') {
        return modalMessages(
          deploymentState,
          compatibilityData.package_version
        );
      }

      return null;
    }
  };

  return (
    <Modal
      className={classnames('shareable-url-modal', {
        'shareable-url-modal__non-default-wrapper':
          deploymentState !== 'default',
      })}
      closeModal={handleModalClose}
      message={getModalHeading('message')}
      title={getModalHeading('title')}
      visible={visible.shareableUrlModal}
    >
      {!isLoading && !responseUrl && canUseShareableUrls && !responseError ? (
        <>
          <div className="shareable-url-modal__content-form-wrapper">
            <div className="shareable-url-modal__content-wrapper">
              <div className="shareable-url-modal__content-title">
                Publish and Share Kedro-Viz
              </div>
              <p className="shareable-url-modal__content-description">
                Prerequisite: Deploying and hosting Kedro-Viz requires access
                keys or user credentials, depending on the chosen service
                provider. To use this feature, please add your access keys or
                credentials as environment variables in your project. More
                information can be found in{' '}
                <a
                  target="_blank"
                  rel="noopener noreferrer"
                  href="https://docs.kedro.org/projects/kedro-viz/en/latest/share_kedro_viz.html"
                >
                  docs
                </a>
                .<br />
                <br />
                <br />
                Enter the required information and a hosted link will be
                generated.
              </p>
            </div>
            <div className="shareable-url-modal__form-wrapper">
              <div className="shareable-url-modal__input-wrapper">
                <div className="shareable-url-modal__input-label">
                  Hosting platform
                </div>
                <Dropdown
                  defaultText={
                    inputValues?.platform &&
                    hostingPlatform[inputValues?.platform]
                  }
                  placeholderText={
                    !inputValues?.platform ? 'Select a hosting platform' : null
                  }
                  onChanged={(selectedPlatform) => {
                    onChange('platform', selectedPlatform.value);
                  }}
                  width={null}
                >
                  {Object.entries(hostingPlatform).map(([value, label]) => (
                    <MenuOption
                      className={classnames({
                        'pipeline-list__option--active':
                          inputValues.platform === value,
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
                  defaultValue={inputValues.bucket_name}
                  onChange={(value) => onChange('bucket_name', value)}
                  placeholder="Enter name"
                  resetValueTrigger={visible}
                  size="small"
                />
              </div>
              <div className="shareable-url-modal__input-wrapper">
                <div className="shareable-url-modal__input-label">
                  Endpoint Link
                </div>
                <Input
                  defaultValue={inputValues.endpoint}
                  onChange={(value) => onChange('endpoint', value)}
                  placeholder="Enter url"
                  resetValueTrigger={visible}
                  size="small"
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
      ) : null}
      {isLoading ? (
        <div className="shareable-url-modal__loading">
          <LoadingIcon visible={isLoading} />
        </div>
      ) : null}
      {responseError ? (
        <div className="shareable-url-modal__error">
          <p>Error message: {responseError}</p>
          <Button
            mode="primary"
            onClick={() => {
              setDeploymentState('default');
              setIsLoading(false);
              setResponseUrl(null);
              setResponseError(null);
            }}
            size="small"
          >
            Go back
          </Button>
        </div>
      ) : null}
      {responseUrl ? (
        <>
          <div className="shareable-url-modal__result">
            <div className="shareable-url-modal__label">Hosted link</div>
            <div className="shareable-url-modal__url-wrapper">
              <a
                className="shareable-url-modal__result-url"
                href={responseUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                {responseUrl}
              </a>
              {window.navigator.clipboard && (
                <div className="shareable-url-modal__result-action">
                  <IconButton
                    ariaLabel="Copy run command to clipboard."
                    className="copy-button"
                    dataHeapEvent={`clicked.run_command`}
                    icon={CopyIcon}
                    onClick={onCopyClick}
                  />
                  <Tooltip
                    text="Copied!"
                    visible={showCopied}
                    noDelay
                    centerArrow
                    arrowSize="small"
                  />
                </div>
              )}
            </div>
          </div>
          <div className="shareable-url-modal__button-wrapper ">
            <Button
              mode="secondary"
              onClick={() => {
                setDeploymentState('default');
                setIsLoading(false);
                setResponseUrl(null);
                setIsLinkSettingsClick(true);
              }}
              size="small"
            >
              Link Settings
            </Button>
            <Button
              mode="secondary"
              onClick={() => handleModalClose()}
              size="small"
            >
              Close
            </Button>
          </div>
        </>
      ) : null}
      {!canUseShareableUrls ? (
        <div className="shareable-url-modal__button-wrapper shareable-url-modal__button-wrapper--right">
          <Button
            mode="secondary"
            onClick={() => handleModalClose()}
            size="small"
          >
            Cancel
          </Button>
          <a
            href="https://docs.kedro.org/en/latest/visualisation/share_kedro_viz.html"
            rel="noreferrer"
            target="_blank"
          >
            <Button size="small">View documentation</Button>
          </a>
        </div>
      ) : null}
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
