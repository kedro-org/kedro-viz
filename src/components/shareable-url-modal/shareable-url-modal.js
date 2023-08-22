import React, { useState } from 'react';
import { connect } from 'react-redux';
import { toggleShareableUrlModal } from '../../actions';

import Button from '../ui/button';
import Input from '../ui/input';
import Modal from '../ui/modal';

import './shareable-url-modal.css';

const ShareableUrlModal = ({ onToggle, visible }) => {
  const [inputValues, setInputValues] = useState({});
  const [hasNotInteracted, setHasNotInteracted] = useState(true);

  const onChange = (key, value) => {
    setHasNotInteracted(false);
    setInputValues(
      Object.assign({}, inputValues, {
        [key]: value,
      })
    );
  };

  const handleSubmit = async () => {
    try {
      const request = await fetch('/api/deploy', {
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
        body: JSON.stringify(inputValues),
      });
      const response = request.json();

      if (response.ok) {
        console.log(response.data);
      } else {
        console.log('Something went wrong.');
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Modal
      className="shareable-url-modal"
      closeModal={() => onToggle(false)}
      message="Please enter your AWS information and a hosted link will be generated."
      title="Deploy and Share"
      visible={visible.shareableUrlModal}
    >
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
        <Button mode="secondary" onClick={() => onToggle(false)} size="small">
          Cancel
        </Button>
        <Button disabled={hasNotInteracted} size="small" onClick={handleSubmit}>
          Deploy
        </Button>
      </div>
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
