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
      className={classnames('modal', {
        'modal--visible': visible,
      })}
      role="dialog">
      <div
        onClick={onClose}
        className={classnames('modal__bg', {
          'modal__bg--visible': visible,
        })}
      />
      <div
        className={classnames('modal__content', {
          'modal__content--visible': visible,
        })}>
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
