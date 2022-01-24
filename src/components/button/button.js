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
const Button = ({ onClick, children, size }) => (
  <span className="kedro kui-button">
    <button
      className={classnames('kui-button__btn', `kui-button__btn--${size}`)}
      onClick={onClick}
    >
      {children}
    </button>
  </span>
);

Button.defaultProps = {
  onClick: null,
  size: 'regular',
};

Button.propTypes = {
  /**
   * Handle click events
   */
  onClick: PropTypes.func,
  /**
   * Button size
   */
  size: PropTypes.oneOf(['regular', 'small']),
};

export default Button;
