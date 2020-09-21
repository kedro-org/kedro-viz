import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import icons from '../icons';
import './icon-button.css';

/**
 * Icon button component
 * @param {Function} onToggle Handle toggling theme between light/dark
 * @param {string} theme Kedro UI light/dark theme
 */
const IconButton = ({
  ariaLabel,
  ariaLive,
  className,
  disabled,
  icon,
  labelText,
  onClick,
  visible,
  active
}) => {
  const Icon = icons[icon];

  return visible ? (
    <li>
      <button
        aria-label={ariaLabel}
        aria-live={ariaLive}
        className={classnames(className, {
          'pipeline-icon-toolbar__button': true,
          'pipeline-icon-toolbar__button--active': active
        })}
        disabled={disabled}
        onClick={onClick}>
        <span className="pipeline-toolbar__label">{labelText}</span>
        <Icon className={`pipeline-icon pipeline-icon-${icon}`} />
      </button>
    </li>
  ) : null;
};

IconButton.propTypes = {
  ariaLabel: PropTypes.string,
  ariaLive: PropTypes.string,
  disabled: PropTypes.bool,
  icon: PropTypes.string,
  labelText: PropTypes.string,
  onClick: PropTypes.func,
  visible: PropTypes.bool,
  active: PropTypes.bool
};

IconButton.defaultProps = {
  ariaLabel: null,
  ariaLive: null,
  disabled: false,
  icon: 'label',
  labelText: null,
  onClick: null,
  visible: true,
  active: false
};

export default IconButton;
