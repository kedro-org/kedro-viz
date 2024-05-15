import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import './button.scss';

/**
 * Generic Kedro Button
 */
const Button = ({
  children,
  dataTest = 'TestDefaultDataValue',
  disabled = false,
  onClick,
  size = 'regular',
  mode = 'primary',
}) => (
  <span className="kedro button">
    <button
      className={classnames(
        'button__btn',
        `button__btn--${size}`,
        `button__btn--${mode}`
      )}
      data-test={dataTest}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  </span>
);

Button.propTypes = {
  dataTest: PropTypes.string,
  disabled: PropTypes.bool,
  mode: PropTypes.oneOf(['primary', 'secondary', 'success']),
  onClick: PropTypes.func,
  size: PropTypes.oneOf(['regular', 'small']),
};

export default Button;
