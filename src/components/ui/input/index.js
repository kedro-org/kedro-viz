import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';

import './input.css';

const MIN_HEIGHT = 20;

const Input = ({
  characterLimit = false,
  defaultValue = '',
  size = 'large',
}) => {
  const isLimitSet = characterLimit > 0;
  const ref = useRef(null);
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    setValue(defaultValue);
  }, [defaultValue]);

  useLayoutEffect(() => {
    ref.current.style.height = 'inherit';

    ref.current.style.height = `${Math.max(
      ref.current.scrollHeight,
      MIN_HEIGHT
    )}px`;
  }, [value]);

  const handleChange = (e) => {
    setLimitedLengthText(e.target.value);
  };

  const setLimitedLengthText = useCallback(
    (text) => {
      isLimitSet
        ? setValue(text.slice(0, characterLimit))
        : setValue(text.slice(0));
    },
    [characterLimit, isLimitSet]
  );

  return (
    <>
      <textarea
        className={`input input--${size}`}
        onChange={handleChange}
        ref={ref}
        rows={1}
        value={value}
      />
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
