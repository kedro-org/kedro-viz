import React from 'react';
import classnames from 'classnames';
import CloseIcon from '../icons/close';
import IconButton from '../../components/icon-button';
import './modal.css';

/**
 * Shows a toggle button for code panel
 */
const Modal = ({ title, onClose, visible, message, children }) => {
  return (
    <div
      className={classnames('pipeline-modal', {
        'pipeline-modal--visible': visible,
      })}
      role="dialog"
    >
      <div
        onClick={onClose}
        className={classnames('pipeline-modal__bg', {
          'pipeline-modal__bg--visible': visible,
        })}
      />
      <div
        className={classnames('pipeline-modal__content', {
          'pipeline-modal__content--visible': visible,
        })}
      >
        <IconButton
          container={React.Fragment}
          ariaLabel="Close Modal"
          className="pipeline-modal__close-button"
          icon={CloseIcon}
          onClick={onClose}
        />
        <div className="pipeline-modal__wrapper">
          <div className="pipeline-modal__title">{title}</div>
          {children}
          {!children && (
            <div className="pipeline-modal__description">{message}</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Modal;
