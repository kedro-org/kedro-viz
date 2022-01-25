import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import './button.css';

/**
 * Generic Kedro Button
 */
const Button = ({ onClick, size, children }) => (
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
  onClick: PropTypes.func,
  size: PropTypes.oneOf(['regular', 'small']),
};

export default Button;
