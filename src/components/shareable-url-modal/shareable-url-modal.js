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
  PACKAGE_FSSPEC,
} from '../../config';
import Modal from '../ui/modal';

import PublishedView from './published-view/published-view';
import CompatibilityView from './compatibility-view/compatibility-view';
import MainView from './main-view/main-view';
import LoadingView from './loading-view/loading-view';
import ErrorView from './error-view/error-view';
import SuccessView from './success-view/success-view';
import { getDeploymentStateByType } from './utils';

import './shareable-url-modal.scss';

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
  const [isCompatible, setIsCompatible] = useState(true);
  const [showPublishedView, setShowPublishedView] = useState(false);
  const [hostingPlatformLocalStorageVal, setHostingPlatformLocalStorageVal] =
    useState(loadLocalStorage(localStorageSharableUrl) || {});
  const [publishedPlatformKey, setPublishedPlatformKey] = useState(undefined);
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
          setIsCompatible(fsspecPackage?.is_compatible || false);

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
      // set the publishedPlatformKey as the first one from localStorage by default
      setPublishedPlatformKey(Object.keys(hostingPlatformLocalStorageVal)[0]);
    }
  };

  const displayMainViewWithPublishedContent = () => {
    if (Object.keys(hostingPlatformLocalStorageVal).length > 0) {
      setShowPublishedView(false);
      setDeploymentState('default');

      const populatedContent =
        hostingPlatformLocalStorageVal[publishedPlatformKey];

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
    displayPublishedView();
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
        displayPublishedView();

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
    displayPublishedView();
  };

  const handleResponseUrl = () => {
    // If the URL does not start with http:// or https://, append http:// to avoid relative path issue for GCP platform.
    if (!/^https?:\/\//.test(responseUrl) && inputValues.platform === 'gcp') {
      const url = 'http://' + responseUrl;
      return url;
    }
    return responseUrl;
  };

  const { platform } = inputValues || {};

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
      message={getDeploymentStateByType(
        'message',
        deploymentState,
        compatibilityData,
        modalMessages
      )}
      title={getDeploymentStateByType(
        'title',
        deploymentState,
        compatibilityData,
        modalMessages
      )}
      visible={visible.shareableUrlModal}
    >
      {!isCompatible ? (
        <CompatibilityView onClick={handleModalClose} />
      ) : showPublishedView ? (
        <PublishedView
          handleResponseUrl={handleResponseUrl()}
          hostingPlatformLocalStorageVal={hostingPlatformLocalStorageVal}
          hostingPlatforms={hostingPlatforms}
          onChange={(selectedPlatform) => {
            onChange('platform', selectedPlatform.value);
            setPublishedPlatformKey(selectedPlatform.value);
          }}
          onCopyClick={onCopyClick}
          onRepublishClick={displayMainViewWithPublishedContent}
          platform={platform}
          showCopied={showCopied}
        />
      ) : (
        <>
          {!isLoading && !responseUrl && !responseError && (
            <MainView
              handleModalClose={handleModalClose}
              handleSubmit={handleSubmit}
              inputValues={inputValues}
              isFormDirty={isFormDirty}
              onChange={onChange}
              setTogleValue={setTogleValue}
              toggleValue={toggleValue}
              visible={visible}
            />
          )}
          {isLoading && <LoadingView isLoading={isLoading} />}
          {responseError && (
            <ErrorView
              onClick={() => {
                setDeploymentState('default');
                setIsLoading(false);
                setResponseUrl(null);
                setResponseError(null);
              }}
              responseError={responseError}
            />
          )}
          {responseUrl && (
            <SuccessView
              handleResponseUrl={handleResponseUrl()}
              onClick={onCopyClick}
              responseUrl={responseUrl}
              showCopied={showCopied}
            />
          )}
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
