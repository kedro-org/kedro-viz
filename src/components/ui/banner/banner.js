import React, { useState } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import './banner.scss';
import Button from '../button';
import CloseIcon from '../../icons/close';

/**
 * Generic Kedro Banner
 */
const Banner = ({
  icon = null,
  message,
  btnUrl = null,
  btnText = 'Learn More',
  position = 'top',
  onClose = null,
  dataTest,
}) => {
  const [isVisible, setIsVisible] = useState(true);

  const handleClose = () => {
    setIsVisible(false);
    if (onClose) {
      onClose();
    }
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div
      className={classnames('banner', `banner-${position}`)}
      data-test={dataTest}
    >
      {icon && <div className="banner-icon">{icon}</div>}
      <div className="banner-message">
        <span className="banner-message-title">{message.title}</span>
        <span className="banner-message-body">{message.body}</span>
      </div>
      {btnUrl && (
        <a rel="noreferrer" target="_blank" href={btnUrl}>
          <Button mode="primary" size="small">
            {btnText}
          </Button>
        </a>
      )}
      <div className="banner-close" onClick={handleClose}>
        <CloseIcon />
      </div>
    </div>
  );
};

// PropTypes validation
Banner.propTypes = {
  icon: PropTypes.node,
  message: PropTypes.shape({
    title: PropTypes.string.isRequired,
    body: PropTypes.string.isRequired,
  }).isRequired,
  learnMoreUrl: PropTypes.string,
  theme: PropTypes.oneOf(['light', 'dark']),
  position: PropTypes.oneOf(['top', 'bottom']),
  onClose: PropTypes.func,
};

export default Banner;
