/* eslint-disable camelcase */
import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import classnames from 'classnames';
import { toggleShareableUrlModal } from '../../actions';
import { fetchPackageCompatibilities } from '../../utils';
import {
  hostingPlatform,
  inputKeyToStateKeyMap,
  KEDRO_VIZ_PUBLISH_DOCS_URL,
  KEDRO_VIZ_PREVIEW_DATASETS_DOCS_URL,
  KEDRO_VIZ_PUBLISH_AWS_DOCS_URL,
  KEDRO_VIZ_PUBLISH_AZURE_DOCS_URL,
  KEDRO_VIZ_PUBLISH_GCP_DOCS_URL,
  PACKAGE_FSSPEC,
} from '../../config';

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
    hasBucketName: false,
    hasPlatform: false,
    hasEndpoint: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [responseUrl, setResponseUrl] = useState(null);
  const [responseError, setResponseError] = useState(null);
  const [showCopied, setShowCopied] = useState(false);
  const [compatibilityData, setCompatibilityData] = useState({});
  const [canUseShareableUrls, setCanUseShareableUrls] = useState(true);
  const [isDisclaimerViewed, setIsDisclaimerViewed] = useState(false);

  useEffect(() => {
    async function fetchPackageCompatibility() {
      try {
        const request = await fetchPackageCompatibilities();
        const response = await request.json();

        if (request.ok) {
          const fsspecPackage = response.find(
            (pckg) => pckg.package_name === PACKAGE_FSSPEC
          );
          setCompatibilityData(fsspecPackage);
          setCanUseShareableUrls(fsspecPackage?.is_compatible || false);

          // User's fsspec package version isn't compatible, so set
          // the necessary state to reflect that in the UI.
          if (!fsspecPackage.is_compatible) {
            setDeploymentState(!fsspecPackage.is_compatible && 'incompatible');
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

  const clearDisclaimerMessage = () => setIsDisclaimerViewed(true);

  const renderCompatibilityMessage = () => {
    return !canUseShareableUrls ? (
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
    ) : null;
  };

  const renderSuccessContent = () => {
    return responseUrl ? (
      <>
        <div className="shareable-url-modal__result">
          <div className="shareable-url-modal__label">Hosted link</div>
          <div className="shareable-url-modal__url-wrapper">
            <a
              className="shareable-url-modal__result-url"
              href={handleResponseUrl()}
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
    ) : null;
  };

  const renderErrorContent = () => {
    return responseError ? (
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
    ) : null;
  };

  const renderDisclaimerContent = () => {
    return (
      <div>
        <div className="shareable-url-modal__content-wrapper shareable-url-modal__content-description">
          Disclaimer: Please note that Kedro-Viz contains preview data for
          multiple datasets. If you wish to disable the preview when publishing
          Kedro-Viz, please refer to{' '}
          <a
            target="_blank"
            rel="noopener noreferrer"
            href={KEDRO_VIZ_PREVIEW_DATASETS_DOCS_URL}
          >
            the documentation
          </a>{' '}
          on how to do so.
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
            dataTest="disclaimerButton"
            size="small"
            onClick={clearDisclaimerMessage}
          >
            Continue
          </Button>
        </div>
      </div>
    );
  };

  const renderTextContent = () => {
    return (
      <div className="shareable-url-modal__content-wrapper">
        <div className="shareable-url-modal__content-title">
          Publish and Share Kedro-Viz
        </div>
        <p className="shareable-url-modal__content-description shareable-url-modal__paregraph-divider">
          Prerequisite: Deploying and hosting Kedro-Viz requires access keys or
          user credentials, depending on the chosen cloud provider. To use this
          feature, please add your access keys or credentials as environment
          variables in your Kedro project. More information can be found in{' '}
          <a
            target="_blank"
            rel="noopener noreferrer"
            href={KEDRO_VIZ_PUBLISH_DOCS_URL}
          >
            docs
          </a>
          .
        </p>
        <p className="shareable-url-modal__content-description">
          Enter the required information and a hosted link will be generated.
        </p>
        <p className="shareable-url-modal__content-description shareable-url-modal__content-note">
          For more information on obtaining the Endpoint URL, refer to{' '}
          <a
            target="_blank"
            rel="noopener noreferrer"
            href={KEDRO_VIZ_PUBLISH_AWS_DOCS_URL}
          >
            AWS
          </a>
          ,{' '}
          <a
            target="_blank"
            rel="noopener noreferrer"
            href={KEDRO_VIZ_PUBLISH_AZURE_DOCS_URL}
          >
            Azure
          </a>{' '}
          and{' '}
          <a
            target="_blank"
            rel="noopener noreferrer"
            href={KEDRO_VIZ_PUBLISH_GCP_DOCS_URL}
          >
            GCP
          </a>{' '}
          docs.
        </p>
      </div>
    );
  };

  const renderLoadingContent = () => {
    return isLoading ? (
      <div className="shareable-url-modal__loading">
        <LoadingIcon visible={isLoading} />
      </div>
    ) : null;
  };

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
            Publish
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
      {renderCompatibilityMessage()}
      {!isDisclaimerViewed && canUseShareableUrls ? (
        renderDisclaimerContent()
      ) : (
        <>
          {renderMainContent()}
          {renderLoadingContent()}
          {renderErrorContent()}
          {renderSuccessContent()}
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
