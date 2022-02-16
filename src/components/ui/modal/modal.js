import React, { useEffect } from 'react';
import classnames from 'classnames';
import CloseIcon from '../../icons/close';
import IconButton from '../../ui/icon-button';
import './modal.css';

/**
 * Generic Kedro Modal
 */
const Modal = ({ title, onClose, visible, message, children }) => {
  const handleKeyDown = (event) => {
    if (event.keyCode === 27) {
      onClose();
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  return (
    <div
      className={classnames('modal', {
        'modal--visible': visible,
      })}
      role="dialog"
    >
      <div
        onClick={onClose}
        className={classnames('modal__bg', {
          'modal__bg--visible': visible,
        })}
      />
      <div
        className={classnames('modal__content', {
          'modal__content--visible': visible,
        })}
      >
        <IconButton
          container={React.Fragment}
          ariaLabel="Close Modal"
          className="modal__close-button"
          icon={CloseIcon}
          onClick={onClose}
        />
        <div className="modal__wrapper">
          <div className="modal__title">{title}</div>
          {children}
          {!children && <div className="modal__description">{message}</div>}
        </div>
      </div>
    </div>
  );
};

export default Modal;
