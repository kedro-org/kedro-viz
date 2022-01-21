import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import 'what-input';

import './button.css';

/**
 * Button component with various styling options:
 * Change colour theme, style type, size and hover animation type using props.
 * Also handles onClick events, allows any children (including Icon components),
 * and can be disabled by passing disabled=true.
 * @return {object} JSX button element
 */
const Button = ({
  animation,
  children,
  disabled,
  onClick,
  size,
  theme,
  type,
  mode,
}) => (
  <span className="kedro kui-button">
    <button
      type={type}
      className={classnames(
        'kui-button__btn',
        `kui-button__btn--${animation}`,
        `kui-button__btn--${size}`,
        `kui-button__btn--${mode}`,
        `kui-theme--${theme}`
      )}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  </span>
);

Button.defaultProps = {
  animation: 'fade',
  disabled: false,
  mode: 'primary',
  onClick: null,
  size: 'regular',
  theme: 'dark',
  type: 'button',
};

Button.propTypes = {
  /**
   * The style of hover animation
   */
  animation: PropTypes.oneOf(['fade', 'wipe']),
  /**
   * The displayed button value
   */
  children: PropTypes.node,
  /**
   * True if disabled
   */
  disabled: PropTypes.bool,
  /**
   * Button style - either with a border or minimal with an underline on hover
   */
  mode: PropTypes.oneOf(['primary', 'secondary']),
  /**
   * Handle click events
   */
  onClick: PropTypes.func,
  /**
   * Button size
   */
  size: PropTypes.oneOf(['regular', 'small']),
  /**
   * Theme of the button
   */
  theme: PropTypes.oneOf(['dark', 'light']),
  /**
   * Native button type, e.g. 'button', 'submit', etc
   */
  type: PropTypes.string,
};

export default Button;
