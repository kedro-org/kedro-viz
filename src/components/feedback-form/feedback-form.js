import React from 'react';
import Modal from '../ui/modal';
import { Stars } from './stars';

export const FeedbackForm = ({ title, onClose }) => {
  return (
    <div className="feedback-form-wrapper">
      <Modal closeModal={onClose} title={title} visible={true}>
        <Stars />
      </Modal>
    </div>
  );
};
