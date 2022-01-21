import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import './icon-button.css';

/**
 * Icon button component
 */
const IconButton = ({
  active,
  ariaLabel,
  ariaLive,
  className,
  container: Container = 'li',
  disabled,
  icon,
  labelText,
  onClick,
  visible,
}) => {
  const Icon = icon;

  return visible ? (
    <Container>
      <button
        aria-label={ariaLabel}
        aria-live={ariaLive}
        className={classnames(className, {
          'pipeline-icon-toolbar__button': true,
          'pipeline-icon-toolbar__button--active': active,
        })}
        disabled={disabled}
        onClick={onClick}
      >
        {Icon && <Icon className="pipeline-icon" />}
        {labelText && (
          <span className="pipeline-toolbar__label">{labelText}</span>
        )}
      </button>
    </Container>
  ) : null;
};

IconButton.propTypes = {
  ariaLabel: PropTypes.string,
  ariaLive: PropTypes.string,
  disabled: PropTypes.bool,
  icon: PropTypes.func,
  labelText: PropTypes.string,
  onClick: PropTypes.func,
  visible: PropTypes.bool,
  active: PropTypes.bool,
};

IconButton.defaultProps = {
  ariaLabel: null,
  ariaLive: null,
  disabled: false,
  icon: null,
  labelText: null,
  onClick: null,
  visible: true,
  active: false,
};

export default IconButton;
