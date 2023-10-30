import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import classnames from 'classnames';
import { toggleShareableUrlModal } from '../../actions';
import modifiers from '../../utils/modifiers';
import { s3BucketRegions } from '../../config';

import Button from '../ui/button';
import CopyIcon from '../icons/copy';
import Dropdown from '../ui/dropdown';
import IconButton from '../ui/icon-button';
import Input from '../ui/input';
import LoadingIcon from '../icons/loading';
import Modal from '../ui/modal';
import MenuOption from '../ui/menu-option';

import './shareable-url-modal.scss';

const modalMessages = (status, info = '') => {
  const messages = {
    default:
      'Prerequisite: Deploying and sharing Kedro-Viz requires AWS access keys. To use this feature, please add your AWS access keys as environment variables in your project.',
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
    region: false,
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
        setResponseError(response.message);
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
    setTimeout(() => setShowCopied(false), 1500);
  };

  const handleModalClose = () => {
    onToggleModal(false);
    setDeploymentState('default');
    setResponseError(null);
    setIsLoading(false);
    setResponseUrl(null);
    setIsLinkSettingsClick(false);
    setInputValues({});
    setIsFormDirty({
      bucket_name: false,
      region: false,
    }); /* eslint-disable camelcase */
  };

  return (
    <Modal
      className="shareable-url-modal"
      closeModal={handleModalClose}
      message={modalMessages(
        deploymentState,
        compatibilityData.package_version
      )}
      title={
        deploymentState === 'success'
          ? 'Kedro-Viz Published and Hosted'
          : 'Publish and Share Kedro-Viz'
      }
      visible={visible.shareableUrlModal}
    >
      {!isLoading && !responseUrl && canUseShareableUrls && !responseError ? (
        <>
          <div className="modal__description">
            Enter your AWS information below and a hosted link will be
            generated. View the{' '}
            <a
              className="link"
              href="https://docs.kedro.org/en/latest/visualisation/share_kedro_viz.html"
              rel="noreferrer"
              target="_blank"
            >
              docs
            </a>{' '}
            for more information.
          </div>
          <div className="shareable-url-modal__input-wrapper">
            <div className="shareable-url-modal__input-label">
              AWS Bucket Region
            </div>
            <Dropdown
              defaultText={inputValues?.region || 'Select a region'}
              onChanged={(selectedRegion) => {
                onChange('region', selectedRegion.value);
              }}
              width={null}
            >
              {s3BucketRegions.map((region) => {
                return (
                  <MenuOption
                    className={classnames({
                      'pipeline-list__option--active':
                        inputValues.region === region,
                    })}
                    key={region}
                    primaryText={region}
                    value={region}
                  />
                );
              })}
            </Dropdown>
          </div>
          <div className="shareable-url-modal__input-wrapper">
            <div className="shareable-url-modal__input-label">Bucket Name</div>
            <Input
              defaultValue={inputValues.bucket_name}
              onChange={(value) => onChange('bucket_name', value)}
              placeholder="my-bucket-name"
              resetValueTrigger={visible}
              size="large"
            />
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
                className={modifiers('shareable-url-modal__result-url', {
                  visible: !showCopied,
                })}
                href={responseUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                {responseUrl}
              </a>
              {window.navigator.clipboard && (
                <>
                  <span
                    className={modifiers('copy-message', {
                      visible: showCopied,
                    })}
                  >
                    Copied to clipboard.
                  </span>
                  <IconButton
                    ariaLabel="Copy run command to clipboard."
                    className="copy-button"
                    dataHeapEvent={`clicked.run_command`}
                    icon={CopyIcon}
                    onClick={onCopyClick}
                  />
                </>
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
