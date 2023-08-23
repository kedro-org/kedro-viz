import React, { useState } from 'react';
import { connect } from 'react-redux';
import { toggleShareableUrlModal } from '../../actions';

import Button from '../ui/button';
import Input from '../ui/input';
import LoadingIcon from '../icons/loading';
import Modal from '../ui/modal';

import './shareable-url-modal.css';

const modalMessages = {
  default:
    'Please enter your AWS information and a hosted link will be generated.',
  failure: 'Something went wrong. Please try again later.',
  loading: 'Shooting your files through space. Sit tight...',
  success:
    'The pipeline has successfully been deployed and the visualisation is hosted via the link below.',
};

const ShareableUrlModal = ({ onToggle, visible }) => {
  const [deploymentState, setDeploymentState] = useState('default');
  const [inputValues, setInputValues] = useState({});
  const [hasNotInteracted, setHasNotInteracted] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [responseUrl, setResponseUrl] = useState(null);

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

  const copyToClipboard = (str) => {
    if (navigator && navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(str).then(
        () => {},
        (reason) => {
          console.error("Couldn't copy the link to the clipboard: " + reason);
        }
      );
    }
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
      title="Deploy and Share"
      visible={visible.shareableUrlModal}
    >
      {!isLoading && !responseUrl ? (
        <>
          <div className="shareable-url-modal__input-wrapper">
            <div className="shareable-url-modal__input-label">
              AWS Bucket Region
            </div>
            <Input
              onChange={(value) => onChange('awsRegion', value)}
              placeholder="Enter details"
              resetValueTrigger={visible}
              size="large"
            />
          </div>
          <div className="shareable-url-modal__input-wrapper">
            <div className="shareable-url-modal__input-label">Bucket Name</div>
            <Input
              onChange={(value) => onChange('bucketName', value)}
              placeholder="Enter details"
              resetValueTrigger={visible}
              size="large"
            />
          </div>
          <div className="shareable-url-modal__button-wrapper">
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
            <div>Hosted link</div>
            <a href={responseUrl} target="_blank" rel="noopener noreferrer">
              {responseUrl}
            </a>
          </div>
          <Button onClick={() => copyToClipboard(responseUrl)} size="small">
            Copy link
          </Button>
          <div className="shareable-url-modal__button-wrapper shareable-url-modal__button-wrapper--single">
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
