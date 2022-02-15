import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import './button.css';

/**
 * Generic Kedro Button
 */
const Button = ({ children, onClick, size, mode }) => (
  <span className="kedro button">
    <button
      className={classnames(
        'button__btn',
        `button__btn--${size}`,
        `button__btn--${mode}`
      )}
      onClick={onClick}
    >
      {children}
    </button>
  </span>
);

Button.defaultProps = {
  onClick: null,
  size: 'regular',
  mode: 'primary',
};

Button.propTypes = {
  onClick: PropTypes.func,
  size: PropTypes.oneOf(['regular', 'small']),
  mode: PropTypes.oneOf(['primary', 'secondary']),
};

export default Button;
