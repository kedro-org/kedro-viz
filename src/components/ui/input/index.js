import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';

import './input.scss';

const MIN_HEIGHT = 20;

const Input = ({
  characterLimit = false,
  defaultValue = '',
  onChange,
  placeholder,
  resetValueTrigger,
  size = 'large',
  dataTest,
  type,
}) => {
  const isLimitSet = characterLimit > 0;
  const ref = useRef(null);
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    setValue(defaultValue);
  }, [defaultValue]);

  useEffect(() => {
    setValue(defaultValue);
  }, [defaultValue, resetValueTrigger]);

  useLayoutEffect(() => {
    ref.current.style.height = 'inherit';

    ref.current.style.height = `${Math.max(
      ref.current.scrollHeight,
      MIN_HEIGHT
    )}px`;
  }, [value]);

  const handleChange = (e) => {
    const value = e.target.value;

    if (isLimitSet) {
      setValue(value.slice(0, characterLimit));
      onChange && onChange(value.slice(0, characterLimit));
    } else {
      setValue(value.slice(0));
      onChange && onChange(value.slice(0));
    }
  };

  const inputElement =
    type === 'textarea' ? (
      <textarea
        className={`input input--${size}`}
        onChange={handleChange}
        placeholder={placeholder}
        ref={ref}
        rows={1}
        value={value}
        data-test={dataTest}
      />
    ) : (
      <input
        type={type}
        className={`input input--${size}`}
        onChange={handleChange}
        placeholder={placeholder}
        ref={ref}
        value={value}
        data-test={dataTest}
      />
    );

  return (
    <>
      {inputElement}
      {isLimitSet ? (
        <div className="input-character-count">
          <span>
            <span className="input-number-characters">{value.length}</span>/
            {characterLimit} characters
          </span>
        </div>
      ) : null}
    </>
  );
};

export default Input;
