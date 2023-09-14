import React, { useState } from 'react';
import { connect } from 'react-redux';
import { toggleShareableUrlModal } from '../../actions';
import modifiers from '../../utils/modifiers';

import Button from '../ui/button';
import CopyIcon from '../icons/copy';
import IconButton from '../ui/icon-button';
import Input from '../ui/input';
import LoadingIcon from '../icons/loading';
import Modal from '../ui/modal';

import './shareable-url-modal.scss';

const modalMessages = {
  default:
    'Please enter your AWS information and a hosted link will be generated.',
  failure: 'Something went wrong. Please try again later.',
  loading: 'Shooting your files through space. Sit tight...',
  success:
    'The current version of Kedro-Viz has been deployed and hosted via the link below.',
};

const ShareableUrlModal = ({ onToggle, visible }) => {
  const [deploymentState, setDeploymentState] = useState('default');
  const [inputValues, setInputValues] = useState({});
  const [hasNotInteracted, setHasNotInteracted] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [responseUrl, setResponseUrl] = useState(null);
  const [showCopied, setShowCopied] = useState(false);

  const onChange = (key, value) => {
    setHasNotInteracted(false);
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
        setResponseUrl('Something went wrong.');
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
    onToggle(false);
    setDeploymentState('default');
    setIsLoading(false);
    setResponseUrl(null);
  };

  return (
    <Modal
      className="shareable-url-modal"
      closeModal={() => handleModalClose()}
      message={modalMessages[deploymentState]}
      title={
        deploymentState === 'success'
          ? 'Kedro-Viz Hosted Link'
          : 'Deploy and Share'
      }
      visible={visible.shareableUrlModal}
    >
      {!isLoading && !responseUrl ? (
        <>
          <div className="shareable-url-modal__input-wrapper">
            <div className="shareable-url-modal__input-label">
              AWS Bucket Region
            </div>
            <Input
              onChange={(value) => onChange('region', value)}
              placeholder="Enter details"
              resetValueTrigger={visible}
              size="large"
            />
          </div>
          <div className="shareable-url-modal__input-wrapper">
            <div className="shareable-url-modal__input-label">Bucket Name</div>
            <Input
              onChange={(value) => onChange('bucket_name', value)}
              placeholder="Enter details"
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
              disabled={hasNotInteracted}
              size="small"
              onClick={handleSubmit}
            >
              Deploy
            </Button>
          </div>
        </>
      ) : null}
      {isLoading ? (
        <div className="shareable-url-modal__loading">
          <LoadingIcon visible={isLoading} />
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
    </Modal>
  );
};

export const mapStateToProps = (state) => ({
  visible: state.visible,
});

export const mapDispatchToProps = (dispatch) => ({
  onToggle: (value) => {
    dispatch(toggleShareableUrlModal(value));
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(ShareableUrlModal);
