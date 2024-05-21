/* eslint-disable camelcase */
import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import classnames from 'classnames';
import { toggleShareableUrlModal } from '../../actions';
import { fetchPackageCompatibilities } from '../../utils';
import { saveLocalStorage, loadLocalStorage } from '../../store/helpers';
import {
  hostingPlatforms,
  inputKeyToStateKeyMap,
  localStorageSharableUrl,
  KEDRO_VIZ_PUBLISH_DOCS_URL,
  KEDRO_VIZ_PUBLISH_AWS_DOCS_URL,
  KEDRO_VIZ_PUBLISH_AZURE_DOCS_URL,
  KEDRO_VIZ_PUBLISH_GCP_DOCS_URL,
  PACKAGE_FSSPEC,
} from '../../config';

import Button from '../ui/button';
import InfoIcon from '../icons/info';
import Dropdown from '../ui/dropdown';
import IconButton from '../ui/icon-button';
import Input from '../ui/input';
import LoadingIcon from '../icons/loading';
import Modal from '../ui/modal';
import MenuOption from '../ui/menu-option';
import Toggle from '../ui/toggle';

import './shareable-url-modal.scss';
import UrlBox from './url-box/url-box';

const modalMessages = (status, info = '') => {
  const messages = {
    failure: 'Something went wrong. Please try again later.',
    loading: 'Shooting your files through space. Sit tight...',
    success:
      'The deployment has been successful and Kedro-Viz is hosted via the link below..',
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
  const [showPublishedView, setShowPublishedView] = useState(false);
  const [hostingPlatformLocalStorageVal, setHostingPlatformLocalStorageVal] =
    useState(loadLocalStorage(localStorageSharableUrl) || {});
  const [populatedContentKey, setPopulatedContentKey] = useState(undefined);
  const [toggleValue, setTogleValue] = useState(false);

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

  const displayPublishedView = () => {
    if (Object.keys(hostingPlatformLocalStorageVal).length > 0) {
      setDeploymentState('published');
      setShowPublishedView(true);
      // set the populatedContentKey as the first one from localStorage by default
      setPopulatedContentKey(Object.keys(hostingPlatformLocalStorageVal)[0]);
    }
  };

  const setToDisplayMainViewWithPopulatedContent = () => {
    if (Object.keys(hostingPlatformLocalStorageVal).length > 0) {
      setShowPublishedView(false);
      setDeploymentState('default');

      const populatedContent =
        hostingPlatformLocalStorageVal[populatedContentKey];

      setInputValues(populatedContent);

      const updatedFormDirtyState = Object.fromEntries(
        Object.entries(populatedContent).map(([key, value]) => [
          inputKeyToStateKeyMap[key],
          !!value,
        ])
      );

      setIsFormDirty((prevState) => ({
        ...prevState,
        ...updatedFormDirtyState,
      }));
    }
  };

  useEffect(() => {
    setToDisplayPublishedView();
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

    // this logic is here to test locally without publishing anything

    const hostingPlatformVal = {};
    if (hostingPlatforms.hasOwnProperty(inputValues.platform)) {
      hostingPlatformVal[inputValues.platform] = { ...inputValues };
    }
    saveLocalStorage(localStorageSharableUrl, hostingPlatformVal);
    const newState = {
      ...hostingPlatformLocalStorageVal,
      ...hostingPlatformVal,
    };
    setHostingPlatformLocalStorageVal(newState);

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
        setToDisplayPublishedView();

        // const hostingPlatformVal = {};
        // if (hostingPlatforms.hasOwnProperty(inputValues.platform)) {
        //   hostingPlatformVal[inputValues.platform] = { ...inputValues };
        // }
        // saveLocalStorage(localStorageSharableUrl, hostingPlatformVal);
        // const newState = {
        //   ...hostingPlatformLocalStorageVal,
        //   ...hostingPlatformVal,
        // };
        // setHostingPlatformLocalStorageVal(newState);
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

  const onCopyClick = (url) => {
    window.navigator.clipboard.writeText(url);
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
    setIsFormDirty({
      hasBucketName: false,
      hasPlatform: false,
      hasEndpoint: false,
    });
    setToDisplayPublishedView();
  };

  const getDeploymentStateByType = (type) => {
    // This is because the default and published view has its own style
    if (deploymentState === 'default' || deploymentState === 'published') {
      return null;
    }

    if (type === 'title') {
      return deploymentState === 'success'
        ? 'Kedro-Viz successfully hosted and published'
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

  const renderPublishedView = () => {
    const platformsKeys = Object.keys(hostingPlatformLocalStorageVal);
    const platformsVal = Object.values(hostingPlatformLocalStorageVal);

    const url = platform
      ? hostingPlatformLocalStorageVal[platform]['endpoint']
      : platformsVal[0]['endpoint'];

    const filteredPlatforms = {};
    platformsKeys.forEach((key) => {
      if (hostingPlatforms.hasOwnProperty(key)) {
        filteredPlatforms[key] = hostingPlatforms[key];
      }
    });

    return (
      <>
        <div className="shareable-url-modal__published">
          <div className="shareable-url-modal__content-title">
            Publish and Share Kedro-Viz
          </div>
          {platformsKeys.length === 1 ? (
            <UrlBox
              url={url}
              onClick={() => onCopyClick(url)}
              href={handleResponseUrl()}
              showCopiedText={showCopied}
            />
          ) : (
            <div className="shareable-url-modal__published-dropdown-wrapper">
              <Dropdown
                defaultText={
                  (platform && filteredPlatforms[platform]) ||
                  Object.values(filteredPlatforms)[0]
                }
                onChanged={(selectedPlatform) => {
                  onChange('platform', selectedPlatform.value);
                  setPopulatedContentKey(selectedPlatform.value);
                }}
                width={null}
              >
                {Object.entries(filteredPlatforms).map(([value, label]) => (
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
              <UrlBox
                className="url-box__wrapper--half-width"
                url={url}
                onClick={() => onCopyClick(url)}
                href={handleResponseUrl()}
                showCopiedText={showCopied}
              />
            </div>
          )}
        </div>
        <div className="shareable-url-modal__published-action">
          <p className="shareable-url-modal__published-action-text">
            Republish Kedro-Viz to push new updates to the published link above,
            or publish a new link to share.
          </p>
          <Button
            mode="secondary"
            onClick={setToDisplayMainViewWithPopulatedContent}
            size="small"
          >
            Republish
          </Button>
        </div>
      </>
    );
  };

  const renderSuccessView = () => {
    return responseUrl ? (
      <div className="shareable-url-modal__result">
        <UrlBox
          url={responseUrl}
          onClick={onCopyClick}
          href={handleResponseUrl()}
          showCopiedText={showCopied}
        />
      </div>
    ) : null;
  };

  const renderErrorView = () => {
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

  const renderTextContent = () => {
    return (
      <div className="shareable-url-modal__content-wrapper">
        <div className="shareable-url-modal__content-title">
          Publish and Share Kedro-Viz
        </div>
        <h2 className="shareable-url-modal__content-description-title">
          Prerequisite:{' '}
        </h2>
        <p className="shareable-url-modal__content-description">
          Deploying and hosting Kedro-Viz requires access keys or user
          credentials, depending on the chosen service provider. To use this
          feature, please add your access keys or credentials as environment
          variables in your project. More information can be found in the{' '}
          <a
            target="_blank"
            rel="noopener noreferrer"
            href={KEDRO_VIZ_PUBLISH_DOCS_URL}
          >
            documentation
          </a>
          .
        </p>
        <h2 className="shareable-url-modal__content-description-title">
          Disclaimer:{' '}
        </h2>
        <p className="shareable-url-modal__content-description">
          Disclaimer Kedro-Viz contains preview data for multiple datasets. You
          can enable or disable all previews when publishing Kedro-Viz.
        </p>
        <div className="shareable-url-modal__content-preview-dataset">
          All dataset previews
          <Toggle
            className="shareable-url-modal__content-toggle"
            title={toggleValue ? 'On' : 'Off'}
            checked={toggleValue}
            onChange={() => setTogleValue((prev) => !prev)}
          />
        </div>
      </div>
    );
  };

  const renderLoadingView = () => {
    return isLoading ? (
      <div className="shareable-url-modal__loading">
        <LoadingIcon visible={isLoading} />
      </div>
    ) : null;
  };

  const renderMainView = () => {
    return !isLoading && !responseUrl && !responseError ? (
      <>
        <div className="shareable-url-modal__content-form-wrapper">
          {renderTextContent()}
          <div className="shareable-url-modal__form-wrapper">
            <p className="shareable-url-modal__form-wrapper-title">
              Enter the required information.
            </p>
            <div className="shareable-url-modal__input-wrapper">
              <div className="shareable-url-modal__input-label">
                Hosting platform
              </div>
              <Dropdown
                defaultText={platform && hostingPlatforms[platform]}
                placeholderText={!platform ? 'Select a hosting platform' : null}
                onChanged={(selectedPlatform) => {
                  onChange('platform', selectedPlatform.value);
                }}
                width={null}
              >
                {Object.entries(hostingPlatforms).map(([value, label]) => (
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
                Bucket name
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
              <div className="shareable-url-modal__endpoint-url-wrapper">
                <div className="shareable-url-modal__input-label">
                  Endpoint URL
                </div>
                <IconButton
                  ariaLabel="The endpoint URL information"
                  className="shareable-url-modal__information-icon"
                  labelText={
                    <p>
                      The endpoint URL is the link to where your Kedro-Viz will
                      be hosted. For information on obtaining the endpoint URL,
                      please refer to the documentation for{' '}
                      <a
                        className="shareable-url-modal__input-label-text"
                        href={KEDRO_VIZ_PUBLISH_AWS_DOCS_URL}
                        rel="noreferrer"
                        target="_blank"
                      >
                        AWS
                      </a>
                      ,{' '}
                      <a
                        className="shareable-url-modal__input-label-text"
                        href={KEDRO_VIZ_PUBLISH_AZURE_DOCS_URL}
                        rel="noreferrer"
                        target="_blank"
                      >
                        Azure
                      </a>
                      ,{' '}
                      <a
                        className="shareable-url-modal__input-label-text"
                        href={KEDRO_VIZ_PUBLISH_GCP_DOCS_URL}
                        rel="noreferrer"
                        target="_blank"
                      >
                        GCP
                      </a>
                    </p>
                  }
                  icon={InfoIcon}
                />
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
        <div className="shareable-url-modal__button-wrapper">
          <Button mode="secondary" onClick={handleModalClose} size="small">
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
        'shareable-url-modal__published-wrapper':
          deploymentState === 'published',
        'shareable-url-modal__success-wrapper': deploymentState === 'success',
      })}
      closeModal={handleModalClose}
      message={getDeploymentStateByType('message')}
      title={getDeploymentStateByType('title')}
      visible={visible.shareableUrlModal}
    >
      {renderCompatibilityMessage()}
      {canUseShareableUrls ? (
        showPublishedView ? (
          renderPublishedView()
        ) : (
          <>
            {renderMainView()}
            {renderLoadingView()}
            {renderErrorView()}
            {renderSuccessView()}
          </>
        )
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
