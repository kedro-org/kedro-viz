/* eslint-disable camelcase */
import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import classnames from 'classnames';
import { toggleShareableUrlModal, setBanner } from '../../actions';
import { fetchMetadata } from '../../utils';
import { saveLocalStorage, loadLocalStorage } from '../../store/helpers';
import {
  BANNER_KEYS,
  hostingPlatforms,
  inputKeyToStateKeyMap,
  localStorageShareableUrl,
  PACKAGE_FSSPEC,
  shareableUrlMessages,
} from '../../config';
import Modal from '../ui/modal';

import PublishedView from './published-view/published-view';
import CompatibilityErrorView from './compatibility-error-view/compatibility-error-view';
import MainView from './main-view/main-view';
import LoadingView from './loading-view/loading-view';
import ErrorView from './error-view/error-view';
import SuccessView from './success-view/success-view';
import { getDeploymentStateByType, handleResponseUrl } from './utils';
import { deployViz } from '../../utils';

import './shareable-url-modal.scss';

const ShareableUrlModal = ({ onToggleModal, onSetBanner, visible }) => {
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
    useState(loadLocalStorage(localStorageShareableUrl) || {});
  const [publishedPlatformKey, setPublishedPlatformKey] = useState(undefined);
  const [isPreviewEnabled, setIsPreviewEnabled] = useState(false);

  useEffect(() => {
    async function checkPackageCompatibility() {
      try {
        const request = await fetchMetadata();
        const response = await request.json();

        if (request.ok) {
          onSetBanner(
            BANNER_KEYS.LITE,
            Boolean(response.has_missing_dependencies)
          );
          const packageCompatibilityInfo = response.package_compatibilities;
          const fsspecPackage = packageCompatibilityInfo.find(
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
        console.error('metadata fetch error: ', error);
      }
    }

    checkPackageCompatibility();
  }, [onSetBanner]);

  const setStateForPublishedView = () => {
    if (Object.keys(hostingPlatformLocalStorageVal).length > 0) {
      setDeploymentState('published');
      setShowPublishedView(true);
      // set the publishedPlatformKey as the first one from localStorage by default
      setPublishedPlatformKey(Object.keys(hostingPlatformLocalStorageVal)[0]);
    }
  };

  const setStateForMainViewWithPublishedContent = () => {
    if (Object.keys(hostingPlatformLocalStorageVal).length > 0) {
      setShowPublishedView(false);
      setDeploymentState('default');

      const populatedContent =
        hostingPlatformLocalStorageVal[publishedPlatformKey];

      setInputValues(populatedContent);

      setIsFormDirty({
        hasBucketName: true,
        hasPlatform: true,
        hasEndpoint: true,
      });
    }
  };

  useEffect(() => {
    setStateForPublishedView();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const updateFormWithLocalStorageData = (platformKey) => {
    // if the selected platform is stored in localStorage, populate the form with the stored data
    if (hostingPlatformLocalStorageVal[platformKey]) {
      const populatedContent = hostingPlatformLocalStorageVal[platformKey];

      setInputValues(populatedContent);
      setIsFormDirty({
        hasBucketName: true,
        hasPlatform: true,
        hasEndpoint: true,
      });
    } else {
      // if not, only set the platform and reset the rest
      const emptyContent = {
        platform: platformKey,
        bucket_name: '',
        endpoint: '',
      };
      setInputValues(emptyContent);
      setIsFormDirty({
        hasBucketName: false,
        hasPlatform: true,
        hasEndpoint: false,
      });
    }
  };

  const updateLocalStorageState = () => {
    const selectedHostingPlatformVal = {};
    if (hostingPlatforms.hasOwnProperty(inputValues.platform)) {
      selectedHostingPlatformVal[inputValues.platform] = { ...inputValues };
    }
    saveLocalStorage(localStorageShareableUrl, selectedHostingPlatformVal);

    //  filtering out the pairs where the key is in selectedHostingPlatformVal
    const localStorageExcludingSelectedPlatform = Object.fromEntries(
      Object.entries(hostingPlatformLocalStorageVal).filter(
        ([key]) => !(key in selectedHostingPlatformVal)
      )
    );

    // set the new state with selectedHostingPlatformVal as the first value and localStorageExcludingSelectedPlatform
    const newState = {
      ...selectedHostingPlatformVal,
      ...localStorageExcludingSelectedPlatform,
    };
    setHostingPlatformLocalStorageVal(newState);
  };

  const handleSubmit = async () => {
    setDeploymentState('loading');
    setIsLoading(true);
    setShowPublishedView(false);

    try {
      const request = await deployViz({
        ...inputValues,
        is_all_previews_enabled: isPreviewEnabled,
      });
      const response = await request.json();

      if (request.ok) {
        setResponseUrl(response.url);
        setDeploymentState('success');
        updateLocalStorageState();
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
      // reset the state to default as long as the user's fsspec package version is compatible
      //  and there are nothing stored in localStorage
      if (Object.keys(hostingPlatformLocalStorageVal).length === 0) {
        setDeploymentState('default');
      }

      // if there are items stored in localStorage, display the published view
      setStateForPublishedView();
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
    setIsPreviewEnabled(false);
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
        shareableUrlMessages
      )}
      title={getDeploymentStateByType(
        'title',
        deploymentState,
        compatibilityData,
        shareableUrlMessages
      )}
      visible={visible.shareableUrlModal}
    >
      {!isCompatible ? (
        <CompatibilityErrorView onClick={handleModalClose} />
      ) : showPublishedView ? (
        <PublishedView
          hostingPlatformLocalStorageVal={hostingPlatformLocalStorageVal}
          hostingPlatforms={hostingPlatforms}
          onChange={(selectedPlatform) => {
            onChange('platform', selectedPlatform.value);
            setPublishedPlatformKey(selectedPlatform.value);
          }}
          onCopyClick={onCopyClick}
          onRepublishClick={setStateForMainViewWithPublishedContent}
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
              onPlatformChange={(selectedPlatform) => {
                updateFormWithLocalStorageData(selectedPlatform.value);
              }}
              onBuckNameChange={(value) => onChange('bucket_name', value)}
              onEndpointChange={(value) => onChange('endpoint', value)}
              setIsPreviewEnabled={setIsPreviewEnabled}
              isPreviewEnabled={isPreviewEnabled}
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
              handleResponseUrl={handleResponseUrl(responseUrl, platform)}
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
  onSetBanner: (name, value) => {
    dispatch(setBanner(name, value));
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(ShareableUrlModal);
