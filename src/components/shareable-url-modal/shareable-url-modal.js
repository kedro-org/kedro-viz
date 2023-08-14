import React, { useState } from 'react';
import { connect } from 'react-redux';
import Modal from '../ui/modal';
import Button from '../ui/button';
import Input from '../ui/input';
import { toggleShareableUrlModal } from '../../actions';

import './shareable-url-modal.css';

const ShareableUrlModal = ({ onToggle, visible }) => {
  const [valuesToUpdate, setValuesToUpdate] = useState({});
  const [hasNotInteracted, setHasNotInteracted] = useState(true);

  const onChange = (key, value) => {
    setValuesToUpdate(
      Object.assign({}, valuesToUpdate, {
        [key]: value,
      })
    );
    setHasNotInteracted(false);
  };

  return (
    <Modal
      className="shareable-url-modal"
      closeModal={() => onToggle(false)}
      message="Please enter your AWS credentials and a hosted link will be generated."
      title="Deploy and Share"
      visible={visible.shareableUrlModal}
    >
      <div className="shareable-url-modal__input-wrapper">
        <div className="shareable-url-modal__input-label">Access Key ID</div>
        <Input
          onChange={(value) => onChange('accessKey', value)}
          placeholder="Enter details"
          resetValueTrigger={visible}
          size="large"
        />
      </div>
      <div className="shareable-url-modal__input-wrapper">
        <div className="shareable-url-modal__input-label">
          Secret Access Key
        </div>
        <Input
          onChange={(value) => onChange('secretAccessKey', value)}
          placeholder="Enter details"
          resetValueTrigger={visible}
          size="large"
        />
      </div>
      <div className="shareable-url-modal__button-wrapper">
        <Button mode="secondary" onClick={() => onToggle(false)} size="small">
          Cancel
        </Button>
        <Button disabled={hasNotInteracted} size="small">
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
