import React, { useEffect } from 'react';
import classnames from 'classnames';
import './modal.scss';

/**
 * Generic Kedro Modal
 */
const Modal = ({
  children,
  className,
  closeModal,
  message,
  title,
  visible,
}) => {
  const handleKeyDown = (event) => {
    if (event.keyCode === 27) {
      closeModal(true);
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  return (
    <div
      className={classnames('modal', {
        'modal--visible': visible,
        [className]: !!className,
      })}
      role="dialog"
    >
      <div
        onClick={closeModal}
        className={classnames('modal__bg', {
          'modal__bg--visible': visible,
        })}
      />
      <div
        className={classnames('modal__content', {
          'modal__content--visible': visible,
        })}
      >
        <div className="modal__wrapper">
          {title && <div className="modal__title">{title}</div>}
          {message && <div className="modal__description">{message}</div>}
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
