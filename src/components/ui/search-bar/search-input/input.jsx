import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import 'what-input';

import './input.css';

const Input = ({
  disabled,
  label,
  onBlur,
  onChange,
  onFocus,
  placeholder,
  status,
  statusDescription,
  theme,
  value: inputValue,
  variant,
}) => {
  const [focused, setFocused] = useState(false);
  const [value, setValue] = useState(inputValue);

  useEffect(() => {
    if (inputValue !== null) {
      setValue(inputValue);
    }
  }, [inputValue]);

  const _handleFocused = (event) => {
    setFocused(true);

    if (typeof onFocus === 'function') {
      onFocus(event, { focused: true });
    }
  };

  /**
   * _handleBlurred - changes the focus to disabled state.
   */
  const _handleBlurred = (event) => {
    setFocused(false);

    if (typeof onBlur === 'function') {
      onBlur(event, { focused: false, value: event.target.value });
    }
  };

  /**
   * _handleChanged - updates the state with the value from the input and triggers the passed on change callback.
   * @param  {object} event
   */
  const _handleChanged = (event) => {
    setValue(event.target.value);

    if (typeof onChange === 'function') {
      onChange(event, { value: event.target.value });
    }
  };

  // status indicating error or success; ignored when it is default
  const validatedStatus = status !== 'default' ? status : false;
  const hasDescription = status !== 'default' && statusDescription;

  const labelWrapper = label && (
    <div className="search-input__label">{label}</div>
  );

  // description's div has to be always rendered, even if its content is empty
  // to enable the animation to run when the component receives a description; otherwise the animation is ignored
  const description = (
    <div
      className={classnames('search-input__description', {
        'search-input__description--has-content': hasDescription,
      })}
    >
      {statusDescription && (
        <div className="search-input__description-content">
          {statusDescription}
        </div>
      )}
    </div>
  );

  return (
    <div className="kedro search-input-wrapper">
      <div
        className={classnames(
          'kui-input',
          `kui-theme--${theme}`,
          { [`kui-input--${validatedStatus}`]: !!validatedStatus },
          { 'kui-input--disabled': disabled },
          { 'kui-input--focused': focused },
          { 'kui-input--variant-one': variant === 1 },
          { 'kui-input--variant-two': variant === 2 }
        )}
        onFocus={_handleFocused}
        onBlur={_handleBlurred}
      >
        {labelWrapper}
        <input
          className="kui-input__field"
          type="text"
          placeholder={placeholder || ''}
          disabled={disabled}
          value={value || ''}
          onChange={_handleChanged}
          onFocus={_handleFocused}
          onBlur={_handleBlurred}
        />
        <div
          aria-hidden="true"
          className="kui-input__line"
          data-value={value || ''}
        />
      </div>
      {description}
    </div>
  );
};

Input.defaultProps = {
  disabled: false,
  label: null,
  onBlur: null,
  onFocus: null,
  onChange: null,
  placeholder: null,
  status: 'default',
  statusDescription: null,
  theme: 'light',
  value: null,
  variant: 0,
};

Input.propTypes = {
  /**
   * Whether the input should be editable or not.
   */
  disabled: PropTypes.bool,
  /**
   * Label indicating what should be written in the input.
   */
  label: PropTypes.string,
  /**
   * Event listener which will be triggered on losing focus of the input (in other words, on blur).
   */
  onBlur: PropTypes.func,
  /**
   * Event listener which will be triggered when input will gain focus,
   */
  onFocus: PropTypes.func,
  /**
   * Event listener which will be trigerred on change of the input.
   */
  onChange: PropTypes.func,
  /**
   * Placeholder hint text which is displayed inside the input field and dissapers when something is written inside.
   */
  placeholder: PropTypes.string,
  /**
   * Status of the input - either 'default', 'success' or 'error'.
   * Will trigger change in colouring of the component.
   */
  status: PropTypes.oneOf(['error', 'success', 'default']),
  /**
   * Description of the status - either message on success or an error.
   * Will be displayed only if the status is different than 'default'.
   * Can be only a string of arbitrary length, but not HTML or other formats.
   */
  statusDescription: PropTypes.string,
  /**
   * Theme of the input - either 'dark' or 'light'.
   */
  theme: PropTypes.oneOf(['dark', 'light']),
  /**
   * Value to be displayed inside the input field, it is editable and can change if not disabled.
   */
  value: PropTypes.string,
  /**
   * Style variant for displaying status.
   */
  variant: PropTypes.oneOf([0, 1, 2]),
};

export default Input;
